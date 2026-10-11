/**
 * Schéma de la base de données.
 *
 * Principe multi-collèges : chaque table de données porte une colonne
 * `college_id`. Toutes les requêtes de l'application filtrent sur cette
 * colonne (voir src/lib/session.ts et les fichiers src/lib/data/*).
 */
import {
  pgTable, uuid, text, smallint, integer, boolean, timestamp, date, pgEnum, index, uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["superadmin", "admin", "utilisateur"]);

/** Un collège = un « locataire » de l'application. */
export const colleges = pgTable("colleges", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  /** Code UAI (facultatif à la création). */
  uai: text("uai").unique(),
  commune: text("commune").notNull().default(""),
  codePostal: text("code_postal").notNull().default(""),
  academie: text("academie").notNull().default(""),
  anneeScolaire: text("annee_scolaire").notNull(),
  /** Types de plage proposés (« Cours », « Récréation »…), dans l'ordre d'affichage. */
  typesPlage: text("types_plage").array().notNull(),
  /** Parcours d'accueil : étape en cours (1 à 4), 5 = terminé. */
  etapeAccueil: smallint("etape_accueil").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Vide uniquement pour le super-administrateur, qui n'appartient à aucun collège. */
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  nom: text("nom").notNull(),
  /** Vide tant que la personne n'a pas choisi son mot de passe (invitation en attente). */
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  /** Empreinte SHA-256 du jeton stocké dans le cookie (le jeton lui-même n'est jamais enregistré). */
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** Plages horaires d'ouverture du CDI. Les heures sont stockées en minutes depuis minuit. */
export const plages = pgTable("plages", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  /** 1 = lundi … 5 = vendredi */
  jour: smallint("jour").notNull(),
  debut: smallint("debut").notNull(),
  fin: smallint("fin").notNull(),
  type: text("type").notNull(),
}, (t) => [index("plages_college_idx").on(t.collegeId, t.jour)]);

/** Motifs de venue. Un motif supprimé est seulement désactivé, pour garder l'historique. */
export const motifs = pgTable("motifs", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  libelle: text("libelle").notNull(),
  /** Position 1 à 8 = touche du clavier pendant la saisie. */
  ordre: smallint("ordre").notNull(),
  actif: boolean("actif").notNull().default(true),
}, (t) => [index("motifs_college_idx").on(t.collegeId)]);

/**
 * Élèves. Seuls le nom, le prénom et la classe sont conservés (minimisation RGPD).
 * Un élève absent d'un nouvel import est archivé (actif = false), pas supprimé.
 */
export const eleves = pgTable("eleves", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  prenom: text("prenom").notNull(),
  division: text("division").notNull(),
  /** « 6e », « 5e », « 4e », « 3e » — déduit de la classe. */
  niveau: text("niveau").notNull(),
  /** Nom et prénom sans accents ni majuscules, pour retrouver l'élève d'un import à l'autre. */
  cle: text("cle").notNull(),
  actif: boolean("actif").notNull().default(true),
}, (t) => [
  index("eleves_college_idx").on(t.collegeId, t.actif),
  uniqueIndex("eleves_unicite").on(t.collegeId, t.cle, t.division),
]);

/** Un passage = un élève entré au CDI, à un moment donné, pour un motif. */
export const passages = pgTable("passages", {
  id: uuid("id").primaryKey().defaultRandom(),
  collegeId: uuid("college_id").notNull().references(() => colleges.id, { onDelete: "cascade" }),
  eleveId: uuid("eleve_id").notNull().references(() => eleves.id, { onDelete: "cascade" }),
  motifId: uuid("motif_id").notNull().references(() => motifs.id),
  /** Type de plage au moment de la saisie (copié, pour que les statistiques ne changent pas si les horaires changent). */
  typePlage: text("type_plage").notNull(),
  /** Date et heure locales (Europe/Paris) de l'entrée. */
  jour: date("jour", { mode: "string" }).notNull(),
  minute: integer("minute").notNull(),
  saisiPar: uuid("saisi_par").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("passages_college_jour_idx").on(t.collegeId, t.jour),
  index("passages_eleve_idx").on(t.eleveId),
]);

export const statutDemandeEnum = pgEnum("statut_demande", ["en_attente", "acceptee", "refusee"]);

/** Demande de création d'un collège, envoyée depuis l'écran de connexion. */
export const demandesCollege = pgTable("demandes_college", {
  id: uuid("id").primaryKey().defaultRandom(),
  nom: text("nom").notNull(),
  ville: text("ville").notNull(),
  codePostal: text("code_postal").notNull(),
  academie: text("academie").notNull(),
  uai: text("uai"),
  emailDocumentaliste: text("email_documentaliste").notNull(),
  statut: statutDemandeEnum("statut").notNull().default("en_attente"),
  collegeId: uuid("college_id").references(() => colleges.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  traiteeLe: timestamp("traitee_le", { withTimezone: true }),
}, (t) => [index("demandes_statut_idx").on(t.statut)]);

/**
 * Liens à usage unique envoyés par e-mail (choix du mot de passe).
 * Seule l'empreinte SHA-256 du jeton est enregistrée.
 */
export const jetons = pgTable("jetons", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  utiliseLe: timestamp("utilise_le", { withTimezone: true }),
});
