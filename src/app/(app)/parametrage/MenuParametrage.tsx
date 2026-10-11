"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icone from "@/components/Icone";

const ETAPES = [
  { href: "/parametrage/etablissement", t: "Établissement", s: "Nom, UAI, année", icone: "ecole", c: "var(--accent)" },
  { href: "/parametrage/horaires", t: "Horaires du CDI", s: "Plages et types", icone: "calendrier", c: "var(--mint)" },
  { href: "/parametrage/motifs", t: "Motifs de venue", s: "8 raccourcis clavier", icone: "clavier", c: "var(--sun)" },
  { href: "/parametrage/eleves", t: "Élèves", s: "Import du fichier CSV", icone: "import", c: "var(--pep)" },
  { href: "/parametrage/comptes", t: "Comptes", s: "Qui peut saisir", icone: "equipe", c: "var(--accent)" },
];

export default function MenuParametrage() {
  const chemin = usePathname();
  return (
    <ul className="rail">
      {ETAPES.map((e) => (
        <li key={e.href}>
          <Link href={e.href} aria-current={chemin === e.href ? "page" : undefined}>
            <span className="tuile" style={{ "--c": e.c } as React.CSSProperties}><Icone nom={e.icone} taille={18} /></span>
            <span className="txt"><b>{e.t}</b><span>{e.s}</span></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
