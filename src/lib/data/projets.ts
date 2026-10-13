/**
 * Projets du CDI (prix littéraire, semaine de la presse, exposition…).
 * Un projet a des dates, des participants (classes et/ou groupes) et des passages rattachés pendant la saisie.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { instantParis } from "@/lib/temps";
import { ErreurMetier } from "./college";

export type EtatProjet = "a_venir" | "en_cours" | "termine";

export function etatProjet(p: { debut: string; fin: string | null }, jour = instantParis().jour): EtatProjet {
  if (jour < p.debut) return "a_venir";
  if (p.fin && jour > p.fin) return "termine";
  return "en_cours";
}

export async function listerProjets(collegeId: string) {
  const rows = await db.execute<{
    id: string; nom: string; description: string; partenaires: string; debut: string; fin: string | null; classes: string[];
    groupes: string[] | null; passages: number; eleves: number;
  }>(sql`
    SELECT p.id, p.nom, p.description, p.partenaires, to_char(p.debut, 'YYYY-MM-DD') AS debut, to_char(p.fin, 'YYYY-MM-DD') AS fin, p.classes,
      (SELECT array_agg(g.nom ORDER BY g.nom) FROM projet_groupes pg JOIN groupes g ON g.id = pg.groupe_id WHERE pg.projet_id = p.id) AS groupes,
      (SELECT count(*)::int FROM passages x WHERE x.projet_id = p.id) AS passages,
      (SELECT count(DISTINCT x.eleve_id)::int FROM passages x WHERE x.projet_id = p.id) AS eleves
    FROM projets p WHERE p.college_id = ${collegeId}
    ORDER BY p.debut DESC, lower(p.nom)`);
  const jour = instantParis().jour;
  return rows.map((r) => ({ ...r, groupes: r.groupes ?? [], etat: etatProjet(r, jour) }));
}

export async function lireProjet(collegeId: string, projetId: string) {
  const [p] = await db.select().from(schema.projets).where(and(eq(schema.projets.id, projetId), eq(schema.projets.collegeId, collegeId)));
  if (!p) return null;
  const gs = await db.select({ id: schema.projetGroupes.groupeId }).from(schema.projetGroupes).where(eq(schema.projetGroupes.projetId, projetId));
  return { ...p, groupeIds: gs.map((g) => g.id), etat: etatProjet(p) };
}

/** Projets ouverts aujourd'hui, proposés pendant la saisie. */
export async function projetsEnCours(collegeId: string, jour = instantParis().jour) {
  return db.execute<{ id: string; nom: string }>(sql`
    SELECT id, nom FROM projets
    WHERE college_id = ${collegeId} AND debut <= ${jour} AND (fin IS NULL OR fin >= ${jour})
    ORDER BY lower(nom)`);
}

export type ProjetSaisi = {
  nom: string; description: string; partenaires: string; debut: string; fin: string | null; classes: string[]; groupeIds: string[];
};

async function verifier(collegeId: string, d: ProjetSaisi) {
  const nom = d.nom.trim();
  if (nom.length < 2) throw new ErreurMetier("Donnez un nom au projet.");
  if (nom.length > 80) throw new ErreurMetier("Le nom du projet est trop long (80 caractères au maximum).");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.debut)) throw new ErreurMetier("Indiquez la date de début du projet.");
  const fin = d.fin && d.fin.trim() ? d.fin.trim() : null;
  if (fin && !/^\d{4}-\d{2}-\d{2}$/.test(fin)) throw new ErreurMetier("La date de fin n'est pas valide.");
  if (fin && fin < d.debut) throw new ErreurMetier("La date de fin doit être après la date de début.");
  const groupeIds = [...new Set(d.groupeIds)];
  if (groupeIds.length) {
    const ok = await db.select({ id: schema.groupes.id }).from(schema.groupes)
      .where(and(eq(schema.groupes.collegeId, collegeId), inArray(schema.groupes.id, groupeIds)));
    if (ok.length !== groupeIds.length) throw new ErreurMetier("Un des groupes n'appartient pas à ce collège.");
  }
  const classes = [...new Set(d.classes.map((c) => c.trim().toUpperCase()).filter(Boolean))].slice(0, 60);
  return {
    nom, fin, groupeIds, classes, debut: d.debut,
    description: d.description.trim().slice(0, 2000), partenaires: d.partenaires.trim().slice(0, 300),
  };
}

export async function creerProjet(collegeId: string, d: ProjetSaisi) {
  const v = await verifier(collegeId, d);
  return db.transaction(async (tx) => {
    const [p] = await tx.insert(schema.projets).values({
      collegeId, nom: v.nom, description: v.description, partenaires: v.partenaires, debut: v.debut, fin: v.fin, classes: v.classes,
    }).returning();
    if (v.groupeIds.length) await tx.insert(schema.projetGroupes).values(v.groupeIds.map((groupeId) => ({ projetId: p.id, groupeId })));
    return p;
  });
}

export async function modifierProjet(collegeId: string, projetId: string, d: ProjetSaisi) {
  if (!(await lireProjet(collegeId, projetId))) throw new ErreurMetier("Ce projet n'existe pas.");
  const v = await verifier(collegeId, d);
  await db.transaction(async (tx) => {
    await tx.update(schema.projets).set({
      nom: v.nom, description: v.description, partenaires: v.partenaires, debut: v.debut, fin: v.fin, classes: v.classes,
    }).where(eq(schema.projets.id, projetId));
    await tx.delete(schema.projetGroupes).where(eq(schema.projetGroupes.projetId, projetId));
    if (v.groupeIds.length) await tx.insert(schema.projetGroupes).values(v.groupeIds.map((groupeId) => ({ projetId, groupeId })));
  });
}

/** Supprime le projet ; ses passages restent dans les statistiques générales, sans projet. */
export async function supprimerProjet(collegeId: string, projetId: string) {
  const r = await db.delete(schema.projets).where(and(eq(schema.projets.id, projetId), eq(schema.projets.collegeId, collegeId))).returning({ id: schema.projets.id });
  if (!r.length) throw new ErreurMetier("Ce projet n'existe pas.");
}

/** Condition SQL « l'élève e participe au projet » (classes ou groupes du projet). */
export const participeAuProjet = (projetId: string) => sql`(
  e.division = ANY (SELECT unnest(classes) FROM projets WHERE id = ${projetId})
  OR e.id IN (SELECT ge.eleve_id FROM projet_groupes pg JOIN groupe_eleves ge ON ge.groupe_id = pg.groupe_id WHERE pg.projet_id = ${projetId})
)`;

/** Bilan d'un projet : passages rattachés, participants venus, motifs, classes, semaines, derniers passages. */
export async function bilanProjet(collegeId: string, projetId: string) {
  const projet = await lireProjet(collegeId, projetId);
  if (!projet) return null;
  const aParticipants = projet.classes.length > 0 || projet.groupeIds.length > 0;
  const [tot, participants, venusParticipants, parMotif, parClasse, parSemaine, derniers] = await Promise.all([
    db.execute<{ passages: number; eleves: number; seances: number }>(sql`
      SELECT count(*)::int AS passages, count(DISTINCT eleve_id)::int AS eleves, count(DISTINCT (jour, minute / 30))::int AS seances
      FROM passages WHERE college_id = ${collegeId} AND projet_id = ${projetId}`),
    aParticipants ? db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM eleves e WHERE e.college_id = ${collegeId} AND e.actif AND ${participeAuProjet(projetId)}`) : Promise.resolve([{ n: 0 }]),
    aParticipants ? db.execute<{ n: number }>(sql`
      SELECT count(DISTINCT e.id)::int AS n FROM eleves e JOIN passages p ON p.eleve_id = e.id AND p.projet_id = ${projetId}
      WHERE e.college_id = ${collegeId} AND e.actif AND ${participeAuProjet(projetId)}`) : Promise.resolve([{ n: 0 }]),
    db.execute<{ libelle: string; ordre: number; n: number }>(sql`
      SELECT m.libelle, m.ordre, count(*)::int AS n FROM passages p JOIN motifs m ON m.id = p.motif_id
      WHERE p.college_id = ${collegeId} AND p.projet_id = ${projetId} GROUP BY 1, 2 ORDER BY n DESC`),
    db.execute<{ division: string; n: number; eleves: number }>(sql`
      SELECT e.division, count(*)::int AS n, count(DISTINCT e.id)::int AS eleves FROM passages p JOIN eleves e ON e.id = p.eleve_id
      WHERE p.college_id = ${collegeId} AND p.projet_id = ${projetId} GROUP BY 1 ORDER BY 1`),
    db.execute<{ semaine: string; n: number }>(sql`
      SELECT to_char(date_trunc('week', jour), 'YYYY-MM-DD') AS semaine, count(*)::int AS n
      FROM passages WHERE college_id = ${collegeId} AND projet_id = ${projetId} GROUP BY 1 ORDER BY 1`),
    db.select({ jour: schema.passages.jour, minute: schema.passages.minute, nom: schema.eleves.nom, prenom: schema.eleves.prenom, division: schema.eleves.division })
      .from(schema.passages).innerJoin(schema.eleves, eq(schema.eleves.id, schema.passages.eleveId))
      .where(and(eq(schema.passages.collegeId, collegeId), eq(schema.passages.projetId, projetId)))
      .orderBy(desc(schema.passages.jour), desc(schema.passages.minute)).limit(10),
  ]);
  return {
    projet, ...tot[0], aParticipants, participants: participants[0].n, participantsVenus: venusParticipants[0].n,
    parMotif, parClasse, parSemaine, derniers,
  };
}
