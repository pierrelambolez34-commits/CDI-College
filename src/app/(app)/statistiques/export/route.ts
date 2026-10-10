/** Téléchargement des passages filtrés au format CSV (ouvrable dans Excel ou LibreOffice). */
import { lignesExport, lireFiltres } from "@/lib/data/stats";
import { utilisateurConnecte } from "@/lib/session";
import { formatMinute } from "@/lib/texte";

export async function GET(req: Request) {
  const u = await utilisateurConnecte();
  if (!u?.collegeId) return new Response("Connexion requise", { status: 401 });
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const lignes = await lignesExport(u.collegeId, lireFiltres(params));
  const cellule = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const csv = [
    ["Date", "Heure", "Nom", "Prénom", "Classe", "Niveau", "Type de plage", "Motif"].join(";"),
    ...lignes.map((l) => [l.jour, formatMinute(l.minute), l.nom, l.prenom, l.division, l.niveau, l.type_plage, l.motif].map(cellule).join(";")),
  ].join("\r\n");
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="passages-cdi.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
