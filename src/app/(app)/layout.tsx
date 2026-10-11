import { redirect } from "next/navigation";
import Navigation from "@/components/Navigation";
import { ETAPES_ACCUEIL, lireCollege } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";

/** Cadre commun aux écrans d'un collège : vérifie la connexion et affiche le menu. */
export default async function LayoutCollege({ children }: { children: React.ReactNode }) {
  const u = await utilisateurCollege();
  const college = await lireCollege(u.collegeId);
  // Tant que l'administrateur n'a pas fini la mise en route, on l'y ramène.
  if (u.role === "admin" && college.etapeAccueil <= ETAPES_ACCUEIL) redirect("/bienvenue");
  return (
    <>
      <Navigation nomCollege={college.nom} nomUtilisateur={u.nom} admin={u.role === "admin"} />
      {children}
    </>
  );
}
