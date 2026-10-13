import Link from "next/link";
import { TeteCarte } from "@/components/EnTete";
import { listerElevesActifs } from "@/lib/data/eleves";
import { nomsGroupes } from "@/lib/data/groupes";
import { utilisateurCollege } from "@/lib/session";
import { instantParis } from "@/lib/temps";
import FormProjet from "../FormProjet";

export const metadata = { title: "Nouveau projet" };

export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const [eleves, groupes] = await Promise.all([listerElevesActifs(u.collegeId), nomsGroupes(u.collegeId)]);
  const divisions = [...new Set(eleves.map((e) => e.division))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  return (
    <>
      <p style={{ margin: "0 0 12px" }}><Link href="/parametrage/projets" className="small">← Tous les projets</Link></p>
      <TeteCarte icone="etincelles" couleur="var(--sun)" titre="Nouveau projet" sous="Vous pourrez modifier ces informations à tout moment" />
      <FormProjet projetId={null} divisions={divisions} groupes={groupes}
        initial={{ nom: "", description: "", partenaires: "", debut: instantParis().jour, fin: null, classes: [], groupeIds: [] }} />
    </>
  );
}
