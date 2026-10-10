/** Outils communs aux « server actions » (fonctions appelées par les formulaires). */
import { ErreurMetier } from "@/lib/data/college";

export type Resultat<T = undefined> = { ok: true; message?: string; donnees?: T } | { ok: false; erreur: string };

/** Exécute une action et transforme les erreurs prévues en message lisible. */
export async function executer<T>(fn: () => Promise<T>, message?: string): Promise<Resultat<T>> {
  try {
    const donnees = await fn();
    return { ok: true, message, donnees };
  } catch (e) {
    if (e instanceof ErreurMetier) return { ok: false, erreur: e.message };
    // Les redirections de Next.js doivent continuer leur chemin.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error(e);
    return { ok: false, erreur: "Une erreur inattendue est survenue. Réessayez dans un instant." };
  }
}
