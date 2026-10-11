import Navigation from "@/components/Navigation";
import { superAdmin } from "@/lib/session";

/** Cadre de l'espace super-administrateur. */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const u = await superAdmin();
  return (
    <div className="fond-app">
      <Navigation liens={[{ href: "/admin", label: "Collèges" }, { href: "/admin/emails", label: "E-mails de test" }]} nomUtilisateur={u.nom} />
      {children}
    </div>
  );
}
