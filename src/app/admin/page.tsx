import { sql } from "drizzle-orm";
import { db } from "@/db";
import { seDeconnecter } from "@/app/connexion/actions";
import { invitationsEnAttente, listerDemandes } from "@/lib/data/demandes";
import { smtpConfigure } from "@/lib/email";
import { superAdmin } from "@/lib/session";
import Link from "next/link";
import { BoutonRenvoyer, DecisionDemande } from "./Boutons";

export const metadata = { title: "Collèges" };
export const dynamic = "force-dynamic";

const dateFr = (d: Date | null) => d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) : "";

/** Espace super-administrateur : demandes de création et liste des collèges. */
export default async function Admin() {
  const u = await superAdmin();
  const [demandes, traitees, invitations, colleges] = await Promise.all([
    listerDemandes("en_attente"),
    listerDemandes("traitees"),
    invitationsEnAttente(),
    db.execute<{ id: string; nom: string; uai: string | null; commune: string; code_postal: string; academie: string; eleves: number; passages: number; admin: string | null }>(sql`
      SELECT c.id, c.nom, c.uai, c.commune, c.code_postal, c.academie,
        (SELECT count(*)::int FROM eleves e WHERE e.college_id = c.id AND e.actif) AS eleves,
        (SELECT count(*)::int FROM passages p WHERE p.college_id = c.id) AS passages,
        (SELECT min(s.email) FROM users s WHERE s.college_id = c.id AND s.role = 'admin') AS admin
      FROM colleges c ORDER BY c.nom`),
  ]);
  const enAttente = new Map(invitations.map((i) => [i.collegeId, i]));

  return (
    <>
      <nav className="nav"><div className="nav-in">
        <span className="logo">Passages CDI</span>
        <div className="nav-links"><Link aria-current="page" href="/admin">Collèges</Link><Link href="/admin/emails">E-mails de test</Link></div>
        <div className="nav-user"><span>{u.nom}</span><form action={seDeconnecter}><button className="btn ghost sm">Se déconnecter</button></form></div>
      </div></nav>
      <main className="wrap">
        {!smtpConfigure() && (
          <div className="alert warn" style={{ marginTop: 0 }}>
            Mode test : les e-mails (demandes, invitations) ne sont pas réellement envoyés. <Link href="/admin/emails">Voir les e-mails de test</Link>.
          </div>
        )}
        <div className="page-head"><h1>Collèges</h1><span className="muted">{colleges.length} établissement{colleges.length > 1 ? "s" : ""}</span></div>

        <section className="panel">
          <div className="head" style={{ marginBottom: 12 }}>
            <h2>Demandes à traiter {demandes.length > 0 && <span className="statut attente" style={{ verticalAlign: "middle", marginLeft: 6 }}>{demandes.length}</span>}</h2>
            <p>Confirmer crée le collège avec un paramétrage par défaut et envoie au professeur documentaliste un lien pour choisir son mot de passe.</p>
          </div>
          {demandes.length ? (
            <div className="liste-demandes">
              {demandes.map((d) => (
                <article key={d.id} className="demande">
                  <div>
                    <h3>{d.nom}</h3>
                    <div className="meta">
                      <span>{d.codePostal} {d.ville}</span><span>Académie de {d.academie}</span>
                      <span>UAI : {d.uai ?? "non renseigné"}</span><span>{d.emailDocumentaliste}</span>
                      <span>Reçue le {dateFr(d.createdAt)}</span>
                    </div>
                  </div>
                  <DecisionDemande id={d.id} nom={d.nom} />
                </article>
              ))}
            </div>
          ) : <p className="muted" style={{ margin: 0 }}>Aucune demande en attente.</p>}
        </section>

        <section className="panel">
          <div className="head" style={{ marginBottom: 12 }}><h2>Collèges ouverts</h2></div>
          {colleges.length ? (
            <div className="tbl"><table>
              <thead><tr><th>Collège</th><th>Ville</th><th>Académie</th><th>UAI</th><th>Administrateur</th><th>Élèves</th><th>Passages</th></tr></thead>
              <tbody>{colleges.map((c) => {
                const inv = enAttente.get(c.id);
                return (
                  <tr key={c.id}>
                    <td><b>{c.nom}</b></td><td>{c.code_postal} {c.commune}</td><td>{c.academie || "—"}</td><td>{c.uai ?? "—"}</td>
                    <td>{inv ? <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><span className="statut attente">Invitation envoyée</span><BoutonRenvoyer userId={inv.userId} /></span> : (c.admin ?? "—")}</td>
                    <td>{c.eleves}</td><td>{c.passages}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          ) : <p className="muted" style={{ margin: 0 }}>Aucun collège pour l&apos;instant.</p>}
        </section>

        {traitees.length > 0 && (
          <section className="panel">
            <div className="head" style={{ marginBottom: 12 }}><h2>Demandes traitées récemment</h2></div>
            <div className="tbl"><table>
              <thead><tr><th>Collège</th><th>Demandeur</th><th>Décision</th><th>Le</th></tr></thead>
              <tbody>{traitees.map((d) => (
                <tr key={d.id}><td>{d.nom}</td><td>{d.emailDocumentaliste}</td>
                  <td><span className={`statut ${d.statut === "acceptee" ? "ok" : "non"}`}>{d.statut === "acceptee" ? "Créé" : "Refusée"}</span></td>
                  <td>{dateFr(d.traiteeLe)}</td></tr>
              ))}</tbody>
            </table></div>
          </section>
        )}
      </main>
    </>
  );
}
