import { utilisateurCollege } from "@/lib/session";
import MenuParametrage from "./MenuParametrage";
import EnTete from "@/components/EnTete";

export default async function LayoutParametrage({ children }: { children: React.ReactNode }) {
  await utilisateurCollege({ admin: true });
  return (
    <main className="wrap">
      <EnTete sur="Administration du CDI" icone="calendrier" titre="Paramétrage" intro="À faire une fois par an, à la rentrée : établissement, horaires, motifs, élèves et comptes." />
      <div className="param">
        <nav><MenuParametrage /></nav>
        <section className="panel">{children}</section>
      </div>
    </main>
  );
}
