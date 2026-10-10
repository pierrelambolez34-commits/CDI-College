/** Contrôle des données reçues par le serveur (on ne fait jamais confiance au navigateur). */
import { z } from "zod";
import { ErreurMetier } from "@/lib/data/college";

const id = z.string().uuid();

export const schemas = {
  enregistrer: z.object({ eleveIds: z.array(id).min(1).max(60), motifId: id, typePlage: z.string().max(60) }),
  annuler: z.array(id).max(60),
  horaires: z.object({
    types: z.array(z.string().max(40)).max(12),
    plages: z.array(z.object({ jour: z.number().int(), debut: z.number().int().min(0).max(1439), fin: z.number().int().min(0).max(1440), type: z.string().max(40) })).max(150),
  }),
  motifs: z.array(z.object({ id: id.optional(), libelle: z.string().max(40) })).max(8),
  import: z.array(z.object({ nom: z.string().max(80), prenom: z.string().max(80), division: z.string().max(20) })).max(3000),
};

export function verifier<T>(schema: z.ZodType<T>, valeur: unknown): T {
  const r = schema.safeParse(valeur);
  if (!r.success) throw new ErreurMetier("Les données envoyées sont invalides. Rechargez la page et réessayez.");
  return r.data;
}
