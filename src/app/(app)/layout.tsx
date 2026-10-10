import Navigation from "@/components/Navigation";
import { lireCollege } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";

/** Cadre commun aux écrans d'un collège : vérifie la connexion et affiche le menu. */
export default async function LayoutCollege({ children }: { children: React.ReactNode }) {
  const u = await utilisateurCollege();
  const college = await lireCollege(u.collegeId);
  return (
    <>
      <Navigation nomCollege={college.nom} nomUtilisateur={u.nom} admin={u.role === "admin"} />
      {children}
    </>
  );
}
