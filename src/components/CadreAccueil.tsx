import Logo from "@/components/Logo";
import { photoAccueil } from "@/lib/photo";

/** Mise en page des écrans publics : présentation à gauche (même image que la page d'accueil), formulaire à droite. */
export default function CadreAccueil({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <div>
          <Logo clair />
          <h2>Le bilan de votre CDI, prêt en 2 minutes.</h2>
        </div>
        <figure className="auth-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoAccueil()} alt="Des élèves entrent au CDI en souriant" width={1200} height={1000} />
        </figure>
        <ul className="points">
          <li><kbd>1</kbd><div><b>Une saisie en trois touches</b><span>Quelques lettres du nom, Entrée, le chiffre du motif. L&apos;heure et la plage sont reconnues.</span></div></li>
          <li><kbd>2</kbd><div><b>Des statistiques toujours à jour</b><span>Motifs, moments d&apos;affluence, élèves touchés par niveau et par classe.</span></div></li>
          <li><kbd>3</kbd><div><b>Des données d&apos;élèves réduites au minimum</b><span>Nom, prénom et classe seulement. Chaque collège ne voit que ses propres données.</span></div></li>
        </ul>
      </aside>
      <main className="auth-main"><div className="auth-card">{children}</div></main>
    </div>
  );
}
