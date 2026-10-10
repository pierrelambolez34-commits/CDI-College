"use server";
import { executer } from "@/lib/actions";
import { deposerDemande } from "@/lib/data/demandes";
import { adresseIp, autoriser } from "@/lib/limite";

export async function envoyerDemande(_: unknown, f: FormData) {
  const v = (k: string) => String(f.get(k) ?? "");
  // Champ invisible : seuls les robots le remplissent. On fait comme si tout allait bien.
  if (v("site")) return { ok: true as const, message: "" };
  if (!autoriser(`demande:${await adresseIp()}`, 5, 60 * 60_000)) {
    return { ok: false as const, erreur: "Trop de demandes depuis cette connexion. Réessayez dans une heure." };
  }
  const r = await executer(() => deposerDemande({
    nom: v("nom"), ville: v("ville"), codePostal: v("codePostal"), academie: v("academie"), uai: v("uai"), email: v("email"),
  }));
  return r.ok ? { ok: true as const, message: v("email").trim().toLowerCase() } : r;
}
