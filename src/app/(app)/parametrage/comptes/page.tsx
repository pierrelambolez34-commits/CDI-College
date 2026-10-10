import { lireComptes } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";
import { FormCompte, BoutonSupprimer } from "./Comptes";

export const metadata = { title: "Comptes" };

export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const comptes = await lireComptes(u.collegeId);
  return (
    <>
      <div className="head"><h2>Comptes</h2><p>Les administrateurs ont accès au paramétrage. Les utilisateurs (assistants d&apos;éducation, collègues) peuvent saisir et consulter les statistiques.</p></div>
      <div className="tbl"><table>
        <thead><tr><th>Nom</th><th>E-mail</th><th>Rôle</th><th /></tr></thead>
        <tbody>{comptes.map((c) => (
          <tr key={c.id}><td><b>{c.nom}</b></td><td>{c.email}</td><td>{c.role === "admin" ? "Administrateur" : "Utilisateur"}</td>
            <td style={{ textAlign: "right" }}>{c.id === u.id ? <span className="muted small">vous</span> : <BoutonSupprimer id={c.id} nom={c.nom} />}</td></tr>
        ))}</tbody>
      </table></div>
      <div className="sec"><h3>Ajouter un compte</h3><FormCompte /></div>
    </>
  );
}
