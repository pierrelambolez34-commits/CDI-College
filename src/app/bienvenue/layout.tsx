import Navigation from "@/components/Navigation";
import { lireCollege } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";

/** Cadre du parcours d'accueil : réservé à l'administrateur du collège. */
export default async function LayoutBienvenue({ children }: { children: React.ReactNode }) {
  const u = await utilisateurCollege({ admin: true });
  const c = await lireCollege(u.collegeId);
  return (
    <div className="fond-app">
      <Navigation liens={[]} nomCollege={c.nom} nomUtilisateur={u.nom} />
      <main className="wrap" style={{ maxWidth: 1100 }}>{children}</main>
    </div>
  );
}
