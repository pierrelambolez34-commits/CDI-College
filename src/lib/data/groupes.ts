/**
 * Groupes d'élèves d'un collège (club, atelier, demi-groupe…).
 * Un groupe se sélectionne d'un coup pendant la saisie et sert de filtre dans les statistiques.
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { normaliser } from "@/lib/texte";
import { ErreurMetier } from "./college";

export type GroupeResume = { id: string; nom: string; description: string; nbEleves: number };

export async function listerGroupes(collegeId: string): Promise<GroupeResume[]> {
  return db.execute<GroupeResume>(sql`
    SELECT g.id, g.nom, g.description,
      (SELECT count(*)::int FROM groupe_eleves ge JOIN eleves e ON e.id = ge.eleve_id WHERE ge.groupe_id = g.id AND e.actif) AS "nbEleves"
    FROM groupes g WHERE g.college_id = ${collegeId} ORDER BY lower(g.nom)`);
}

/** Un groupe avec ses membres actifs ; null s'il n'appartient pas à ce collège. */
export async function lireGroupe(collegeId: string, groupeId: string) {
  const [g] = await db.select().from(schema.groupes)
    .where(and(eq(schema.groupes.id, groupeId), eq(schema.groupes.collegeId, collegeId)));
  if (!g) return null;
  const membres = await db.select({ id: schema.eleves.id }).from(schema.groupeEleves)
    .innerJoin(schema.eleves, eq(schema.eleves.id, schema.groupeEleves.eleveId))
    .where(and(eq(schema.groupeEleves.groupeId, groupeId), eq(schema.eleves.actif, true)));
  return { ...g, eleveIds: membres.map((m) => m.id) };
}

/** Groupes et identifiants de leurs membres actifs, pour la recherche de la saisie. */
export async function groupesPourSaisie(collegeId: string) {
  const rows = await db.execute<{ id: string; nom: string; eleve_ids: string[] | null }>(sql`
    SELECT g.id, g.nom, array_agg(e.id) FILTER (WHERE e.id IS NOT NULL) AS eleve_ids
    FROM groupes g
    LEFT JOIN groupe_eleves ge ON ge.groupe_id = g.id
    LEFT JOIN eleves e ON e.id = ge.eleve_id AND e.actif
    WHERE g.college_id = ${collegeId}
    GROUP BY g.id ORDER BY lower(g.nom)`);
  return rows.map((r) => ({ id: r.id, nom: r.nom, eleveIds: r.eleve_ids ?? [] }));
}

async function verifierNom(collegeId: string, nom: string, sauf?: string) {
  if (nom.length < 2) throw new ErreurMetier("Donnez un nom au groupe (2 caractères au moins).");
  if (nom.length > 60) throw new ErreurMetier("Le nom du groupe est trop long (60 caractères au maximum).");
  const autres = await db.select({ id: schema.groupes.id, nom: schema.groupes.nom }).from(schema.groupes).where(eq(schema.groupes.collegeId, collegeId));
  if (autres.some((g) => g.id !== sauf && normaliser(g.nom) === normaliser(nom))) {
    throw new ErreurMetier(`Un groupe s'appelle déjà « ${nom} ».`);
  }
}

/** Vérifie que tous les élèves appartiennent au collège. */
async function elevesDuCollege(collegeId: string, eleveIds: string[]) {
  const ids = [...new Set(eleveIds)];
  if (ids.length > 600) throw new ErreurMetier("600 élèves au maximum dans un groupe.");
  if (!ids.length) return ids;
  const ok = await db.select({ id: schema.eleves.id }).from(schema.eleves)
    .where(and(eq(schema.eleves.collegeId, collegeId), inArray(schema.eleves.id, ids)));
  if (ok.length !== ids.length) throw new ErreurMetier("Un des élèves n'appartient pas à ce collège.");
  return ids;
}

export async function creerGroupe(collegeId: string, d: { nom: string; description?: string; eleveIds?: string[] }) {
  const nom = d.nom.trim();
  await verifierNom(collegeId, nom);
  const ids = await elevesDuCollege(collegeId, d.eleveIds ?? []);
  return db.transaction(async (tx) => {
    const [g] = await tx.insert(schema.groupes).values({ collegeId, nom, description: (d.description ?? "").trim().slice(0, 300) }).returning();
    if (ids.length) await tx.insert(schema.groupeEleves).values(ids.map((eleveId) => ({ groupeId: g.id, eleveId })));
    return g;
  });
}

/** Modifie le nom, la description et remplace la liste des membres. */
export async function modifierGroupe(collegeId: string, groupeId: string, d: { nom: string; description: string; eleveIds: string[] }) {
  const g = await lireGroupe(collegeId, groupeId);
  if (!g) throw new ErreurMetier("Ce groupe n'existe pas.");
  const nom = d.nom.trim();
  await verifierNom(collegeId, nom, groupeId);
  const ids = await elevesDuCollege(collegeId, d.eleveIds);
  await db.transaction(async (tx) => {
    await tx.update(schema.groupes).set({ nom, description: d.description.trim().slice(0, 300) }).where(eq(schema.groupes.id, groupeId));
    // On ne touche qu'aux membres actifs : les élèves archivés gardent leur appartenance passée
    const actifs = await tx.select({ id: schema.eleves.id }).from(schema.groupeEleves)
      .innerJoin(schema.eleves, eq(schema.eleves.id, schema.groupeEleves.eleveId))
      .where(and(eq(schema.groupeEleves.groupeId, groupeId), eq(schema.eleves.actif, true)));
    if (actifs.length) await tx.delete(schema.groupeEleves).where(and(eq(schema.groupeEleves.groupeId, groupeId), inArray(schema.groupeEleves.eleveId, actifs.map((a) => a.id))));
    if (ids.length) await tx.insert(schema.groupeEleves).values(ids.map((eleveId) => ({ groupeId, eleveId }))).onConflictDoNothing();
  });
}

export async function supprimerGroupe(collegeId: string, groupeId: string) {
  const r = await db.delete(schema.groupes).where(and(eq(schema.groupes.id, groupeId), eq(schema.groupes.collegeId, collegeId))).returning({ id: schema.groupes.id });
  if (!r.length) throw new ErreurMetier("Ce groupe n'existe pas.");
}

export async function nomsGroupes(collegeId: string) {
  return db.select({ id: schema.groupes.id, nom: schema.groupes.nom }).from(schema.groupes)
    .where(eq(schema.groupes.collegeId, collegeId)).orderBy(asc(schema.groupes.nom));
}
