import { sql } from "drizzle-orm";
import { db } from "@/db";
import { utilisateurCollege } from "@/lib/session";
import ImportEleves from "./ImportEleves";

export const metadata = { title: "Élèves" };

export default async function Page() {
  const u = await utilisateurCollege({ admin: true });
  const [stat] = await db.execute<{ actifs: number; archives: number; classes: number }>(sql`
    SELECT count(*) FILTER (WHERE actif)::int AS actifs, count(*) FILTER (WHERE NOT actif)::int AS archives,
           count(DISTINCT division) FILTER (WHERE actif)::int AS classes
    FROM eleves WHERE college_id = ${u.collegeId}`);
  return (
    <>
      <div className="head">
        <h2>Élèves</h2>
        <p>
          {stat.actifs
            ? `${stat.actifs} élèves dans ${stat.classes} classes${stat.archives ? `, ${stat.archives} archivés` : ""}. Réimportez le fichier à chaque rentrée ou quand des élèves arrivent ou partent.`
            : "Aucun élève pour l'instant. Déposez l'export CSV de Pronote ou de SIECLE."}
        </p>
      </div>
      <ImportEleves dejaDesEleves={stat.actifs > 0} />
    </>
  );
}
