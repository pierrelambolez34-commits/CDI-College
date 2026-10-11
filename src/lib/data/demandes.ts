/**
 * Inscription d'un collège et activation du compte.
 *
 * Parcours :
 *  1. Le professeur documentaliste remplit « Création d'un collège » (sans être connecté) → inscrireCollege() :
 *     le collège et son compte administrateur sont créés tout de suite, et un e-mail d'activation est envoyé.
 *  2. Il clique sur le lien, choisit son mot de passe → activerCompte().
 *  3. À la connexion, il est conduit dans le parcours d'accueil en 4 étapes (voir /bienvenue).
 */
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { ACADEMIES } from "@/lib/academies";
import { envoyerEmail, gabarit, urlApplication } from "@/lib/email";
import { anneeScolaireCourante } from "@/lib/temps";
import { creerCollege, ErreurMetier, normaliserUai } from "./college";

const DUREE_INVITATION_JOURS = 7;
const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

export type Inscription = {
  nom: string; ville: string; codePostal: string; academie: string; uai?: string; email: string;
};

/**
 * Crée le collège et son compte administrateur, puis envoie l'e-mail d'activation.
 * Si un compte existe déjà avec cette adresse mais n'a jamais été activé, renvoie simplement un nouveau lien.
 * Renvoie le jeton d'activation (utilisé en mode test pour afficher le lien).
 */
export async function inscrireCollege(d: Inscription) {
  const nom = d.nom.trim(), ville = d.ville.trim(), codePostal = d.codePostal.trim();
  const email = d.email.trim().toLowerCase();
  if (nom.length < 3) throw new ErreurMetier("Indiquez le nom du collège.");
  if (!ville) throw new ErreurMetier("Indiquez la ville.");
  if (!/^\d{5}$/.test(codePostal)) throw new ErreurMetier("Le code postal doit comporter 5 chiffres.");
  if (!ACADEMIES.includes(d.academie)) throw new ErreurMetier("Choisissez l'académie dans la liste.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ErreurMetier("L'adresse e-mail n'est pas valide.");
  const uai = normaliserUai(d.uai);

  const [compte] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (compte) {
    if (!compte.passwordHash && compte.collegeId) return { jeton: await envoyerInvitation(compte.id), dejaInscrit: true };
    throw new ErreurMetier("Un compte existe déjà avec cette adresse e-mail. Connectez-vous, ou demandez l'accès à l'administrateur de votre collège.");
  }
  if (uai) {
    const [existe] = await db.select({ id: schema.colleges.id }).from(schema.colleges).where(eq(schema.colleges.uai, uai));
    if (existe) throw new ErreurMetier("Ce collège (code UAI) utilise déjà l'application. Demandez l'accès à son administrateur.");
  }

  const college = await creerCollege({
    nom, uai, commune: ville, codePostal, academie: d.academie, anneeScolaire: anneeScolaireCourante(),
    admin: { email, nom: "Professeur documentaliste" },
  });
  return { jeton: await envoyerInvitation(college.adminId), dejaInscrit: false };
}

/** Crée un lien d'activation (valable 7 jours, une seule utilisation) et l'envoie par e-mail. */
export async function envoyerInvitation(userId: string) {
  const [u] = await db.select({ u: schema.users, c: schema.colleges }).from(schema.users)
    .innerJoin(schema.colleges, eq(schema.colleges.id, schema.users.collegeId)).where(eq(schema.users.id, userId));
  if (!u) throw new ErreurMetier("Compte introuvable.");
  const jeton = randomBytes(32).toString("base64url");
  await db.insert(schema.jetons).values({
    id: empreinte(jeton), userId, expiresAt: new Date(Date.now() + DUREE_INVITATION_JOURS * 86_400_000),
  });
  const lien = urlApplication(`/activation/${jeton}`);
  const m = gabarit("Activez votre espace Passages CDI", [
    "Bonjour,",
    `L'espace CDI de ${u.c.nom} (${u.c.commune}) est créé. Vous en êtes l'administrateur.`,
    "Pour l'activer, choisissez votre mot de passe en cliquant sur le bouton ci-dessous. Ce lien est valable 7 jours et ne fonctionne qu'une fois.",
    "Vous serez ensuite guidé en 4 étapes : votre établissement, les horaires du CDI, les motifs de venue et l'import des élèves.",
    `Votre identifiant de connexion : ${u.u.email}`,
  ], { texte: "Activer mon compte", lien });
  await envoyerEmail({ a: u.u.email, sujet: `Activez votre espace Passages CDI : ${u.c.nom}`, ...m });
  return jeton;
}

/** Comptes administrateurs qui n'ont pas encore activé leur compte. */
export async function invitationsEnAttente() {
  return db.select({ userId: schema.users.id, collegeId: schema.users.collegeId, email: schema.users.email })
    .from(schema.users).where(and(isNull(schema.users.passwordHash), eq(schema.users.role, "admin")));
}

/** Renvoie un nouveau lien d'activation à un compte qui ne l'a pas encore utilisé. */
export async function renvoyerInvitation(userId: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u || u.passwordHash) throw new ErreurMetier("Ce compte est déjà activé.");
  return envoyerInvitation(userId);
}

/** Lit un lien d'activation ; null s'il est inconnu, expiré ou déjà utilisé. */
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
  if (!invitation) throw new ErreurMetier("Ce lien n'est plus valable. Refaites l'inscription avec la même adresse : un nouveau lien vous sera envoyé.");
  const hash = await bcrypt.hash(motDePasse, 10);
  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ passwordHash: hash }).where(eq(schema.users.id, invitation.userId));
    // Tous les liens de ce compte deviennent inutilisables
    await tx.update(schema.jetons).set({ utiliseLe: new Date() })
      .where(and(eq(schema.jetons.userId, invitation.userId), isNull(schema.jetons.utiliseLe)));
  });
  return invitation.userId;
}
