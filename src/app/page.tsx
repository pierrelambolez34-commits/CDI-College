/**
 * Page d'accueil publique.
 * Un visiteur voit la présentation ; une personne déjà connectée est envoyée dans l'application.
 *
 * Les textes entre crochets (classe « lp-tbd ») sont des informations à compléter avant la mise en ligne.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/session";
import "./accueil.css";

const NOM = "Passages CDI";
const CTA = { href: "/creer-un-college", texte: "Ouvrir mon CDI gratuitement" };
const DEMO = { href: "#apercu", texte: "Voir la démo (2 min)" };

export const metadata: Metadata = {
  title: { absolute: `${NOM} — Fréquentation et bilan d'activité du CDI pour les collèges` },
  description: "Enregistrez chaque passage au CDI en 3 touches, suivez la fréquentation et générez votre bilan de fin de période, prêt à présenter à la direction.",
};
export const dynamic = "force-dynamic";

const ETAPES = [
  {
    num: "01", nom: "Présence", titre: "Chaque passage noté en 3 touches.",
    texte: "Tapez quelques lettres du nom ou la classe, Entrée, le numéro du motif. Le créneau horaire est détecté automatiquement. Fonctionne sur ordinateur et tablette.",
  },
  {
    num: "02", nom: "Planning", titre: "Votre CDI, créneau par créneau.",
    texte: "Paramétrez cours, récréations, pause méridienne et horaires d'ouverture : chaque passage est rattaché au bon créneau sans saisie supplémentaire. Repérez d'un coup d'œil les créneaux saturés et les créneaux creux.",
  },
  {
    num: "03", nom: "Statistiques", titre: "La fréquentation, enfin visible.",
    texte: "Motifs de venue, heures de pointe, tendances semaine après semaine, part des élèves touchés par niveau. Toujours à jour, sans recompter.",
  },
  {
    num: "04", nom: "Bilan IA", titre: "Votre bilan de fin de période, rédigé pour vous.", phare: true,
    texte: "Choisissez la période et le format (note à la direction, synthèse, conseil pédagogique ou d'administration) : l'IA rédige un texte structuré à partir de vos chiffres, que vous relisez et ajustez, puis exportez en PDF avec les statistiques en annexe.",
  },
];

const MOTIFS_BILAN = [
  { l: "Lecture plaisir", n: 412 }, { l: "Recherche documentaire", n: 318 }, { l: "Devoirs, révisions", n: 236 },
  { l: "Emprunt ou retour", n: 171 }, { l: "Jeux, club", n: 147 },
];

const FAQ: { q: string; r: React.ReactNode }[] = [
  { q: "Quelles données faut-il sur les élèves ?", r: "Le nom, le prénom et la classe, rien d'autre. Si votre export Pronote ou SIECLE contient d'autres colonnes, comme les coordonnées des responsables légaux, elles sont ignorées et ne sont jamais envoyées." },
  { q: "Combien de temps faut-il pour démarrer ?", r: "Environ 15 minutes. Vous créez l'espace de votre collège, vous activez votre compte grâce au lien reçu par e-mail, puis 4 étapes guidées : votre établissement, les horaires du CDI, les motifs de venue et l'import du fichier d'élèves." },
  { q: "Peut-on l'utiliser sur tablette ?", r: "Oui. Sur ordinateur, tout se fait au clavier pour aller vite ; sur tablette, on sélectionne l'élève et on touche la tuile du motif." },
  { q: "Mes collègues peuvent-ils saisir les passages ?", r: "Oui. L'administrateur du CDI crée un compte pour chaque assistant d'éducation ou collègue. Ils saisissent les passages et consultent les statistiques ; seul l'administrateur modifie le paramétrage." },
  { q: "Les autres collèges voient-ils mes données ?", r: "Non. Chaque établissement dispose d'un espace séparé : il ne voit que ses propres élèves, passages et statistiques." },
  { q: "Que se passe-t-il à la rentrée ?", r: "Vous importez la nouvelle liste. Les changements de classe sont repris, les élèves partis sont archivés et l'historique des années précédentes est conservé." },
  { q: "Le bilan IA est-il modifiable avant export ?", r: "Oui. Vous relisez le texte proposé, vous l'ajustez, puis vous l'exportez en PDF." },
  { q: "Combien ça coûte ?", r: <span className="lp-tbd">[À compléter : tarif et durée de la gratuité.]</span> },
];

export default async function Accueil() {
  const u = await utilisateurConnecte();
  if (u) redirect(u.role === "superadmin" ? "/admin" : "/saisie");

  const maxMotif = Math.max(...MOTIFS_BILAN.map((m) => m.n));

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-in">
          <Link href="/" className="lp-logo">{NOM}</Link>
          <nav className="lp-liens" aria-label="Navigation principale">
            <a className="ancre" href="#etapes">Les 4 étapes</a>
            <a className="ancre" href="#apercu">Comment ça marche</a>
            <a className="ancre" href="#securite">Sécurité</a>
            <a className="ancre" href="#faq">FAQ</a>
            <Link href="/connexion">Connexion</Link>
          </nav>
          <Link href={CTA.href} className="lp-btn principal petit">{CTA.texte}</Link>
        </div>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="lp-hero">
          <div className="lp-in">
            <div>
              <p className="lp-sur">Pour les professeurs documentalistes de collège</p>
              <h1>Le bilan de votre CDI, prêt en 2 minutes.</h1>
              <p className="lp-intro">Enregistrez chaque passage en 3 touches. {NOM} suit la fréquentation, repère les heures d&apos;affluence et rédige votre bilan de fin de période avec l&apos;IA, prêt à présenter à la direction.</p>
              <div className="lp-ctas">
                <Link href={CTA.href} className="lp-btn principal">{CTA.texte}</Link>
                <a href={DEMO.href} className="lp-btn">{DEMO.texte}</a>
              </div>
              <p className="lp-rassure"><span>Gratuit</span><span>Sans engagement</span><span>Installation en 15 minutes</span><span>Conforme RGPD</span></p>
            </div>

            <div className="lp-pile" role="img" aria-label="Aperçu de l'application : un passage enregistré, un graphique des motifs de la semaine et un extrait de bilan rédigé par l'IA">
              <div className="lp-carte passage" aria-hidden="true">
                <div className="titre"><span>Saisie</span><span>Mardi · 9:52</span></div>
                <div className="lp-ok">
                  <span className="coche">✓</span>
                  <div><b>Passage enregistré</b><small>Inès B. · 5C · Lecture plaisir</small></div>
                </div>
                <div className="lp-touches"><kbd>i</kbd><kbd>n</kbd><kbd>è</kbd><kbd>Entrée</kbd><kbd>1</kbd><span className="lp-pastille">Récréation détectée</span></div>
              </div>

              <div className="lp-carte stats" aria-hidden="true">
                <div className="titre"><span>Motifs cette semaine</span></div>
                <div className="lp-barres">
                  {[["Lecture", 38], ["Recherche", 27], ["Devoirs", 21], ["Emprunt", 14]].map(([l, n]) => (
                    <div key={l} style={{ height: `${(Number(n) / 38) * 100}%` }}><span>{n}</span></div>
                  ))}
                </div>
                <div className="lp-etiquettes"><span>Lecture</span><span>Recherche</span><span>Devoirs</span><span>Emprunt</span></div>
              </div>

              <div className="lp-carte bilan" aria-hidden="true">
                <div className="titre"><span>Bilan du 1er trimestre</span><span className="lp-ia">Généré par IA</span></div>
                <p>Au premier trimestre, le CDI a accueilli 1 284 passages, soit une vingtaine par jour d&apos;ouverture. La pause méridienne concentre 41 % de la fréquentation, portée par la lecture plaisir.</p>
              </div>
            </div>
          </div>

          <div className="lp-in">
            <div className="lp-chiffres">
              <div><b>3 touches</b><span>par passage</span></div>
              <div><b>15 min</b><span>d&apos;installation</span></div>
              <div><b>0 feuille</b><span>papier à recompter</span></div>
              <div><b>2 min</b><span>pour générer le bilan</span></div>
            </div>
          </div>
        </section>

        {/* 2. Les 4 étapes */}
        <section id="etapes">
          <div className="lp-in">
            <div className="lp-tete">
              <p className="lp-sur">Les 4 étapes</p>
              <h2>Une année au CDI, en 4 étapes</h2>
              <p className="lp-intro">J&apos;enregistre, je pilote, j&apos;analyse, je valorise.</p>
            </div>
            <ol className="lp-etapes">
              {ETAPES.map((e) => (
                <li key={e.num} className={`lp-etape ${e.phare ? "phare" : ""}`}>
                  <span className="lp-num" aria-hidden="true">{e.num}</span>
                  <div className="corps">
                    {e.phare && <span className="lp-badge">Le plus apprécié</span>}
                    <span className="nom">{e.nom}</span>
                    <h3>{e.titre}</h3>
                    <p>{e.texte}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="lp-plus">
              <div><b>Travail en équipe</b>Les AED et les collègues saisissent les passages ; seul l&apos;administrateur paramètre.</div>
              <div><b>Import CSV</b>Les listes d&apos;élèves se mettent à jour depuis Pronote ou SIECLE, sans perdre l&apos;historique.</div>
            </div>
          </div>
        </section>

        {/* 3. Aperçu du bilan */}
        <section id="apercu" className="lp-fond">
          <div className="lp-in lp-apercu">
            <div>
              <p className="lp-sur">Aperçu du bilan</p>
              <h2>Ce que vous présenterez à votre direction</h2>
              <ul>
                <li>Un texte rédigé à partir de vos chiffres, que vous relisez et ajustez.</li>
                <li>Les indicateurs clés de la période, par niveau et par créneau.</li>
                <li>Un export PDF, avec les statistiques détaillées en annexe.</li>
              </ul>
              <a href={DEMO.href} className="lp-btn">{DEMO.texte}</a>
            </div>

            <article className="lp-a4" aria-label="Exemple de bilan d'activité, données fictives">
              <div className="entete"><span>Collège (exemple fictif) · CDI</span><span>Année 2026-2027</span></div>
              <h3>Bilan d&apos;activité du CDI — 1er trimestre</h3>
              <p>Du 1er septembre au 18 décembre, le CDI a accueilli <b>1 284 passages</b>, soit une vingtaine par jour d&apos;ouverture. <b>68 % des élèves</b> sont venus au moins une fois, avec une fréquentation nettement plus forte en 6e (82 %) qu&apos;en 3e (51 %). La pause méridienne concentre 41 % des passages, surtout pour la lecture plaisir et les jeux. En heure de cours, la recherche documentaire domine, portée par 14 accueils de demi-groupes. Piste pour le 2e trimestre : un projet lecture avec les classes de 3e.</p>
              <div className="lp-kpis">
                <div><b>1 284</b><span>passages</span></div>
                <div><b>68 %</b><span>des élèves touchés</span></div>
                <div><b>41 %</b><span>sur la pause méridienne</span></div>
              </div>
              <div className="lp-hbars">
                <span className="titre">Passages par motif</span>
                {MOTIFS_BILAN.map((m) => (
                  <div key={m.l} className="lp-hb"><span>{m.l}</span><i style={{ width: `${(m.n / maxMotif) * 100}%` }} /><b>{m.n}</b></div>
                ))}
              </div>
              <div className="pied"><span>Données fictives</span><span>Page 1 / 3</span></div>
            </article>
          </div>
        </section>

        {/* 4. Avant / après */}
        <section>
          <div className="lp-in">
            <div className="lp-tete">
              <p className="lp-sur">Avant / après</p>
              <h2>Du cahier papier au bilan rédigé</h2>
            </div>
            <div className="lp-vs">
              <div className="avant">
                <h3>Avec le cahier papier</h3>
                <ul>
                  <li>Un cahier à l&apos;accueil, rempli quand on y pense.</li>
                  <li>Des motifs notés en abrégé, difficiles à comparer d&apos;une année à l&apos;autre.</li>
                  <li>Aucune vue des créneaux saturés ou creux.</li>
                  <li className="fort">Le bilan annuel : un week-end de comptage.</li>
                </ul>
              </div>
              <div className="apres">
                <h3>Avec {NOM}</h3>
                <ul>
                  <li>Chaque passage noté en 3 touches, au moment où l&apos;élève entre.</li>
                  <li>Des motifs choisis dans votre liste, comparables d&apos;une période à l&apos;autre.</li>
                  <li>La fréquentation par créneau, toujours à jour.</li>
                  <li className="fort">Le bilan annuel : 2 minutes, rédigé par l&apos;IA.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Sécurité et données */}
        <section id="securite" className="lp-fond">
          <div className="lp-in">
            <div className="lp-tete">
              <p className="lp-sur">Sécurité et données</p>
              <h2>Des données d&apos;élèves réduites au strict nécessaire</h2>
            </div>
            <div className="lp-secu">
              <div><span className="icone">3</span><h3>Trois données par élève</h3><p>Nom, prénom et classe. Ni date de naissance, ni adresse, ni coordonnées des familles.</p></div>
              <div><span className="icone">⇣</span><h3>Le fichier reste sur votre ordinateur</h3><p>L&apos;export Pronote ou SIECLE est lu dans votre navigateur : les colonnes des responsables légaux ne sont jamais envoyées.</p></div>
              <div><span className="icone">▣</span><h3>Un espace par collège</h3><p>Chaque établissement ne voit que ses propres données. Ce cloisonnement est vérifié par des tests automatiques.</p></div>
              <div><span className="icone">⚿</span><h3>Des accès maîtrisés</h3><p>Comptes nominatifs, mots de passe chiffrés. Seul l&apos;administrateur du CDI modifie le paramétrage.</p></div>
              <div className="ia"><span className="icone">IA</span><h3>IA et confidentialité</h3><p><span className="lp-tbd">[À confirmer : seules des statistiques agrégées sont transmises à l&apos;IA, jamais les noms des élèves.]</span></p></div>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section id="faq">
          <div className="lp-in">
            <div className="lp-tete">
              <p className="lp-sur">FAQ</p>
              <h2>Questions fréquentes</h2>
            </div>
            <div className="lp-faq">
              {FAQ.map((f) => (
                <details key={f.q}><summary>{f.q}</summary><p>{f.r}</p></details>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Appel final */}
        <section className="lp-final lp-fond">
          <div className="lp-in">
            <h2>Votre prochain bilan, sans recompter.</h2>
            <p>Ouvrez l&apos;espace de votre collège en 15 minutes.</p>
            <Link href={CTA.href} className="lp-btn principal">{CTA.texte}</Link>
          </div>
        </section>
      </main>

      <footer className="lp-pied">
        <div className="lp-in">
          <span>{NOM} · Pour les CDI de collège</span>
          <nav aria-label="Liens du pied de page"><Link href="/connexion">Connexion</Link><Link href={CTA.href}>Ouvrir mon CDI</Link><a href="#faq">FAQ</a></nav>
        </div>
      </footer>
    </div>
  );
}
