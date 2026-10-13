import Link from "next/link";
import { notFound } from "next/navigation";
import { TeteCarte } from "@/components/EnTete";
import { listerElevesActifs } from "@/lib/data/eleves";
import { nomsGroupes } from "@/lib/data/groupes";
import { bilanProjet } from "@/lib/data/projets";
import { utilisateurCollege } from "@/lib/session";
import { formatMinute } from "@/lib/texte";
import FormProjet from "../FormProjet";
import { dateCourte, LIBELLE_ETAT } from "../commun";

export const metadata = { title: "Projet du CDI" };
export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const couleur = (ordre: number) => `var(--s${Math.min(Math.max(ordre, 1), 8)})`;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const u = await utilisateurCollege({ admin: true });
  const [b, eleves, groupes] = await Promise.all([bilanProjet(u.collegeId, id), listerElevesActifs(u.collegeId), nomsGroupes(u.collegeId)]);
  if (!b) notFound();
  const p = b.projet;
  const divisions = [...new Set([...eleves.map((e) => e.division), ...p.classes])].sort((a, c) => a.localeCompare(c, "fr", { numeric: true }));
  const maxMotif = Math.max(1, ...b.parMotif.map((m) => m.n));
  const maxSem = Math.max(1, ...b.parSemaine.map((s) => s.n));

  return (
    <>
      <p style={{ margin: "0 0 12px" }}><Link href="/parametrage/projets" className="small">← Tous les projets</Link></p>
      <TeteCarte icone="etincelles" couleur="var(--sun)" titre={p.nom} sous={`${dateCourte(p.debut)}${p.fin ? ` → ${dateCourte(p.fin)}` : " · sans date de fin"}`}>
        <span className={`etat-projet ${p.etat}`}>{LIBELLE_ETAT[p.etat]}</span>
        <Link href={`/statistiques?projet=${p.id}`} className="btn sm">Voir dans les statistiques</Link>
      </TeteCarte>

      <div className="bilan-kpis">
        <div><b>{b.passages}</b><span>passages rattachés</span></div>
        <div><b>{b.eleves}</b><span>élèves différents</span></div>
        <div><b>{b.seances}</b><span>séances au CDI</span></div>
        <div><b>{b.aParticipants ? `${pct(b.participantsVenus, b.participants)} %` : "—"}</b><span>{b.aParticipants ? `des ${b.participants} participants venus` : "aucun participant désigné"}</span></div>
      </div>

      {b.passages > 0 ? (
        <div className="bilan-grille">
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Motifs de venue</h3>
            <div className="hbars">
              {b.parMotif.map((m) => (
                <div key={m.libelle} className="hb"><span className="l">{m.libelle}</span>
                  <span className="tr"><span className="f" style={{ "--c": couleur(m.ordre), width: `${(m.n / maxMotif) * 100}%` } as React.CSSProperties} /></span>
                  <span className="v"><b>{m.n}</b><span>{pct(m.n, b.passages)} %</span></span></div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Par classe</h3>
            <div className="divs">{b.parClasse.map((c) => <span key={c.division}>{c.division} <small>{c.eleves} élève{c.eleves > 1 ? "s" : ""} · {c.n} passage{c.n > 1 ? "s" : ""}</small></span>)}</div>
            <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>Par semaine</h3>
            <div className="hbars">
              {b.parSemaine.map((s) => (
                <div key={s.semaine} className="hb"><span className="l">Sem. du {dateCourte(s.semaine)}</span>
                  <span className="tr"><span className="f" style={{ "--c": "var(--accent)", width: `${(s.n / maxSem) * 100}%` } as React.CSSProperties} /></span>
                  <span className="v"><b>{s.n}</b></span></div>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Derniers passages</h3>
            <ul className="list">
              {b.derniers.map((d, i) => <li key={i}><span className="h">{formatMinute(d.minute)}</span><span className="who">{d.prenom} {d.nom} <small>{d.division}</small></span><span className="muted small">{dateCourte(d.jour)}</span></li>)}
            </ul>
          </div>
        </div>
      ) : <div className="vide-encart">Aucun passage rattaché pour l&apos;instant. Pendant la saisie, choisissez ce projet avec la touche <kbd>F3</kbd> (le projet doit être en cours).</div>}

      <div className="sec" style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
        <h3>Fiche du projet</h3>
        <FormProjet projetId={p.id} divisions={divisions} groupes={groupes}
          initial={{ nom: p.nom, description: p.description, partenaires: p.partenaires, debut: p.debut, fin: p.fin, classes: p.classes, groupeIds: p.groupeIds }} />
      </div>
    </>
  );
}
