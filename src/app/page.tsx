import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/session";

/** Page d'accueil : envoie chacun vers le bon écran. */
export default async function Accueil() {
  const u = await utilisateurConnecte();
  if (!u) redirect("/connexion");
  redirect(u.role === "superadmin" ? "/admin" : "/saisie");
}
