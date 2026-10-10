/**
 * Demandes de création de collège et invitations.
 *
 * Parcours :
 *  1. Un professeur documentaliste remplit « Créer un collège » (sans être connecté) → deposerDemande()
 *     → un e-mail prévient le super-administrateur.
 *  2. Le super-administrateur confirme → accepterDemande() : le collège et le compte administrateur
 *     sont créés, et un e-mail d'invitation est envoyé au documentaliste.
 *  3. Le documentaliste clique sur le lien, choisit son mot de passe → activerCompte().
 */
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, asc, desc, eq, gt, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { ACADEMIES } from "@/lib/academies";
import { envoyerEmail, gabarit, urlApplication } from "@/lib/email";
import { anneeScolaireCourante } from "@/lib/temps";
import { creerCollege, ErreurMetier, normaliserUai } from "./college";

const DUREE_INVITATION_JOURS = 7;
const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

export type NouvelleDemande = {
  nom: string; ville: string; codePostal: string; academie: string; uai?: string; email: string;
};

/** Adresses des super-administrateurs à prévenir. */
async function adressesSuperAdmins() {
  const rows = await db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.role, "superadmin"));
  const env = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  return [...new Set([...rows.map((r) => r.email), ...(env ? [env] : [])])];
}

export async function deposerDemande(d: NouvelleDemande) {
  const nom = d.nom.trim(), ville = d.ville.trim(), codePostal = d.codePostal.trim();
  const email = d.email.trim().toLowerCase();
  if (nom.length < 3) throw new ErreurMetier("Indiquez le nom du collège.");
  if (!ville) throw new ErreurMetier("Indiquez la ville.");
  if (!/^\d{5}$/.test(codePostal)) throw new ErreurMetier("Le code postal doit comporter 5 chiffres.");
  if (!ACADEMIES.includes(d.academie)) throw new ErreurMetier("Choisissez l'académie dans la liste.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErreurMetier("L'adresse e-mail n'est pas valide.");
  const uai = normaliserUai(d.uai);

  const [compte] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
  if (compte) throw new ErreurMetier("Un compte existe déjà avec cette adresse e-mail. Connectez-vous, ou contactez l'administrateur de votre collège.");
  const [enCours] = await db.select({ id: schema.demandesCollege.id }).from(schema.demandesCollege)
    .where(and(eq(schema.demandesCollege.emailDocumentaliste, email), eq(schema.demandesCollege.statut, "en_attente")));
  if (enCours) throw new ErreurMetier("Une demande est déjà en cours pour cette adresse e-mail. Vous recevrez un message dès qu'elle sera traitée.");
  if (uai) {
    const [existe] = await db.select({ id: schema.colleges.id }).from(schema.colleges).where(eq(schema.colleges.uai, uai));
    if (existe) throw new ErreurMetier("Ce collège (code UAI) utilise déjà l'application. Contactez son administrateur.");
  }

  const [demande] = await db.insert(schema.demandesCollege).values({
    nom, ville, codePostal, academie: d.academie, uai, emailDocumentaliste: email,
  }).returning();

  const destinataires = await adressesSuperAdmins();
  if (destinataires.length) {
    const m = gabarit("Nouvelle demande de collège", [
      `${nom} (${codePostal} ${ville}, académie de ${d.academie}) souhaite utiliser Passages CDI.`,
      `Professeur documentaliste : ${email}${uai ? ` · UAI : ${uai}` : ""}`,
      "Connectez-vous pour confirmer ou refuser la demande.",
    ], { texte: "Voir les demandes", lien: urlApplication("/admin") });
    await envoyerEmail({ a: destinataires, sujet: `Nouvelle demande : ${nom}`, ...m });
  }
  return demande;
}

export async function listerDemandes(statut: "en_attente" | "traitees") {
  return db.select().from(schema.demandesCollege)
    .where(statut === "en_attente"
      ? eq(schema.demandesCollege.statut, "en_attente")
      : inArray(schema.demandesCollege.statut, ["acceptee", "refusee"]))
    .orderBy(statut === "en_attente" ? asc(schema.demandesCollege.createdAt) : desc(schema.demandesCollege.traiteeLe))
    .limit(statut === "en_attente" ? 200 : 20);
}

/** Crée un lien d'invitation (valable 7 jours) et l'envoie par e-mail. */
export async function envoyerInvitation(userId: string) {
  const [u] = await db.select({ u: schema.users, c: schema.colleges }).from(schema.users)
    .innerJoin(schema.colleges, eq(schema.colleges.id, schema.users.collegeId)).where(eq(schema.users.id, userId));
  if (!u) throw new ErreurMetier("Compte introuvable.");
  const jeton = randomBytes(32).toString("base64url");
  await db.insert(schema.jetons).values({
    id: empreinte(jeton), userId, expiresAt: new Date(Date.now() + DUREE_INVITATION_JOURS * 86_400_000),
  });
  const lien = urlApplication(`/activation/${jeton}`);
  const m = gabarit("Votre espace Passages CDI est prêt", [
    "Bonjour,",
    `L'espace de ${u.c.nom} (${u.c.commune}) a été créé. Vous en êtes l'administrateur.`,
    "Pour y accéder, choisissez votre mot de passe en cliquant sur le bouton ci-dessous. Ce lien est valable 7 jours et ne fonctionne qu'une fois.",
    `Votre identifiant de connexion sera : ${u.u.email}`,
  ], { texte: "Choisir mon mot de passe", lien });
  await envoyerEmail({ a: u.u.email, sujet: `Votre espace Passages CDI : ${u.c.nom}`, ...m });
  return jeton;
}

/** Le super-administrateur confirme une demande : création du collège, du compte et envoi de l'invitation. */
export async function accepterDemande(demandeId: string) {
  const [d] = await db.select().from(schema.demandesCollege).where(eq(schema.demandesCollege.id, demandeId));
  if (!d) throw new ErreurMetier("Demande introuvable.");
  if (d.statut !== "en_attente") throw new ErreurMetier("Cette demande a déjà été traitée.");
  const college = await creerCollege({
    nom: d.nom, uai: d.uai, commune: d.ville, codePostal: d.codePostal, academie: d.academie,
    anneeScolaire: anneeScolaireCourante(),
    admin: { email: d.emailDocumentaliste, nom: "Professeur documentaliste" },
  });
  await db.update(schema.demandesCollege).set({ statut: "acceptee", collegeId: college.id, traiteeLe: new Date() })
    .where(eq(schema.demandesCollege.id, demandeId));
  await envoyerInvitation(college.adminId);
  return college;
}

export async function refuserDemande(demandeId: string) {
  const [d] = await db.update(schema.demandesCollege).set({ statut: "refusee", traiteeLe: new Date() })
    .where(and(eq(schema.demandesCollege.id, demandeId), eq(schema.demandesCollege.statut, "en_attente")))
    .returning();
  if (!d) throw new ErreurMetier("Cette demande a déjà été traitée.");
  const m = gabarit("Votre demande Passages CDI", [
    "Bonjour,",
    `Votre demande d'ouverture d'un espace pour ${d.nom} n'a pas pu être validée.`,
    "Si vous pensez qu'il s'agit d'une erreur, répondez simplement à ce message.",
  ]);
  await envoyerEmail({ a: d.emailDocumentaliste, sujet: "Votre demande Passages CDI", ...m });
}

/** Comptes d'un collège qui n'ont pas encore choisi leur mot de passe. */
export async function invitationsEnAttente() {
  return db.select({ userId: schema.users.id, collegeId: schema.users.collegeId, email: schema.users.email })
    .from(schema.users).where(and(isNull(schema.users.passwordHash), eq(schema.users.role, "admin")));
}

/** Renvoie l'invitation (nouveau lien) au compte administrateur d'un collège qui ne l'a pas encore utilisée. */
export async function renvoyerInvitation(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u || u.passwordHash) throw new ErreurMetier("Ce compte a déjà choisi son mot de passe.");
  return envoyerInvitation(userId);
}

/** Lit un lien d'invitation ; null s'il est inconnu, expiré ou déjà utilisé. */
export async function lireInvitation(jeton: string) {
  const [r] = await db.select({ email: schema.users.email, userId: schema.users.id, college: schema.colleges.nom })
    .from(schema.jetons)
    .innerJoin(schema.users, eq(schema.users.id, schema.jetons.userId))
    .leftJoin(schema.colleges, eq(schema.colleges.id, schema.users.collegeId))
    .where(and(eq(schema.jetons.id, empreinte(jeton)), isNull(schema.jetons.utiliseLe), gt(schema.jetons.expiresAt, new Date())));
  return r ?? null;
}

/** Enregistre le mot de passe choisi et invalide le lien. Renvoie l'identifiant du compte. */
export async function activerCompte(jeton: string, motDePasse: string, confirmation: string) {
  if (motDePasse.length < 10) throw new ErreurMetier("Le mot de passe doit comporter au moins 10 caractères.");
  if (motDePasse !== confirmation) throw new ErreurMetier("Les deux mots de passe ne sont pas identiques.");
  const invitation = await lireInvitation(jeton);
  if (!invitation) throw new ErreurMetier("Ce lien n'est plus valable. Demandez un nouveau lien au super-administrateur.");
  const hash = await bcrypt.hash(motDePasse, 10);
  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ passwordHash: hash }).where(eq(schema.users.id, invitation.userId));
    // Tous les liens de ce compte deviennent inutilisables
    await tx.update(schema.jetons).set({ utiliseLe: new Date() })
      .where(and(eq(schema.jetons.userId, invitation.userId), isNull(schema.jetons.utiliseLe)));
  });
  return invitation.userId;
}
