import Link from "next/link";

/** Mise en page des écrans publics : présentation à gauche, formulaire à droite. */
export default function CadreAccueil({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div>
          <Link href="/" className="marque" style={{ color: "inherit", textDecoration: "none" }}>Passages CDI</Link>
          <h2>Savoir ce que les élèves viennent faire au CDI.</h2>
        </div>
        <ul className="points">
          <li><kbd>1</kbd><div><b>Une saisie en trois touches</b><span>Quelques lettres du nom, Entrée, le chiffre du motif. L&apos;heure et la plage sont reconnues.</span></div></li>
          <li><kbd>2</kbd><div><b>Des statistiques prêtes pour le rapport d&apos;activité</b><span>Motifs, moments d&apos;affluence, élèves touchés par niveau et par classe.</span></div></li>
          <li><kbd>3</kbd><div><b>Des données d&apos;élèves réduites au minimum</b><span>Nom, prénom et classe seulement. Chaque collège ne voit que ses propres données.</span></div></li>
        </ul>
        <p className="pied">Pour les professeurs documentalistes de collège.</p>
      </aside>
      <main className="auth-main"><div className="auth-card">{children}</div></main>
    </div>
  );
}
