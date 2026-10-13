import Link from "next/link";
import { TeteCarte } from "@/components/EnTete";
import Icone from "@/components/Icone";
import { listerProjets, type EtatProjet } from "@/lib/data/projets";
import { utilisateurCollege } from "@/lib/session";
import { dateCourte, LIBELLE_ETAT } from "./commun";

export const metadata = { title: "Projets du CDI" };
export const dynamic = "force-dynamic";


export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const projets = await listerProjets(u.collegeId);
  const ordre: EtatProjet[] = ["en_cours", "a_venir", "termine"];
  return (
    <>
      <TeteCarte icone="etincelles" couleur="var(--sun)" titre="Projets du CDI" sous="Prix littéraires, semaine de la presse, expositions, ateliers…">
        <Link href="/parametrage/projets/nouveau" className="btn primary">Nouveau projet</Link>
      </TeteCarte>
      <p className="muted" style={{ margin: "0 0 18px", maxWidth: "68ch" }}>
        Pendant la saisie, choisissez le projet en cours (touche <kbd>F3</kbd>) : les passages y sont rattachés et le projet obtient son propre bilan.
      </p>
      {projets.length === 0 && <div className="vide-encart">Aucun projet pour l&apos;instant. <Link href="/parametrage/projets/nouveau">Créez le premier</Link>.</div>}
      {ordre.map((etat) => {
        const liste = projets.filter((p) => p.etat === etat);
        if (!liste.length) return null;
        return (
          <div key={etat} className="sec">
            <h3>{LIBELLE_ETAT[etat]} ({liste.length})</h3>
            <div className="projets-liste">
              {liste.map((p) => (
                <Link key={p.id} href={`/parametrage/projets/${p.id}`} className="projet-ligne">
                  <span className="tuile" style={{ "--c": "var(--sun)" } as React.CSSProperties}><Icone nom="etincelles" taille={18} /></span>
                  <span className="txt"><b>{p.nom}</b><span>{dateCourte(p.debut)}{p.fin ? ` → ${dateCourte(p.fin)}` : " · sans date de fin"}{[...p.classes, ...p.groupes].length ? ` · ${[...p.classes, ...p.groupes].join(", ")}` : ""}</span></span>
                  <span className={`etat-projet ${p.etat}`}>{LIBELLE_ETAT[p.etat]}</span>
                  <span className="chiffres"><b>{p.passages}</b>passage{p.passages > 1 ? "s" : ""} · {p.eleves} élève{p.eleves > 1 ? "s" : ""}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
