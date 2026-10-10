/** Crée (ou réinitialise) le compte super-administrateur à partir du fichier .env. */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema, sql } from "../src/db";

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const mdp = process.env.SUPERADMIN_PASSWORD;
  if (!email || !mdp) throw new Error("Renseignez SUPERADMIN_EMAIL et SUPERADMIN_PASSWORD dans le fichier .env");
  if (mdp.length < 10) throw new Error("Le mot de passe doit comporter au moins 10 caractères.");
  const hash = await bcrypt.hash(mdp, 10);
  const [existe] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existe) await db.update(schema.users).set({ passwordHash: hash, role: "superadmin", collegeId: null }).where(eq(schema.users.id, existe.id));
  else await db.insert(schema.users).values({ email, nom: "Super-administrateur", passwordHash: hash, role: "superadmin" });
  console.log(`Compte super-administrateur prêt : ${email}`);
  await sql.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
