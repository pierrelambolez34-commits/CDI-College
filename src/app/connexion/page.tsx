import Link from "next/link";
import { redirect } from "next/navigation";
import CadreAccueil from "@/components/CadreAccueil";
import { utilisateurConnecte } from "@/lib/session";
import FormulaireConnexion from "./FormulaireConnexion";

export const metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ active?: string }> }) {
  if (await utilisateurConnecte()) redirect("/");
  const { active } = await searchParams;
  return (
    <CadreAccueil>
      <div>
        <h1>Connexion</h1>
        <p className="intro">Accédez à l&apos;espace CDI de votre collège.</p>
      </div>
      {active && <div className="alert ok" style={{ marginTop: 0 }}>Votre mot de passe est enregistré. Vous pouvez vous connecter.</div>}
      <FormulaireConnexion />
      <p className="muted small" style={{ margin: 0 }}>Mot de passe oublié ? Demandez à l&apos;administrateur de votre collège.</p>
      <div className="separateur">Nouveau collège</div>
      <div className="encart">
        <p>Votre collège n&apos;utilise pas encore Passages CDI ? Faites une demande : nous ouvrons l&apos;espace et vous envoyons un lien pour choisir votre mot de passe.</p>
        <Link href="/creer-un-college" className="btn" style={{ justifyContent: "center" }}>Création d&apos;un collège</Link>
      </div>
    </CadreAccueil>
  );
}
