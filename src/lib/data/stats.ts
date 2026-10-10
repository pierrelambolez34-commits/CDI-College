/** Calcul des statistiques d'un collège. Toutes les requêtes filtrent sur college_id. */
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { instantParis } from "@/lib/temps";
import { lireCollege, lireMotifs, lirePlages } from "./college";

export type Filtres = { periode: "annee" | "30" | "7"; niveau: string; type: string };

export function lireFiltres(p: Record<string, string | string[] | undefined>): Filtres {
  const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
  const periode = ["annee", "30", "7"].includes(s("periode")) ? (s("periode") as Filtres["periode"]) : "annee";
  return { periode, niveau: s("niveau") || "tous", type: s("type") || "tous" };
}

/** Date de début de la période (AAAA-MM-JJ). */
export function debutPeriode(periode: Filtres["periode"], anneeScolaire: string, aujourdHui = instantParis()): string {
  const d = new Date(`${aujourdHui.jour}T12:00:00Z`);
  if (periode === "7") d.setUTCDate(d.getUTCDate() - ((aujourdHui.jourSemaine + 6) % 7)); // lundi de cette semaine
  else if (periode === "30") d.setUTCDate(d.getUTCDate() - 29);
  else return `${anneeScolaire.slice(0, 4)}-08-15`;
  return d.toISOString().slice(0, 10);
}

export async function calculerStats(collegeId: string, f: Filtres) {
  const [college, motifs, plages] = await Promise.all([lireCollege(collegeId), lireMotifs(collegeId, true), lirePlages(collegeId)]);
  const depuis = debutPeriode(f.periode, college.anneeScolaire);

  // Conditions communes : collège + période + niveau (+ type de plage pour la plupart des graphiques)
  const base: SQL[] = [sql`p.college_id = ${collegeId}`, sql`p.jour >= ${depuis}`];
  if (f.niveau !== "tous") base.push(sql`e.niveau = ${f.niveau}`);
  const avecType = f.type !== "tous" ? [...base, sql`p.type_plage = ${f.type}`] : base;
  const where = (c: SQL[]) => sql.join(c, sql` AND `);
  const depuisJoin = sql`FROM passages p JOIN eleves e ON e.id = p.eleve_id`;

  const [totaux, parMotif, parTypeMotif, parCreneau, joursParSemaine, parSemaine, population, venus, jamais] = await Promise.all([
    db.execute<{ passages: number; jours: number; eleves: number }>(sql`
      SELECT count(*)::int AS passages, count(DISTINCT p.jour)::int AS jours, count(DISTINCT p.eleve_id)::int AS eleves
      ${depuisJoin} WHERE ${where(avecType)}`),
    db.execute<{ motif_id: string; n: number }>(sql`
      SELECT p.motif_id, count(*)::int AS n ${depuisJoin} WHERE ${where(avecType)} GROUP BY p.motif_id`),
    db.execute<{ type_plage: string; motif_id: string; n: number }>(sql`
      SELECT p.type_plage, p.motif_id, count(*)::int AS n ${depuisJoin} WHERE ${where(base)} GROUP BY 1, 2`),
    db.execute<{ dow: number; minute: number; n: number }>(sql`
      SELECT extract(isodow FROM p.jour)::int AS dow, p.minute, count(*)::int AS n
      ${depuisJoin} WHERE ${where(avecType)} GROUP BY 1, 2`),
    // Nombre de jours d'ouverture (jours avec au moins un passage) par jour de la semaine, pour les moyennes
    db.execute<{ dow: number; n: number }>(sql`
      SELECT extract(isodow FROM jour)::int AS dow, count(DISTINCT jour)::int AS n
      FROM passages WHERE college_id = ${collegeId} AND jour >= ${depuis} GROUP BY 1`),
    db.execute<{ semaine: string; n: number }>(sql`
      SELECT to_char(date_trunc('week', p.jour), 'YYYY-MM-DD') AS semaine, count(*)::int AS n
      ${depuisJoin} WHERE ${where(avecType)} GROUP BY 1 ORDER BY 1`),
    db.execute<{ niveau: string; n: number }>(sql`
      SELECT niveau, count(*)::int AS n FROM eleves WHERE college_id = ${collegeId} AND actif GROUP BY 1`),
    db.execute<{ niveau: string; n: number }>(sql`
      SELECT e.niveau, count(DISTINCT p.eleve_id)::int AS n ${depuisJoin} WHERE ${where(avecType)} AND e.actif GROUP BY 1`),
    db.execute<{ division: string; n: number }>(sql`
      SELECT e.division, count(*)::int AS n FROM eleves e
      WHERE e.college_id = ${collegeId} AND e.actif ${f.niveau !== "tous" ? sql`AND e.niveau = ${f.niveau}` : sql``}
        AND NOT EXISTS (SELECT 1 FROM passages p WHERE p.eleve_id = e.id AND p.jour >= ${depuis}
          ${f.type !== "tous" ? sql`AND p.type_plage = ${f.type}` : sql``})
      GROUP BY 1`),
  ]);

  // Carte de chaleur : on range chaque passage dans la plage actuelle qui contient son heure.
  const occurrences = Object.fromEntries(joursParSemaine.map((r) => [r.dow, r.n]));
  const cases = plages.map((p) => ({
    plageId: p.id, jour: p.jour, debut: p.debut, fin: p.fin, type: p.type, total: 0, moyenne: 0,
  }));
  for (const r of parCreneau) {
    const c = cases.find((x) => x.jour === r.dow && r.minute >= x.debut && r.minute < x.fin);
    if (c) c.total += r.n;
  }
  for (const c of cases) c.moyenne = occurrences[c.jour] ? c.total / occurrences[c.jour] : 0;

  const t = totaux[0];
  const pop = f.niveau === "tous" ? population.reduce((s, r) => s + r.n, 0) : (population.find((r) => r.niveau === f.niveau)?.n ?? 0);

  return {
    college: { nom: college.nom, annee: college.anneeScolaire },
    depuis,
    types: college.typesPlage,
    motifs: motifs.map((m) => ({ id: m.id, libelle: m.libelle, ordre: m.ordre, actif: m.actif })),
    passages: t.passages,
    jours: t.jours,
    elevesVenus: t.eleves,
    population: pop,
    parMotif: Object.fromEntries(parMotif.map((r) => [r.motif_id, r.n])) as Record<string, number>,
    parTypeMotif: parTypeMotif,
    chaleur: cases,
    semaines: parSemaine,
    niveaux: ["6e", "5e", "4e", "3e"].map((n) => ({
      niveau: n, population: population.find((r) => r.niveau === n)?.n ?? 0, venus: venus.find((r) => r.niveau === n)?.n ?? 0,
    })).filter((x) => x.population && (f.niveau === "tous" || f.niveau === x.niveau)),
    jamaisVenus: jamais.sort((a, b) => a.division.localeCompare(b.division, "fr", { numeric: true })),
  };
}

export type Stats = Awaited<ReturnType<typeof calculerStats>>;

/** Lignes du fichier d'export CSV (passages filtrés). */
export async function lignesExport(collegeId: string, f: Filtres) {
  const college = await lireCollege(collegeId);
  const depuis = debutPeriode(f.periode, college.anneeScolaire);
  const cond: SQL[] = [sql`p.college_id = ${collegeId}`, sql`p.jour >= ${depuis}`];
  if (f.niveau !== "tous") cond.push(sql`e.niveau = ${f.niveau}`);
  if (f.type !== "tous") cond.push(sql`p.type_plage = ${f.type}`);
  return db.execute<{ jour: string; minute: number; nom: string; prenom: string; division: string; niveau: string; type_plage: string; motif: string }>(sql`
    SELECT to_char(p.jour, 'DD/MM/YYYY') AS jour, p.minute, e.nom, e.prenom, e.division, e.niveau, p.type_plage, m.libelle AS motif
    FROM passages p JOIN eleves e ON e.id = p.eleve_id JOIN motifs m ON m.id = p.motif_id
    WHERE ${sql.join(cond, sql` AND `)} ORDER BY p.jour, p.minute`);
}
