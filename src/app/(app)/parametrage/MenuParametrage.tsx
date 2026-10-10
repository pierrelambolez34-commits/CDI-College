"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ETAPES = [
  { href: "/parametrage/etablissement", t: "Établissement", s: "Nom, UAI, année" },
  { href: "/parametrage/horaires", t: "Horaires du CDI", s: "Plages et types" },
  { href: "/parametrage/motifs", t: "Motifs de venue", s: "8 raccourcis clavier" },
  { href: "/parametrage/eleves", t: "Élèves", s: "Import du fichier CSV" },
  { href: "/parametrage/comptes", t: "Comptes", s: "Qui peut saisir" },
];

export default function MenuParametrage() {
  const chemin = usePathname();
  return (
    <ul className="rail">
      {ETAPES.map((e) => (
        <li key={e.href}><Link href={e.href} aria-current={chemin === e.href ? "page" : undefined}><b>{e.t}</b><span>{e.s}</span></Link></li>
      ))}
    </ul>
  );
}
