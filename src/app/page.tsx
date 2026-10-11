/**
 * Page d'accueil : la page par défaut du site, pour tout le monde.
 * Un visiteur voit « Connexion » et « Ouvrir mon CDI » ; une personne connectée voit « Mon espace ».
 *
 * Photo du hero : déposez public/accueil/eleves-cdi.jpg (ou .webp / .png).
 * Tant qu'elle n'existe pas, l'illustration public/accueil/illustration-cdi.svg est affichée.
 * Les textes entre crochets (classe « lp-tbd ») sont des informations à compléter avant la mise en ligne.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Icone from "@/components/Icone";
import Logo from "@/components/Logo";
import { photoAccueil } from "@/lib/photo";
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
    num: "01", nom: "Présence", icone: "clavier", couleur: "var(--accent)", titre: "Chaque passage noté en 3 touches.",
    texte: "Tapez quelques lettres du nom ou la classe, Entrée, le numéro du motif. Le créneau horaire est détecté automatiquement. Fonctionne sur ordinateur et tablette.",
  },
  {
    num: "02", nom: "Planning", icone: "calendrier", couleur: "var(--mint)", titre: "Votre CDI, créneau par créneau.",
    texte: "Paramétrez cours, récréations, pause méridienne et horaires d'ouverture : chaque passage est rattaché au bon créneau sans saisie supplémentaire. Repérez d'un coup d'œil les créneaux saturés et les créneaux creux.",
  },
  {
    num: "03", nom: "Statistiques", icone: "graphique", couleur: "var(--sun)", titre: "La fréquentation, enfin visible.",
    texte: "Motifs de venue, heures de pointe, tendances semaine après semaine, part des élèves touchés par niveau. Toujours à jour, sans recompter.",
  },
  {
    num: "04", nom: "Bilan IA", icone: "etincelles", couleur: "var(--pep)", titre: "Votre bilan de fin de période, rédigé pour vous.", phare: true,
    texte: "Choisissez la période et le format (note à la direction, synthèse, conseil pédagogique ou d'administration) : l'IA rédige un texte structuré à partir de vos chiffres, que vous relisez et ajustez, puis exportez en PDF avec les statistiques en annexe.",
  },
];

const MOTIFS_BILAN = [
  { l: "Lecture plaisir", n: 412 }, { l: "Recherche documentaire", n: 318 }, { l: "Devoirs, révisions", n: 236 },
  { l: "Emprunt ou retour", n: 171 }, { l: "Jeux, club", n: 147 },
];

const SECURITE = [
  { icone: "document", titre: "Trois données par élève", texte: "Nom, prénom et classe. Ni date de naissance, ni adresse, ni coordonnées des familles." },
  { icone: "ordinateur", titre: "Le fichier reste sur votre ordinateur", texte: "L'export Pronote ou SIECLE est lu dans votre navigateur : les colonnes des responsables légaux ne sont jamais envoyées." },
  { icone: "ecole", titre: "Un espace par collège", texte: "Chaque établissement ne voit que ses propres données. Ce cloisonnement est vérifié par des tests automatiques." },
  { icone: "cadenas", titre: "Des accès maîtrisés", texte: "Comptes nominatifs, mots de passe chiffrés. Seul l'administrateur du CDI modifie le paramétrage." },
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
  const espace = u ? (u.role === "superadmin" ? "/admin" : "/saisie") : null;
  const photo = photoAccueil();
  const maxMotif = Math.max(...MOTIFS_BILAN.map((m) => m.n));

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-in">
          <Logo />
          <nav className="lp-liens" aria-label="Navigation principale">
            <a className="ancre" href="#etapes">Les 4 étapes</a>
            <a className="ancre" href="#apercu">Comment ça marche</a>
            <a className="ancre" href="#securite">Sécurité</a>
            <a className="ancre" href="#faq">FAQ</a>
            {!espace && <Link href="/connexion">Connexion</Link>}
          </nav>
          {espace
            ? <Link href={espace} className="lp-btn principal petit">Mon espace <Icone nom="fleche" taille={16} /></Link>
            : <Link href={CTA.href} className="lp-btn principal petit cta-nav">{CTA.texte}</Link>}
        </div>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="lp-hero">
          <div className="lp-in">
            <div className="lp-hero-texte">
              <p className="lp-pilule"><Icone nom="etincelles" taille={16} /> Pour les professeurs documentalistes de collège</p>
              <h1>Le bilan de votre CDI, prêt en <span className="surligne">2&nbsp;minutes.</span></h1>
              <p className="lp-intro">Enregistrez chaque passage en 3 touches. {NOM} suit la fréquentation, repère les heures d&apos;affluence et rédige votre bilan de fin de période avec l&apos;IA, prêt à présenter à la direction.</p>
              <div className="lp-ctas">
                {espace
                  ? <Link href={espace} className="lp-btn principal">Accéder à mon espace <Icone nom="fleche" taille={18} /></Link>
                  : <Link href={CTA.href} className="lp-btn principal">{CTA.texte} <Icone nom="fleche" taille={18} /></Link>}
                <a href={DEMO.href} className="lp-btn"><Icone nom="lecture" taille={16} /> {DEMO.texte}</a>
              </div>
              <ul className="lp-rassure">
                {["Gratuit", "Sans engagement", "Installation en 15 minutes", "Conforme RGPD"].map((t) => (
                  <li key={t}><Icone nom="check" taille={16} />{t}</li>
                ))}
              </ul>
            </div>

            <div className="lp-visuel">
              <figure className="lp-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt="Des élèves entrent au CDI en souriant"
                  width={1200} height={1000} fetchPriority="high"
                />
              </figure>
              <div className="lp-flottant passage" aria-hidden="true">
                <span className="coche"><Icone nom="check" taille={18} /></span>
                <div><b>Passage enregistré</b><small>Inès B. · 5C · Lecture plaisir</small></div>
              </div>
              <div className="lp-flottant creneau" aria-hidden="true">
                <Icone nom="horloge" taille={16} /><span>Récréation détectée · 9:52</span>
              </div>
              <div className="lp-flottant bilan" aria-hidden="true">
                <span className="lp-ia"><Icone nom="etincelles" taille={14} /> Bilan rédigé par l&apos;IA</span>
                <p>« La pause méridienne concentre 41 % de la fréquentation, portée par la lecture plaisir. »</p>
              </div>
            </div>
          </div>

          <div className="lp-in">
            <dl className="lp-chiffres">
              {[["3 touches", "par passage", "clavier"], ["15 min", "d'installation", "horloge"], ["0 feuille", "papier à recompter", "document"], ["2 min", "pour générer le bilan", "etincelles"]].map(([v, l, i]) => (
                <div key={v}><span className="ic"><Icone nom={i} taille={20} /></span><dt>{l}</dt><dd>{v}</dd></div>
              ))}
            </dl>
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
                <li key={e.num} className={`lp-etape ${e.phare ? "phare" : ""}`} style={{ "--c": e.couleur } as React.CSSProperties}>
                  <div className="haut">
                    <span className="ic"><Icone nom={e.icone} taille={22} /></span>
                    <span className="num">{e.num}</span>
                    {e.phare && <span className="lp-badge">Le plus apprécié</span>}
                  </div>
                  <span className="nom">{e.nom}</span>
                  <h3>{e.titre}</h3>
                  <p>{e.texte}</p>
                </li>
              ))}
            </ol>
            <div className="lp-plus">
              <div><span className="ic"><Icone nom="equipe" /></span><p><b>Travail en équipe</b>Les AED et les collègues saisissent les passages ; seul l&apos;administrateur paramètre.</p></div>
              <div><span className="ic"><Icone nom="import" /></span><p><b>Import CSV</b>Les listes d&apos;élèves se mettent à jour depuis Pronote ou SIECLE, sans perdre l&apos;historique.</p></div>
            </div>
          </div>
        </section>

        {/* 3. Aperçu du bilan */}
        <section id="apercu" className="lp-fond">
          <div className="lp-in lp-apercu">
            <div>
              <p className="lp-sur">Aperçu du bilan</p>
              <h2>Ce que vous présenterez à votre direction</h2>
              <ul className="lp-liste">
                <li><Icone nom="check" taille={18} />Un texte rédigé à partir de vos chiffres, que vous relisez et ajustez.</li>
                <li><Icone nom="check" taille={18} />Les indicateurs clés de la période, par niveau et par créneau.</li>
                <li><Icone nom="check" taille={18} />Un export PDF, avec les statistiques détaillées en annexe.</li>
              </ul>
              <a href={DEMO.href} className="lp-btn"><Icone nom="lecture" taille={16} /> {DEMO.texte}</a>
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
                  {["Un cahier à l'accueil, rempli quand on y pense.", "Des motifs notés en abrégé, difficiles à comparer d'une année à l'autre.", "Aucune vue des créneaux saturés ou creux."].map((t) => <li key={t}><Icone nom="x" taille={18} />{t}</li>)}
                  <li className="fort"><Icone nom="x" taille={18} />Le bilan annuel : un week-end de comptage.</li>
                </ul>
              </div>
              <div className="apres">
                <h3>Avec {NOM}</h3>
                <ul>
                  {["Chaque passage noté en 3 touches, au moment où l'élève entre.", "Des motifs choisis dans votre liste, comparables d'une période à l'autre.", "La fréquentation par créneau, toujours à jour."].map((t) => <li key={t}><Icone nom="check" taille={18} />{t}</li>)}
                  <li className="fort"><Icone nom="check" taille={18} />Le bilan annuel : 2 minutes, rédigé par l&apos;IA.</li>
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
              {SECURITE.map((s) => (
                <div key={s.titre}><span className="ic"><Icone nom={s.icone} /></span><h3>{s.titre}</h3><p>{s.texte}</p></div>
              ))}
              <div className="ia"><span className="ic"><Icone nom="bouclier" /></span><h3>IA et confidentialité</h3><p><span className="lp-tbd">[À confirmer : seules des statistiques agrégées sont transmises à l&apos;IA, jamais les noms des élèves.]</span></p></div>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section id="faq">
          <div className="lp-in lp-faq-grille">
            <div className="lp-tete">
              <p className="lp-sur">FAQ</p>
              <h2>Questions fréquentes</h2>
              <p className="lp-intro">Une autre question ? Écrivez-nous depuis l&apos;espace de votre collège.</p>
            </div>
            <div className="lp-faq">
              {FAQ.map((f) => (
                <details key={f.q}><summary>{f.q}</summary><p>{f.r}</p></details>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Appel final */}
        <section className="lp-final">
          <div className="lp-in">
            <div className="bandeau">
              <h2>Votre prochain bilan, sans recompter.</h2>
              <p>Ouvrez l&apos;espace de votre collège en 15 minutes.</p>
              {espace
                ? <Link href={espace} className="lp-btn clair">Accéder à mon espace <Icone nom="fleche" taille={18} /></Link>
                : <Link href={CTA.href} className="lp-btn clair">{CTA.texte} <Icone nom="fleche" taille={18} /></Link>}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-pied">
        <div className="lp-in">
          <Logo />
          <nav aria-label="Liens du pied de page">
            {espace ? <Link href={espace}>Mon espace</Link> : <><Link href="/connexion">Connexion</Link><Link href={CTA.href}>Ouvrir mon CDI</Link></>}
            <a href="#faq">FAQ</a>
          </nav>
          <span>Pour les CDI de collège</span>
        </div>
      </footer>
    </div>
  );
}
