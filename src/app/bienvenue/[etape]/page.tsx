/**
 * Parcours d'accueil d'un nouveau collège, en 4 étapes :
 *   1. Établissement (repris de l'inscription)  2. Horaires  3. Motifs  4. Élèves
 * Chaque étape enregistre puis passe à la suivante. On peut revenir sur une étape déjà faite.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import FormEtablissement from "@/app/(app)/parametrage/etablissement/FormEtablissement";
import EditeurHoraires from "@/app/(app)/parametrage/horaires/EditeurHoraires";
import EditeurMotifs from "@/app/(app)/parametrage/motifs/EditeurMotifs";
import ImportEleves from "@/app/(app)/parametrage/eleves/ImportEleves";
import { ETAPES_ACCUEIL, lireCollege, lireMotifs, lirePlages } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";
import Icone from "@/components/Icone";
import EnTete, { TeteCarte } from "@/components/EnTete";

export const metadata = { title: "Bienvenue" };
export const dynamic = "force-dynamic";

const ETAPES = [
  { nom: "Établissement", sous: "Vos informations", icone: "ecole", c: "var(--accent)" },
  { nom: "Horaires du CDI", sous: "Plages et types", icone: "calendrier", c: "var(--mint)" },
  { nom: "Motifs de venue", sous: "Vos 8 raccourcis", icone: "clavier", c: "var(--sun)" },
  { nom: "Élèves", sous: "Import du fichier", icone: "import", c: "var(--pep)" },
];

const INTRO = [
  { titre: "Vérifiez les informations de votre collège", texte: "Nous avons repris ce que vous avez saisi à l'inscription. Complétez ou corrigez si besoin." },
  { titre: "Quand le CDI est-il ouvert ?", texte: "Une semaine type est déjà proposée. Ajustez les plages et leur type : pendant la saisie, la plage en cours sera reconnue à partir de l'heure." },
  { titre: "Pourquoi les élèves viennent-ils ?", texte: "Chaque motif correspond à une touche du clavier pendant la saisie. Gardez la liste proposée ou adaptez-la, en plaçant les plus fréquents en haut." },
  { titre: "Importez la liste des élèves", texte: "Déposez l'export CSV de Pronote ou de SIECLE. Le fichier est lu sur votre ordinateur : seuls le nom, le prénom et la classe sont conservés." },
];

export default async function EtapeAccueil({ params }: { params: Promise<{ etape: string }> }) {
  const n = Number((await params).etape);
  if (!Number.isInteger(n) || n < 1 || n > ETAPES_ACCUEIL) notFound();
  const u = await utilisateurCollege({ admin: true });
  const c = await lireCollege(u.collegeId);
  const atteinte = Math.min(c.etapeAccueil, ETAPES_ACCUEIL);
  if (c.etapeAccueil <= ETAPES_ACCUEIL && n > atteinte) redirect(`/bienvenue/${atteinte}`);
  const termine = c.etapeAccueil > ETAPES_ACCUEIL;

  let contenu: React.ReactNode;
  const libelle = "Enregistrer et continuer";
  if (n === 1) {
    contenu = <FormEtablissement etapeSuivante={2} libelle={libelle} valeurs={{ nom: c.nom, uai: c.uai ?? "", commune: c.commune, codePostal: c.codePostal, academie: c.academie, annee: c.anneeScolaire }} />;
  } else if (n === 2) {
    const plages = await lirePlages(u.collegeId);
    contenu = <EditeurHoraires etapeSuivante={3} libelle={libelle} typesInitiaux={c.typesPlage} plagesInitiales={plages.map(({ jour, debut, fin, type }) => ({ jour, debut, fin, type }))} />;
  } else if (n === 3) {
    const motifs = await lireMotifs(u.collegeId);
    contenu = <EditeurMotifs etapeSuivante={4} libelle={libelle} initiaux={motifs.map((m) => ({ id: m.id, libelle: m.libelle }))} />;
  } else {
    const [{ n: nb }] = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM eleves WHERE college_id = ${u.collegeId} AND actif`);
    contenu = <ImportEleves dejaDesEleves={nb > 0} accueil />;
  }

  return (
    <>
      <EnTete sur={`Mise en route · étape ${n} sur ${ETAPES_ACCUEIL}`} icone="etincelles" titre="Bienvenue sur Passages CDI"
        intro="Quatre étapes rapides et votre CDI est prêt pour la première saisie.">
        {termine && <Link href="/saisie" className="btn">Aller à la saisie <Icone nom="fleche" taille={16} /></Link>}
      </EnTete>
      <div className="accueil-barre" aria-hidden="true"><i style={{ width: `${((n - 1) / ETAPES_ACCUEIL) * 100}%` }} /></div>
      <ol className="accueil-etapes" aria-label="Étapes de la mise en route">
        {ETAPES.map((e, i) => {
          const k = i + 1;
          const etat = k === n ? "encours" : k < atteinte || termine ? "fait" : "";
          const interieur = <><span className="n">{etat === "fait" ? <Icone nom="check" taille={15} /> : k}</span><span><b>{e.nom}</b><small>{e.sous}</small></span></>;
          return (
            <li key={e.nom} style={{ "--c": e.c } as React.CSSProperties}>
              {k <= atteinte || termine
                ? <Link href={`/bienvenue/${k}`} className={etat} aria-current={k === n ? "step" : undefined}>{interieur}</Link>
                : <span aria-disabled="true">{interieur}</span>}
            </li>
          );
        })}
      </ol>
      <section className="panel">
        <TeteCarte icone={ETAPES[n - 1].icone} couleur={ETAPES[n - 1].c} titre={INTRO[n - 1].titre} />
        <p className="muted" style={{ margin: "0 0 18px", maxWidth: "68ch" }}>{INTRO[n - 1].texte}</p>
        {contenu}
        {n > 1 && <p style={{ margin: "14px 0 0" }}><Link href={`/bienvenue/${n - 1}`} className="small">← Étape précédente</Link></p>}
      </section>
    </>
  );
}
