import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/session";
import FormulaireConnexion from "./FormulaireConnexion";

export const metadata = { title: "Connexion" };

export default async function Connexion() {
  if (await utilisateurConnecte()) redirect("/");
  return (
    <main className="login">
      <div className="panel">
        <div>
          <h1>Passages CDI</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>Connectez-vous avec le compte fourni par votre établissement.</p>
        </div>
        <FormulaireConnexion />
      </div>
    </main>
  );
}
