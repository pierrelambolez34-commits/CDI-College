/** Connexion unique à PostgreSQL, partagée par toute l'application. */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Scalingo fournit SCALINGO_POSTGRESQL_URL ; on accepte aussi DATABASE_URL.
const url = process.env.DATABASE_URL ?? process.env.SCALINGO_POSTGRESQL_URL;
// La connexion n'est ouverte qu'à la première requête : la compilation fonctionne même sans base.
if (!url && process.env.NEXT_PHASE !== "phase-production-build") {
  console.warn("Attention : DATABASE_URL est absente. Sur ton ordinateur, copie .env.example en .env.");
}

// En développement, Next.js recharge les modules : on réutilise la même connexion.
const g = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };
export const sql = g.__sql ?? postgres(url ?? "postgres://localhost/absente", { max: 10 });
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export const db = drizzle(sql, { schema });
export type DB = typeof db;
export { schema };
