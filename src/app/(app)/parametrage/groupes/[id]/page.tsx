import Link from "next/link";
import { notFound } from "next/navigation";
import { listerElevesActifs } from "@/lib/data/eleves";
import { lireGroupe } from "@/lib/data/groupes";
import { utilisateurCollege } from "@/lib/session";
import EditeurGroupe from "./EditeurGroupe";

export const metadata = { title: "Groupe d'élèves" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await utilisateurCollege({ admin: true });
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [g, eleves] = await Promise.all([lireGroupe(u.collegeId, id), listerElevesActifs(u.collegeId)]);
  if (!g) notFound();
  return (
    <>
      <p style={{ margin: "0 0 12px" }}><Link href="/parametrage/groupes" className="small">← Tous les groupes</Link></p>
      <EditeurGroupe groupe={{ id: g.id, nom: g.nom, description: g.description, eleveIds: g.eleveIds }} eleves={eleves} />
    </>
  );
}
