/** Collèges, paramétrage et comptes. Chaque fonction reçoit l'identifiant du collège concerné. */
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { MOTIFS_DEFAUT, MAX_MOTIFS, TYPES_PLAGE_DEFAUT, plagesDefaut } from "@/lib/defauts";
import { verifierHoraires, type PlageSaisie } from "@/lib/horaires";
import bcrypt from "bcryptjs";

export class ErreurMetier extends Error {}

export type NouveauCollege = {
  nom: string; uai?: string | null; commune: string; codePostal?: string; academie?: string; anneeScolaire: string;
  /** Sans mot de passe, le compte attend que la personne le choisisse via le lien d'invitation. */
  admin: { email: string; nom: string; motDePasse?: string };
};

/** « 0341234a » → « 0341234A » ; chaîne vide → null. Lève une erreur si le format est faux. */
export function normaliserUai(uai: string | null | undefined): string | null {
  const u = (uai ?? "").trim().toUpperCase();
  if (!u) return null;
  if (!/^\d{7}[A-Z]$/.test(u)) throw new ErreurMetier("Le code UAI doit comporter 7 chiffres suivis d'une lettre, par exemple 0341234A.");
  return u;
}

/** Crée un collège avec un paramétrage par défaut et son premier compte administrateur. */
export async function creerCollege(c: NouveauCollege) {
  const uai = normaliserUai(c.uai);
  if (c.admin.motDePasse !== undefined && c.admin.motDePasse.length < 10) throw new ErreurMetier("Le mot de passe doit comporter au moins 10 caractères.");
  const email = c.admin.email.trim().toLowerCase();
  const [existe] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (existe) throw new ErreurMetier("Un compte existe déjà avec cette adresse e-mail.");
  if (uai) {
    const [dejaUai] = await db.select({ id: schema.colleges.id }).from(schema.colleges).where(eq(schema.colleges.uai, uai));
    if (dejaUai) throw new ErreurMetier("Un collège existe déjà avec ce code UAI.");
  }

  const hash = c.admin.motDePasse ? await bcrypt.hash(c.admin.motDePasse, 10) : null;
  return db.transaction(async (tx) => {
    const [col] = await tx.insert(schema.colleges).values({
      nom: c.nom.trim(), uai, commune: c.commune.trim(), codePostal: (c.codePostal ?? "").trim(), academie: c.academie ?? "",
      anneeScolaire: c.anneeScolaire, typesPlage: TYPES_PLAGE_DEFAUT,
    }).returning();
    await tx.insert(schema.plages).values(plagesDefaut().map((p) => ({ ...p, collegeId: col.id })));
    await tx.insert(schema.motifs).values(MOTIFS_DEFAUT.map((libelle, i) => ({ collegeId: col.id, libelle, ordre: i + 1 })));
    const [admin] = await tx.insert(schema.users).values({ collegeId: col.id, email, nom: c.admin.nom.trim(), passwordHash: hash, role: "admin" }).returning({ id: schema.users.id });
    return { ...col, adminId: admin.id };
  });
}

export async function listerColleges() {
  return db.select().from(schema.colleges).orderBy(asc(schema.colleges.nom));
}

export async function lireCollege(collegeId: string) {
  const [c] = await db.select().from(schema.colleges).where(eq(schema.colleges.id, collegeId));
  if (!c) throw new ErreurMetier("Collège introuvable.");
  return c;
}

export async function modifierEtablissement(collegeId: string, d: { nom: string; uai: string; commune: string; codePostal: string; academie: string; anneeScolaire: string }) {
  if (!d.nom.trim()) throw new ErreurMetier("Indiquez le nom du collège.");
  const uai = normaliserUai(d.uai);
  if (!/^\d{4}-\d{4}$/.test(d.anneeScolaire)) throw new ErreurMetier("L'année scolaire doit être au format 2026-2027.");
  if (d.codePostal.trim() && !/^\d{5}$/.test(d.codePostal.trim())) throw new ErreurMetier("Le code postal doit comporter 5 chiffres.");
  if (uai) {
    const [autre] = await db.select({ id: schema.colleges.id }).from(schema.colleges).where(eq(schema.colleges.uai, uai));
    if (autre && autre.id !== collegeId) throw new ErreurMetier("Ce code UAI est déjà utilisé par un autre collège.");
  }
  await db.update(schema.colleges)
    .set({ nom: d.nom.trim(), uai, commune: d.commune.trim(), codePostal: d.codePostal.trim(), academie: d.academie, anneeScolaire: d.anneeScolaire })
    .where(eq(schema.colleges.id, collegeId));
}

export async function lirePlages(collegeId: string) {
  return db.select().from(schema.plages).where(eq(schema.plages.collegeId, collegeId))
    .orderBy(asc(schema.plages.jour), asc(schema.plages.debut));
}

/** Remplace les types de plage et toutes les plages de la semaine. */
export async function enregistrerHoraires(collegeId: string, types: string[], plages: PlageSaisie[]) {
  const t = [...new Set(types.map((x) => x.trim()).filter(Boolean))];
  if (!t.length) throw new ErreurMetier("Gardez au moins un type de plage.");
  const erreurs = verifierHoraires(plages, t);
  if (erreurs.length) throw new ErreurMetier(erreurs.join(" "));
  await db.transaction(async (tx) => {
    await tx.update(schema.colleges).set({ typesPlage: t }).where(eq(schema.colleges.id, collegeId));
    await tx.delete(schema.plages).where(eq(schema.plages.collegeId, collegeId));
    if (plages.length) await tx.insert(schema.plages).values(plages.map((p) => ({ ...p, collegeId })));
  });
}

export async function lireMotifs(collegeId: string, toutes = false) {
  const cond = toutes ? eq(schema.motifs.collegeId, collegeId)
    : and(eq(schema.motifs.collegeId, collegeId), eq(schema.motifs.actif, true));
  return db.select().from(schema.motifs).where(cond).orderBy(asc(schema.motifs.ordre));
}

/**
 * Enregistre la liste des motifs dans l'ordre voulu.
 * Les motifs retirés sont désactivés (pas supprimés) pour garder les statistiques passées.
 */
export async function enregistrerMotifs(collegeId: string, liste: { id?: string; libelle: string }[]) {
  const propres = liste.map((m) => ({ ...m, libelle: m.libelle.trim() }));
  if (!propres.length) throw new ErreurMetier("Gardez au moins un motif.");
  if (propres.length > MAX_MOTIFS) throw new ErreurMetier(`${MAX_MOTIFS} motifs au maximum.`);
  if (propres.some((m) => !m.libelle)) throw new ErreurMetier("Un motif est vide. Donnez-lui un nom ou supprimez-le.");
  const existants = await lireMotifs(collegeId, true);
  const ids = new Set(existants.map((m) => m.id));
  await db.transaction(async (tx) => {
    await tx.update(schema.motifs).set({ actif: false, ordre: 99 }).where(eq(schema.motifs.collegeId, collegeId));
    for (const [i, m] of propres.entries()) {
      if (m.id && ids.has(m.id)) {
        await tx.update(schema.motifs).set({ libelle: m.libelle, ordre: i + 1, actif: true })
          .where(and(eq(schema.motifs.id, m.id), eq(schema.motifs.collegeId, collegeId)));
      } else {
        await tx.insert(schema.motifs).values({ collegeId, libelle: m.libelle, ordre: i + 1 });
      }
    }
  });
  return lireMotifs(collegeId);
}

export async function lireComptes(collegeId: string) {
  return db.select({ id: schema.users.id, nom: schema.users.nom, email: schema.users.email, role: schema.users.role })
    .from(schema.users).where(eq(schema.users.collegeId, collegeId)).orderBy(asc(schema.users.nom));
}

export async function ajouterCompte(collegeId: string, d: { nom: string; email: string; motDePasse: string; role: "admin" | "utilisateur" }) {
  const email = d.email.trim().toLowerCase();
  if (!d.nom.trim()) throw new ErreurMetier("Indiquez le nom de la personne.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErreurMetier("L'adresse e-mail n'est pas valide.");
  if (d.motDePasse.length < 10) throw new ErreurMetier("Le mot de passe doit comporter au moins 10 caractères.");
  const [existe] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (existe) throw new ErreurMetier("Un compte existe déjà avec cette adresse e-mail.");
  await db.insert(schema.users).values({
    collegeId, email, nom: d.nom.trim(), role: d.role, passwordHash: await bcrypt.hash(d.motDePasse, 10),
  });
}

export async function supprimerCompte(collegeId: string, userId: string, moi: string) {
  if (userId === moi) throw new ErreurMetier("Vous ne pouvez pas supprimer votre propre compte.");
  await db.delete(schema.users).where(and(eq(schema.users.id, userId), eq(schema.users.collegeId, collegeId)));
}
