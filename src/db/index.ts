/** Connexion unique à PostgreSQL, partagée par toute l'application. */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("La variable DATABASE_URL est absente. Copiez .env.example en .env.");

// En développement, Next.js recharge les modules : on réutilise la même connexion.
const g = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };
export const sql = g.__sql ?? postgres(url, { max: 10 });
if (process.env.NODE_ENV !== "production") g.__sql = sql;

export const db = drizzle(sql, { schema });
export type DB = typeof db;
export { schema };
