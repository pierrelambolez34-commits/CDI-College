/**
 * Applique les migrations du dossier drizzle/ à la base indiquée par DATABASE_URL.
 * En JavaScript simple (sans outil de développement) pour pouvoir tourner chez l'hébergeur après chaque déploiement.
 */
import "./env.mjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.argv[2] ?? process.env.DATABASE_URL ?? process.env.SCALINGO_POSTGRESQL_URL;
if (!url) { console.error("DATABASE_URL manquante."); process.exit(1); }
const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  console.log("Base de données à jour.");
} catch (e) {
  console.error("La mise à jour de la base a échoué :", e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
