import { lireCollege, lirePlages } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";
import EditeurHoraires from "./EditeurHoraires";

export const metadata = { title: "Horaires du CDI" };

export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const [c, plages] = await Promise.all([lireCollege(u.collegeId), lirePlages(u.collegeId)]);
  return (
    <>
      <div className="head"><h2>Horaires d&apos;ouverture du CDI</h2><p>Découpez chaque journée en plages et donnez un type à chacune. Pendant la saisie, la plage en cours est reconnue automatiquement à partir de l&apos;heure.</p></div>
      <EditeurHoraires typesInitiaux={c.typesPlage} plagesInitiales={plages.map(({ jour, debut, fin, type }) => ({ jour, debut, fin, type }))} />
    </>
  );
}
