import { sql } from "drizzle-orm";
import { db } from "@/db";
import { superAdmin } from "@/lib/session";
import { seDeconnecter } from "@/app/connexion/actions";
import { instantParis } from "@/lib/temps";
import FormulaireCollege from "./FormulaireCollege";

export const metadata = { title: "Collèges" };

/** Espace super-administrateur : la liste des collèges clients et la création d'un nouveau collège. */
export default async function Admin() {
  const u = await superAdmin();
  const colleges = await db.execute<{ id: string; nom: string; uai: string; commune: string; eleves: number; comptes: number; passages: number }>(sql`
    SELECT c.id, c.nom, c.uai, c.commune,
      (SELECT count(*)::int FROM eleves e WHERE e.college_id = c.id AND e.actif) AS eleves,
      (SELECT count(*)::int FROM users s WHERE s.college_id = c.id) AS comptes,
      (SELECT count(*)::int FROM passages p WHERE p.college_id = c.id) AS passages
    FROM colleges c ORDER BY c.nom`);
  const { jour } = instantParis();
  const an = Number(jour.slice(0, 4)), mois = Number(jour.slice(5, 7));
  const annee = mois >= 8 ? `${an}-${an + 1}` : `${an - 1}-${an}`;
  return (
    <>
      <nav className="nav"><div className="nav-in">
        <span className="logo">Passages CDI</span>
        <div className="nav-links"><a aria-current="page" href="/admin">Collèges</a></div>
        <div className="nav-user"><span>{u.nom}</span><form action={seDeconnecter}><button className="btn ghost sm">Se déconnecter</button></form></div>
      </div></nav>
      <main className="wrap">
        <div className="page-head"><h1>Collèges</h1><span className="muted">{colleges.length} établissement{colleges.length > 1 ? "s" : ""}</span></div>
        <section className="panel">
          {colleges.length ? (
            <div className="tbl"><table>
              <thead><tr><th>Collège</th><th>UAI</th><th>Commune</th><th>Élèves</th><th>Comptes</th><th>Passages</th></tr></thead>
              <tbody>{colleges.map((c) => (
                <tr key={c.id}><td><b>{c.nom}</b></td><td>{c.uai}</td><td>{c.commune}</td><td>{c.eleves}</td><td>{c.comptes}</td><td>{c.passages}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <p className="muted">Aucun collège pour l'instant.</p>}
        </section>
        <section className="panel">
          <div className="head"><h2>Ajouter un collège</h2><p>Le collège reçoit des horaires et des motifs par défaut, que l'administrateur pourra modifier.</p></div>
          <FormulaireCollege annee={annee} />
        </section>
      </main>
    </>
  );
}
