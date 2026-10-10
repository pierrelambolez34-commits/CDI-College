import { utilisateurCollege } from "@/lib/session";
import MenuParametrage from "./MenuParametrage";

export default async function LayoutParametrage({ children }: { children: React.ReactNode }) {
  await utilisateurCollege({ admin: true });
  return (
    <main className="wrap">
      <div className="page-head"><h1>Paramétrage</h1><span className="muted small">À faire une fois par an, à la rentrée</span></div>
      <div className="param">
        <nav><MenuParametrage /></nav>
        <section className="panel">{children}</section>
      </div>
    </main>
  );
}
