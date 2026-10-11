import Logo from "@/components/Logo";
import { seDeconnecter } from "@/app/connexion/actions";
import { lireCollege } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";

/** Cadre du parcours d'accueil : réservé à l'administrateur du collège. */
export default async function LayoutBienvenue({ children }: { children: React.ReactNode }) {
  const u = await utilisateurCollege({ admin: true });
  const c = await lireCollege(u.collegeId);
  return (
    <>
      <nav className="nav"><div className="nav-in">
        <Logo />
        <div className="nav-user"><span>{c.nom}</span><form action={seDeconnecter}><button className="btn ghost sm">Se déconnecter</button></form></div>
      </div></nav>
      <main className="wrap" style={{ maxWidth: 1100 }}>{children}</main>
    </>
  );
}
