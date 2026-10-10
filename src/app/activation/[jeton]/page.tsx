import Link from "next/link";
import CadreAccueil from "@/components/CadreAccueil";
import { lireInvitation } from "@/lib/data/demandes";
import FormulaireMotDePasse from "./FormulaireMotDePasse";

export const metadata = { title: "Choisir mon mot de passe" };
export const dynamic = "force-dynamic";

export default async function Activation({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const invitation = await lireInvitation(jeton);
  return (
    <CadreAccueil>
      {invitation ? <>
        <div>
          <h1>Bienvenue</h1>
          <p className="intro">L&apos;espace de <b style={{ color: "var(--ink)" }}>{invitation.college}</b> est prêt. Choisissez votre mot de passe pour y accéder.</p>
        </div>
        <FormulaireMotDePasse jeton={jeton} email={invitation.email} />
      </> : <>
        <div>
          <h1>Lien expiré</h1>
          <p className="intro">Ce lien a déjà été utilisé ou n&apos;est plus valable (il expire au bout de 7 jours).</p>
        </div>
        <div className="encart">
          <p>Si vous avez déjà choisi votre mot de passe, connectez-vous normalement. Sinon, demandez un nouveau lien en répondant à l&apos;e-mail d&apos;invitation.</p>
          <Link href="/connexion" className="btn primary" style={{ justifyContent: "center" }}>Aller à la connexion</Link>
        </div>
      </>}
    </CadreAccueil>
  );
}
