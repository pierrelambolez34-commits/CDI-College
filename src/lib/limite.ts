/**
 * Limite simple du nombre de tentatives (connexion, demandes de collège),
 * pour freiner les robots. Conservée en mémoire : suffisant pour un seul serveur.
 */
import "server-only";
import { headers } from "next/headers";

const compteurs = new Map<string, number[]>();

export async function adresseIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
}

/** Renvoie false si la clé a dépassé `max` essais sur la durée donnée. */
export function autoriser(cle: string, max: number, dureeMs: number) {
  const maintenant = Date.now();
  const essais = (compteurs.get(cle) ?? []).filter((t) => maintenant - t < dureeMs);
  if (essais.length >= max) { compteurs.set(cle, essais); return false; }
  essais.push(maintenant);
  compteurs.set(cle, essais);
  if (compteurs.size > 10_000) compteurs.clear();
  return true;
}
