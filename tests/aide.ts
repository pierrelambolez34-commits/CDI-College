import { sql } from "@/db";
import { creerCollege } from "@/lib/data/college";

export async function viderBase() {
  await sql`TRUNCATE passages, eleves, motifs, plages, sessions, users, colleges CASCADE`;
}

let n = 0;
export async function nouveauCollege(nom = "Collège test") {
  n++;
  return creerCollege({
    nom, uai: `${String(1000000 + n).slice(-7)}A`, commune: "Pérols", anneeScolaire: "2026-2027",
    admin: { email: `admin${n}-${Date.now()}@exemple.fr`, nom: "Admin", motDePasse: "motdepasse-solide" },
  });
}
