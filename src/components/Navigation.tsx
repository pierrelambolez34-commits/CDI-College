"use client";
import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { seDeconnecter } from "@/app/connexion/actions";

type Props = { nomCollege: string; nomUtilisateur: string; admin: boolean };

export default function Navigation({ nomCollege, nomUtilisateur, admin }: Props) {
  const chemin = usePathname();
  const liens = [
    { href: "/saisie", label: "Saisie" },
    { href: "/statistiques", label: "Statistiques" },
    ...(admin ? [{ href: "/parametrage", label: "Paramétrage" }] : []),
  ];
  return (
    <nav className="nav">
      <div className="nav-in">
        <Logo />
        <div className="nav-links">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} aria-current={chemin.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
        </div>
        <div className="nav-user">
          <span>{nomCollege} · {nomUtilisateur}</span>
          <form action={seDeconnecter}><button className="btn ghost sm">Se déconnecter</button></form>
        </div>
      </div>
    </nav>
  );
}
