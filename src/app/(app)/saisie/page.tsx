import Link from "next/link";
import { lireCollege, lireMotifs, lirePlages } from "@/lib/data/college";
import { listerElevesActifs } from "@/lib/data/eleves";
import { motifsHabituels, passagesDuJour } from "@/lib/data/passages";
import { groupesPourSaisie } from "@/lib/data/groupes";
import { projetsEnCours } from "@/lib/data/projets";
import { utilisateurCollege } from "@/lib/session";
import { instantParis } from "@/lib/temps";
import Saisie from "./Saisie";

export const metadata = { title: "Saisie" };
export const dynamic = "force-dynamic";

export default async function PageSaisie() {
  const u = await utilisateurCollege();
  const instant = instantParis();
  const { jour } = instant;
  const [college, eleves, motifs, plages, passages, habitudes, groupes, projets] = await Promise.all([
    lireCollege(u.collegeId), listerElevesActifs(u.collegeId), lireMotifs(u.collegeId),
    lirePlages(u.collegeId), passagesDuJour(u.collegeId, jour), motifsHabituels(u.collegeId),
    groupesPourSaisie(u.collegeId), projetsEnCours(u.collegeId, jour),
  ]);

  if (!eleves.length) {
    return (
      <main className="wrap"><div className="panel empty-state">
        <h1 style={{ fontSize: 22, color: "var(--ink)" }}>Aucun élève pour l&apos;instant</h1>
        <p>Importez la liste des élèves pour commencer la saisie.</p>
        {u.role === "admin" ? <Link className="btn primary" href="/parametrage/eleves">Importer les élèves</Link>
          : <p>Demandez à l&apos;administrateur du CDI d&apos;importer le fichier des élèves.</p>}
      </div></main>
    );
  }

  return (
    <Saisie
      eleves={eleves}
      motifs={motifs.map((m) => ({ id: m.id, libelle: m.libelle, ordre: m.ordre }))}
      plages={plages.map((p) => ({ id: p.id, jour: p.jour, debut: p.debut, fin: p.fin, type: p.type }))}
      types={college.typesPlage}
      passagesInitiaux={passages}
      habitudes={habitudes}
      jour={jour}
      instantInitial={instant}
      groupes={groupes}
      projets={projets.map((p) => ({ id: p.id, nom: p.nom }))}
    />
  );
}
