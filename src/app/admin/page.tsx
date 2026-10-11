import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { invitationsEnAttente } from "@/lib/data/demandes";
import { smtpConfigure } from "@/lib/email";
import { superAdmin } from "@/lib/session";
import { BoutonRenvoyer } from "./Boutons";
import EnTete, { TeteCarte } from "@/components/EnTete";

export const metadata = { title: "Collèges" };
export const dynamic = "force-dynamic";

const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

/** Espace super-administrateur : suivi des collèges inscrits. */
export default async function Admin() {
  await superAdmin();
  const [invitations, colleges] = await Promise.all([
    invitationsEnAttente(),
    db.execute<{ id: string; nom: string; uai: string | null; commune: string; code_postal: string; academie: string; etape_accueil: number; created_at: string; eleves: number; passages: number; admin: string | null }>(sql`
      SELECT c.id, c.nom, c.uai, c.commune, c.code_postal, c.academie, c.etape_accueil, c.created_at,
        (SELECT count(*)::int FROM eleves e WHERE e.college_id = c.id AND e.actif) AS eleves,
        (SELECT count(*)::int FROM passages p WHERE p.college_id = c.id) AS passages,
        (SELECT min(s.email) FROM users s WHERE s.college_id = c.id AND s.role = 'admin') AS admin
      FROM colleges c ORDER BY c.created_at DESC`),
  ]);
  const enAttente = new Map(invitations.map((i) => [i.collegeId, i]));
  const nbActifs = colleges.filter((c) => !enAttente.has(c.id) && c.etape_accueil > 4).length;

  return (
    <>
      <main className="wrap">
        <EnTete sur="Super-administrateur" icone="ecole" titre="Collèges inscrits"
          intro={`${colleges.length} inscrit${colleges.length > 1 ? "s" : ""} · ${nbActifs} en service. Les collèges s'inscrivent seuls depuis la page d'accueil.`} />
        {!smtpConfigure() && (
          <div className="alert warn" style={{ marginTop: 0 }}>
            Mode test : les e-mails d&apos;activation ne sont pas réellement envoyés. <Link href="/admin/emails">Voir les e-mails de test</Link>.
          </div>
        )}
        <section className="panel">
          <TeteCarte icone="ecole" titre="Tous les collèges" sous="Activation, mise en route et utilisation de chaque établissement" />
          {colleges.length ? (
            <div className="tbl"><table>
              <thead><tr><th>Collège</th><th>Ville</th><th>Académie</th><th>Administrateur</th><th>État</th><th>Élèves</th><th>Passages</th><th>Inscrit le</th></tr></thead>
              <tbody>{colleges.map((c) => {
                const inv = enAttente.get(c.id);
                return (
                  <tr key={c.id}>
                    <td><b>{c.nom}</b>{c.uai && <span className="muted small"> · {c.uai}</span>}</td>
                    <td>{c.code_postal} {c.commune}</td><td>{c.academie || "—"}</td><td>{c.admin ?? "—"}</td>
                    <td>{inv
                      ? <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><span className="statut attente">Activation en attente</span><BoutonRenvoyer userId={inv.userId} /></span>
                      : c.etape_accueil <= 4
                        ? <span className="statut non">Mise en route : étape {c.etape_accueil}/4</span>
                        : <span className="statut ok">En service</span>}</td>
                    <td>{c.eleves}</td><td>{c.passages}</td><td>{dateFr(c.created_at)}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          ) : <p className="muted" style={{ margin: 0 }}>Aucun collège pour l&apos;instant.</p>}
        </section>
      </main>
    </>
  );
}
