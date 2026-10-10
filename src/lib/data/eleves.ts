/** Élèves d'un collège : import annuel et liste pour la saisie. */
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { cleEleve, niveauDeDivision } from "@/lib/texte";
import { ErreurMetier } from "./college";

export type EleveImporte = { nom: string; prenom: string; division: string };

export async function listerElevesActifs(collegeId: string) {
  return db.select({
    id: schema.eleves.id, nom: schema.eleves.nom, prenom: schema.eleves.prenom, division: schema.eleves.division,
  }).from(schema.eleves)
    .where(and(eq(schema.eleves.collegeId, collegeId), eq(schema.eleves.actif, true)))
    .orderBy(asc(schema.eleves.nom), asc(schema.eleves.prenom));
}

/**
 * Importe la liste des élèves.
 * - Un élève déjà connu (même nom et prénom) est mis à jour : sa classe peut changer d'une année à l'autre.
 * - Un nouvel élève est ajouté.
 * - Si `archiverAbsents` est vrai, les élèves absents du fichier sont archivés : ils
 *   disparaissent de la saisie mais leurs passages restent dans les statistiques.
 */
export async function importerEleves(collegeId: string, lignes: EleveImporte[], archiverAbsents: boolean) {
  const propres = lignes
    .map((l) => ({ nom: l.nom.trim().toUpperCase(), prenom: l.prenom.trim(), division: l.division.trim().toUpperCase() }))
    .filter((l) => l.nom && l.prenom && l.division);
  if (!propres.length) throw new ErreurMetier("Le fichier ne contient aucun élève complet (nom, prénom et classe).");
  if (propres.length > 3000) throw new ErreurMetier("Le fichier contient plus de 3 000 élèves : vérifiez qu'il s'agit du bon export.");

  const existants = await db.select().from(schema.eleves).where(eq(schema.eleves.collegeId, collegeId));
  // Regroupe les élèves existants par nom + prénom (des homonymes peuvent exister dans des classes différentes).
  const parCle = new Map<string, typeof existants>();
  for (const e of existants) parCle.set(e.cle, [...(parCle.get(e.cle) ?? []), e]);

  const conserves = new Set<string>();
  let ajoutes = 0, misAJour = 0;
  await db.transaction(async (tx) => {
    for (const l of propres) {
      const cle = cleEleve(l.nom, l.prenom);
      const candidats = (parCle.get(cle) ?? []).filter((e) => !conserves.has(e.id));
      // Priorité : même classe, sinon le seul homonyme connu.
      const trouve = candidats.find((e) => e.division === l.division) ?? (candidats.length === 1 ? candidats[0] : undefined);
      if (trouve) {
        conserves.add(trouve.id);
        if (trouve.division !== l.division || !trouve.actif || trouve.nom !== l.nom || trouve.prenom !== l.prenom) {
          await tx.update(schema.eleves).set({
            nom: l.nom, prenom: l.prenom, division: l.division, niveau: niveauDeDivision(l.division), actif: true,
          }).where(eq(schema.eleves.id, trouve.id));
          misAJour++;
        }
      } else {
        const [n] = await tx.insert(schema.eleves).values({
          collegeId, nom: l.nom, prenom: l.prenom, division: l.division, niveau: niveauDeDivision(l.division), cle,
        }).onConflictDoNothing().returning({ id: schema.eleves.id });
        if (n) { conserves.add(n.id); ajoutes++; }
      }
    }
    if (archiverAbsents) {
      const absents = existants.filter((e) => e.actif && !conserves.has(e.id)).map((e) => e.id);
      if (absents.length) {
        await tx.update(schema.eleves).set({ actif: false })
          .where(and(eq(schema.eleves.collegeId, collegeId), inArray(schema.eleves.id, absents)));
      }
    }
  });
  const archives = archiverAbsents ? existants.filter((e) => e.actif && !conserves.has(e.id)).length : 0;
  return { ajoutes, misAJour, archives, total: conserves.size };
}
