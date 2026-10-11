"use client";
/** Barre de navigation commune à tous les écrans connectés, dans le style de la page d'accueil. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { seDeconnecter } from "@/app/connexion/actions";
import Logo from "@/components/Logo";

type Lien = { href: string; label: string };
type Props = { liens?: Lien[]; nomCollege?: string; nomUtilisateur: string; admin?: boolean };

const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]!.toUpperCase()).join("");

export default function Navigation({ liens, nomCollege, nomUtilisateur, admin = false }: Props) {
  const chemin = usePathname();
  const tous: Lien[] = liens ?? [
    { href: "/saisie", label: "Saisie" },
    { href: "/statistiques", label: "Statistiques" },
    ...(admin ? [{ href: "/parametrage", label: "Paramétrage" }] : []),
  ];
  // Le lien actif est celui dont l'adresse correspond le plus précisément à la page en cours
  const actif = tous.filter((l) => chemin === l.href || chemin.startsWith(l.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav className="nav">
      <div className="nav-in">
        <Logo />
        {tous.length > 0 && (
          <div className="nav-links">
            {tous.map((l) => <Link key={l.href} href={l.href} aria-current={l.href === actif ? "page" : undefined}>{l.label}</Link>)}
          </div>
        )}
        <div className="nav-user">
          <span className="avatar" aria-hidden="true">{initiales(nomUtilisateur) || "?"}</span>
          <span className="qui"><b>{nomUtilisateur}</b>{nomCollege && <small>{nomCollege}</small>}</span>
          <form action={seDeconnecter}><button className="btn ghost sm">Se déconnecter</button></form>
        </div>
      </div>
    </nav>
  );
}
