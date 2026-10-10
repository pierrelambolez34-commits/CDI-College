/**
 * Connexion et sessions.
 *
 * - Le navigateur garde un jeton aléatoire dans un cookie « httpOnly ».
 * - La base ne garde que l'empreinte SHA-256 de ce jeton.
 * - `utilisateurCollege()` est LE point d'entrée de toutes les pages et actions :
 *   il renvoie l'identifiant du collège de la personne connectée, et toutes les
 *   requêtes de données doivent filtrer sur cet identifiant.
 */
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";

const COOKIE = "cdi_session";
const DUREE_JOURS = 30;

// Empreinte factice : on calcule toujours un bcrypt, pour ne pas révéler si l'e-mail existe.
const FAUSSE_EMPREINTE = bcrypt.hashSync("mot-de-passe-factice", 10);

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

export type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: "superadmin" | "admin" | "utilisateur";
  collegeId: string | null;
};

export async function verifierIdentifiants(email: string, motDePasse: string): Promise<Utilisateur | null> {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase()));
  if (!u) {
    await bcrypt.compare(motDePasse, FAUSSE_EMPREINTE);
    return null;
  }
  if (!(await bcrypt.compare(motDePasse, u.passwordHash))) return null;
  return { id: u.id, nom: u.nom, email: u.email, role: u.role, collegeId: u.collegeId };
}

export async function ouvrirSession(userId: string) {
  const jeton = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DUREE_JOURS * 86_400_000);
  await db.insert(schema.sessions).values({ id: empreinte(jeton), userId, expiresAt });
  (await cookies()).set(COOKIE, jeton, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function fermerSession() {
  const c = await cookies();
  const jeton = c.get(COOKIE)?.value;
  if (jeton) await db.delete(schema.sessions).where(eq(schema.sessions.id, empreinte(jeton)));
  c.delete(COOKIE);
}

/** La personne connectée, ou null. */
export async function utilisateurConnecte(): Promise<Utilisateur | null> {
  const jeton = (await cookies()).get(COOKIE)?.value;
  if (!jeton) return null;
  const [row] = await db
    .select({ u: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, empreinte(jeton)), gt(schema.sessions.expiresAt, new Date())));
  if (!row) return null;
  const u = row.u;
  return { id: u.id, nom: u.nom, email: u.email, role: u.role, collegeId: u.collegeId };
}

/** Pour les pages d'un collège : renvoie la personne et son collège, sinon redirige. */
export async function utilisateurCollege(options?: { admin?: boolean }) {
  const u = await utilisateurConnecte();
  if (!u) redirect("/connexion");
  if (!u.collegeId) redirect("/admin");
  if (options?.admin && u.role !== "admin") redirect("/saisie");
  return { ...u, collegeId: u.collegeId };
}

/** Pour l'espace super-administrateur. */
export async function superAdmin() {
  const u = await utilisateurConnecte();
  if (!u) redirect("/connexion");
  if (u.role !== "superadmin") redirect("/saisie");
  return u;
}

export const hacherMotDePasse = (mdp: string) => bcrypt.hash(mdp, 10);
