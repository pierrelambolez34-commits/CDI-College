import type { EtatProjet } from "@/lib/data/projets";

export const LIBELLE_ETAT: Record<EtatProjet, string> = { en_cours: "En cours", a_venir: "À venir", termine: "Terminé" };
export const dateCourte = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
