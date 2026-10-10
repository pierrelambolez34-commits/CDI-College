import { lireCollege } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";
import FormEtablissement from "./FormEtablissement";

export const metadata = { title: "Établissement" };

export default async function Page({ searchParams }: { searchParams: Promise<{ bienvenue?: string }> }) {
  const { bienvenue } = await searchParams;
  const u = await utilisateurCollege({ admin: true });
  const c = await lireCollege(u.collegeId);
  return (
    <>
      {bienvenue && <div className="alert ok" style={{ marginTop: 0, marginBottom: 16 }}>Bienvenue ! Votre compte est actif. Vérifiez ces informations, puis passez aux horaires, aux motifs et à l&apos;import des élèves.</div>}
      <div className="head"><h2>Votre établissement</h2><p>Ces informations apparaissent sur les statistiques et le rapport d&apos;activité du CDI.</p></div>
      <FormEtablissement valeurs={{ nom: c.nom, uai: c.uai ?? "", commune: c.commune, codePostal: c.codePostal, academie: c.academie, annee: c.anneeScolaire }} />
    </>
  );
}
