import Icone from "@/components/Icone";

/** En-tête de page dans le style de la page d'accueil : étiquette, grand titre, phrase d'introduction, actions à droite. */
export default function EnTete({ sur, titre, intro, icone, children }: {
  sur: string; titre: string; intro?: React.ReactNode; icone?: string; children?: React.ReactNode;
}) {
  return (
    <header className="entete-page">
      <div className="entete-texte">
        <p className="sur">{icone && <Icone nom={icone} taille={15} />}{sur}</p>
        <h1>{titre}</h1>
        {intro && <p className="intro">{intro}</p>}
      </div>
      {children && <div className="entete-actions">{children}</div>}
    </header>
  );
}

/** En-tête d'une carte : tuile d'icône colorée, titre, sous-titre et, à droite, un complément (compteur, lien…). */
export function TeteCarte({ icone, couleur = "var(--accent)", titre, sous, children }: {
  icone: string; couleur?: string; titre: string; sous?: string; children?: React.ReactNode;
}) {
  return (
    <div className="carte-tete">
      <span className="tuile" style={{ "--c": couleur } as React.CSSProperties}><Icone nom={icone} taille={20} /></span>
      <div className="carte-titres"><h2>{titre}</h2>{sous && <p>{sous}</p>}</div>
      {children && <div className="carte-extra">{children}</div>}
    </div>
  );
}
