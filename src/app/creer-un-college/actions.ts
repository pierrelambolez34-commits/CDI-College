"use server";
import { executer } from "@/lib/actions";
import { inscrireCollege } from "@/lib/data/demandes";
import { smtpConfigure, urlApplication } from "@/lib/email";
import { adresseIp, autoriser } from "@/lib/limite";

type Retour = { ok: true; email: string; lienTest?: string } | { ok: false; erreur: string };

export async function envoyerDemande(_: unknown, f: FormData): Promise<Retour> {
  const v = (k: string) => String(f.get(k) ?? "");
  // Champ invisible : seuls les robots le remplissent. On fait comme si tout allait bien.
  if (v("site")) return { ok: true, email: "" };
  if (!autoriser(`inscription:${await adresseIp()}`, 5, 60 * 60_000)) {
    return { ok: false, erreur: "Trop d'inscriptions depuis cette connexion. Réessayez dans une heure." };
  }
  const r = await executer(() => inscrireCollege({
    nom: v("nom"), ville: v("ville"), codePostal: v("codePostal"), academie: v("academie"), uai: v("uai"), email: v("email"),
  }));
  if (!r.ok) return r;
  // Sur un ordinateur de développement sans serveur d'envoi, on affiche le lien directement.
  // Jamais en production : le lien doit arriver dans la boîte de la personne.
  const modeTest = !smtpConfigure() && process.env.NODE_ENV !== "production";
  return {
    ok: true, email: v("email").trim().toLowerCase(),
    lienTest: modeTest ? urlApplication(`/activation/${r.donnees!.jeton}`) : undefined,
  };
}
