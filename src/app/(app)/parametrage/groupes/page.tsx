import Link from "next/link";
import { TeteCarte } from "@/components/EnTete";
import Icone from "@/components/Icone";
import { listerGroupes } from "@/lib/data/groupes";
import { utilisateurCollege } from "@/lib/session";
import NouveauGroupe from "./NouveauGroupe";

export const metadata = { title: "Groupes d'élèves" };

export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const groupes = await listerGroupes(u.collegeId);
  return (
    <>
      <TeteCarte icone="equipe" couleur="var(--mint)" titre="Groupes d'élèves" sous="Clubs, ateliers, demi-groupes envoyés par un enseignant…" />
      <p className="muted" style={{ margin: "0 0 18px", maxWidth: "68ch" }}>
        Pendant la saisie, tapez le nom du groupe pour enregistrer tous ses élèves d&apos;un coup. Dans les statistiques, filtrez par groupe pour suivre sa fréquentation.
      </p>
      {groupes.length > 0 ? (
        <div className="grille-cartes">
          {groupes.map((g) => (
            <Link key={g.id} href={`/parametrage/groupes/${g.id}`} className="carte-lien">
              <span className="tuile" style={{ "--c": "var(--mint)" } as React.CSSProperties}><Icone nom="equipe" taille={18} /></span>
              <span className="txt"><b>{g.nom}</b><span>{g.nbEleves} élève{g.nbEleves > 1 ? "s" : ""}{g.description ? ` · ${g.description}` : ""}</span></span>
              <Icone nom="fleche" taille={16} />
            </Link>
          ))}
        </div>
      ) : <div className="vide-encart">Aucun groupe pour l&apos;instant. Créez le premier ci-dessous, par exemple « Club manga » ou « Demi-groupe 4B – Mme Durand ».</div>}
      <div className="sec"><h3>Nouveau groupe</h3><NouveauGroupe /></div>
    </>
  );
}
