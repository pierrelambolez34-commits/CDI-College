import { lireMotifs } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";
import EditeurMotifs from "./EditeurMotifs";

export const metadata = { title: "Motifs de venue" };

export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const motifs = await lireMotifs(u.collegeId);
  return (
    <>
      <div className="head"><h2>Motifs de venue</h2><p>Chaque motif correspond à une touche du clavier pendant la saisie. Placez les plus fréquents en haut. Un motif retiré reste dans les statistiques passées.</p></div>
      <EditeurMotifs initiaux={motifs.map((m) => ({ id: m.id, libelle: m.libelle }))} />
    </>
  );
}
