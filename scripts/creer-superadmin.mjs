/**
 * Crée (ou réinitialise) le compte super-administrateur à partir de SUPERADMIN_EMAIL et SUPERADMIN_PASSWORD
 * (fichier .env sur ton ordinateur, variables d'environnement chez l'hébergeur).
 */
import "./env.mjs";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.SCALINGO_POSTGRESQL_URL;
const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const mdp = process.env.SUPERADMIN_PASSWORD ?? "";
const enLigne = process.env.NODE_ENV === "production";

function arret(message) { console.error(message); process.exit(1); }
if (!url) arret("DATABASE_URL manquante.");
if (!email || !mdp) arret("Renseignez SUPERADMIN_EMAIL et SUPERADMIN_PASSWORD.");
if (mdp.length < (enLigne ? 14 : 10)) arret(`Le mot de passe doit comporter au moins ${enLigne ? 14 : 10} caractères.`);
if (enLigne && mdp === "change-moi-tout-de-suite") arret("Choisissez un vrai mot de passe pour SUPERADMIN_PASSWORD avant la mise en ligne.");

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const hash = await bcrypt.hash(mdp, 10);
  const [existe] = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existe) await sql`UPDATE users SET password_hash = ${hash}, role = 'superadmin', college_id = NULL WHERE id = ${existe.id}`;
  else await sql`INSERT INTO users (email, nom, password_hash, role) VALUES (${email}, 'Super-administrateur', ${hash}, 'superadmin')`;
  console.log(`Compte super-administrateur prêt : ${email}`);
} finally {
  await sql.end();
}
