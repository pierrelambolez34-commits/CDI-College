/** Enregistrement et lecture des passages au CDI. */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Instant } from "@/lib/temps";
import { ErreurMetier } from "./college";

/**
 * Enregistre un passage pour chaque élève de la liste.
 * Vérifie que les élèves et le motif appartiennent bien au collège : impossible
 * d'écrire dans les données d'un autre établissement, même en trafiquant la requête.
 */
export async function enregistrerPassages(
  collegeId: string,
  userId: string | null,
  d: { eleveIds: string[]; motifId: string; typePlage: string; instant: Instant },
) {
  const ids = [...new Set(d.eleveIds)];
  if (!ids.length) throw new ErreurMetier("Choisissez au moins un élève.");
  if (ids.length > 60) throw new ErreurMetier("60 élèves au maximum en une seule saisie.");
  const typePlage = d.typePlage.trim().slice(0, 60) || "Hors horaires";

  const [motif] = await db.select({ id: schema.motifs.id }).from(schema.motifs)
    .where(and(eq(schema.motifs.id, d.motifId), eq(schema.motifs.collegeId, collegeId), eq(schema.motifs.actif, true)));
  if (!motif) throw new ErreurMetier("Ce motif n'existe pas ou a été supprimé.");

  const valides = await db.select({ id: schema.eleves.id }).from(schema.eleves)
    .where(and(eq(schema.eleves.collegeId, collegeId), inArray(schema.eleves.id, ids)));
  if (valides.length !== ids.length) throw new ErreurMetier("Un des élèves n'appartient pas à ce collège.");

  return db.insert(schema.passages).values(ids.map((eleveId) => ({
    collegeId, eleveId, motifId: motif.id, typePlage, jour: d.instant.jour, minute: d.instant.minute, saisiPar: userId,
  }))).returning({ id: schema.passages.id });
}

/** Supprime des passages (bouton « Annuler »), uniquement s'ils appartiennent au collège. */
export async function annulerPassages(collegeId: string, ids: string[]) {
  if (!ids.length) return 0;
  const r = await db.delete(schema.passages)
    .where(and(eq(schema.passages.collegeId, collegeId), inArray(schema.passages.id, ids)))
    .returning({ id: schema.passages.id });
  return r.length;
}

/** Passages d'une journée, du plus récent au plus ancien. */
export async function passagesDuJour(collegeId: string, jour: string) {
  return db.select({
    id: schema.passages.id, eleveId: schema.passages.eleveId, motifId: schema.passages.motifId,
    typePlage: schema.passages.typePlage, minute: schema.passages.minute,
  }).from(schema.passages)
    .where(and(eq(schema.passages.collegeId, collegeId), eq(schema.passages.jour, jour)))
    .orderBy(desc(schema.passages.minute), desc(schema.passages.createdAt));
}

/** Dernier motif de chaque élève : il est proposé par défaut à la saisie suivante. */
export async function motifsHabituels(collegeId: string): Promise<Record<string, string>> {
  const rows = await db.execute<{ eleve_id: string; motif_id: string }>(sql`
    SELECT DISTINCT ON (eleve_id) eleve_id, motif_id
    FROM passages WHERE college_id = ${collegeId}
    ORDER BY eleve_id, jour DESC, minute DESC, created_at DESC`);
  return Object.fromEntries(rows.map((r) => [r.eleve_id, r.motif_id]));
}
