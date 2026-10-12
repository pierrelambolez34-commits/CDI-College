/**
 * Crée un collège de démonstration rempli de données fictives :
 * 463 élèves inventés et six semaines de passages, pour essayer la saisie et les statistiques.
 *
 * Connexion : demo@exemple.fr / demonstration
 * Relancer le script efface et recrée ce collège, ainsi que tout collège ou compte
 * qui utiliserait déjà les adresses de démonstration (demo@ et assistant@exemple.fr).
 */
import "dotenv/config";
import { eq, inArray, or } from "drizzle-orm";
import { db, schema, sql } from "../src/db";
import { creerCollege, lireMotifs, lirePlages } from "../src/lib/data/college";
import { importerEleves } from "../src/lib/data/eleves";
import { instantParis } from "../src/lib/temps";

const UAI = "0999999Z";
const DIVISIONS: Record<string, number> = {
  "6A": 26, "6B": 28, "6C": 27, "6D": 27, "5A": 27, "5B": 25, "5C": 25, "5D": 22, "5E": 22,
  "4A": 29, "4B": 30, "4C": 30, "4D": 30, "3A": 27, "3B": 29, "3C": 30, "3D": 29,
};
const NOMS = ["ARNAUD", "BARTHE", "BENSAÏD", "BLANC", "BOUVIER", "CARON", "CASTEL", "CHEVALIER", "COSTA", "DELMAS", "DIALLO", "DUBOIS", "DUMAS", "FABRE", "FERRER", "GARCIA", "GAUTHIER", "GIRAUD", "GUERIN", "HAMADI", "JOLY", "LAMBERT", "LAURENT", "LEBRUN", "LEFÈVRE", "LEROY", "MARCHAND", "MARTIN", "MARTINEZ", "MASSON", "MERCIER", "MEYER", "MOREL", "MULLER", "NGUYEN", "NOËL", "PERRIN", "PICARD", "RENARD", "RIVIÈRE", "ROCHE", "ROUSSEL", "ROUX", "SANCHEZ", "SIMON", "TEIXEIRA", "VIDAL", "VINCENT"];
const PRENOMS = ["Adam", "Aïcha", "Alba", "Ambre", "Anaïs", "Arthur", "Axel", "Camille", "Chloé", "Clément", "Elio", "Emma", "Ethan", "Gabriel", "Hugo", "Inès", "Jade", "Jules", "Léa", "Léon", "Lina", "Louise", "Lucas", "Maël", "Manon", "Marius", "Mathis", "Maya", "Mila", "Nathan", "Noah", "Nora", "Paul", "Rose", "Sacha", "Salomé", "Sami", "Théo", "Yanis", "Zoé", "Éva", "Maëlys"];

let graine = 20260901;
const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const choisir = <T,>(a: T[]) => a[Math.floor(hasard() * a.length)];

// Répartition des motifs (dans l'ordre par défaut) selon le type de plage
const POIDS: Record<string, number[]> = {
  "Cours": [1, 22, 20, 4, 14, 24, 1, 14],
  "Récréation": [40, 2, 6, 30, 1, 0, 18, 3],
  "Pause méridienne": [30, 4, 14, 10, 6, 0, 26, 10],
  "Étude": [6, 8, 62, 2, 10, 4, 2, 6],
};
const FREQUENTATION: Record<string, number> = { "Cours": 4, "Récréation": 13, "Pause méridienne": 21, "Étude": 7 };

function tirerMotif(type: string) {
  const p = POIDS[type] ?? POIDS["Cours"];
  let x = hasard() * p.reduce((a, b) => a + b, 0);
  for (let i = 0; i < p.length; i++) { x -= p[i]; if (x < 0) return i; }
  return 0;
}

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Le collège de démonstration ne se crée pas sur l'application en ligne.");
  // Nettoyage : le collège de démonstration précédent, et tout collège créé avec une adresse de démonstration
  const EMAILS_DEMO = ["demo@exemple.fr", "assistant@exemple.fr"];
  const comptes = await db.select({ collegeId: schema.users.collegeId }).from(schema.users).where(inArray(schema.users.email, EMAILS_DEMO));
  const parUai = await db.select({ id: schema.colleges.id }).from(schema.colleges).where(eq(schema.colleges.uai, UAI));
  const aSupprimer = [...new Set([...parUai.map((c) => c.id), ...comptes.map((c) => c.collegeId).filter((id): id is string => !!id)])];
  if (aSupprimer.length) {
    await db.delete(schema.passages).where(inArray(schema.passages.collegeId, aSupprimer));
    await db.delete(schema.colleges).where(or(...aSupprimer.map((id) => eq(schema.colleges.id, id))));
  }
  await db.delete(schema.users).where(inArray(schema.users.email, EMAILS_DEMO));
  const college = await creerCollege({
    nom: "Collège de démonstration", uai: UAI, commune: "Pérols", anneeScolaire: "2026-2027",
    admin: { email: "demo@exemple.fr", nom: "Claire Documentaliste", motDePasse: "demonstration" },
  });

  // Élèves inventés
  const lignes: { nom: string; prenom: string; division: string }[] = [];
  const vus = new Set<string>();
  for (const [division, n] of Object.entries(DIVISIONS)) {
    for (let k = 0; k < n; k++) {
      let nom, prenom;
      do { nom = choisir(NOMS); prenom = choisir(PRENOMS); } while (vus.has(nom + prenom + division));
      vus.add(nom + prenom + division);
      lignes.push({ nom, prenom, division });
    }
  }
  await importerEleves(college.id, lignes, true);
  await db.update(schema.colleges).set({ etapeAccueil: 5 }).where(eq(schema.colleges.id, college.id));
  const eleves = await db.select().from(schema.eleves).where(eq(schema.eleves.collegeId, college.id));
  const motifs = await lireMotifs(college.id);
  const plages = await lirePlages(college.id);

  // Certains élèves viennent souvent, d'autres jamais ; les 6e viennent davantage
  const bonus: Record<string, number> = { "6e": 1.35, "5e": 1.1, "4e": 0.85, "3e": 0.7 };
  const poids = eleves.map((e) => (hasard() < 0.24 ? 0 : Math.pow(hasard(), 2.2) * (bonus[e.niveau] ?? 1)));
  const cumul: number[] = []; let total = 0;
  for (const p of poids) { total += p; cumul.push(total); }
  const tirerEleve = () => { const x = hasard() * total; return eleves[cumul.findIndex((c) => c >= x)]; };

  // Six semaines de passages, jusqu'à hier
  const aujourdHui = new Date(`${instantParis().jour}T12:00:00`);
  const passages: (typeof schema.passages.$inferInsert)[] = [];
  for (let d = 42; d >= 1; d--) {
    const date = new Date(aujourdHui); date.setDate(date.getDate() - d);
    const js = date.getDay(); if (js === 0 || js === 6) continue;
    const jour = date.toISOString().slice(0, 10);
    for (const p of plages.filter((x) => x.jour === js)) {
      const n = Math.round((FREQUENTATION[p.type] ?? 4) * (0.6 + hasard() * 0.8));
      for (let k = 0; k < n; k++) {
        passages.push({ collegeId: college.id, eleveId: tirerEleve().id, motifId: motifs[tirerMotif(p.type)].id, typePlage: p.type, jour, minute: p.debut + Math.floor(hasard() * Math.min(20, p.fin - p.debut)) });
      }
      if (p.type === "Cours" && hasard() < 0.22) { // une demi-classe envoyée en recherche
        const div = choisir(Object.keys(DIVISIONS));
        const classe = eleves.filter((e) => e.division === div);
        for (let k = 0; k < 8 + Math.floor(hasard() * 6); k++) {
          passages.push({ collegeId: college.id, eleveId: choisir(classe).id, motifId: motifs[1].id, typePlage: p.type, jour, minute: p.debut + 2 });
        }
      }
    }
  }
  for (let i = 0; i < passages.length; i += 1000) await db.insert(schema.passages).values(passages.slice(i, i + 1000));

  await db.insert(schema.users).values({
    collegeId: college.id, email: "assistant@exemple.fr", nom: "Assistant d'éducation", role: "utilisateur",
    passwordHash: (await import("bcryptjs")).default.hashSync("demonstration", 10),
  });
  console.log(`Collège de démonstration prêt : ${eleves.length} élèves, ${passages.length} passages.`);
  console.log("Connexion : demo@exemple.fr / demonstration (administrateur)");
  console.log("            assistant@exemple.fr / demonstration (saisie et statistiques uniquement)");
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
