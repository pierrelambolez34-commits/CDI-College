import { redirect } from "next/navigation";
import { ETAPES_ACCUEIL, lireCollege } from "@/lib/data/college";
import { utilisateurCollege } from "@/lib/session";

/** Reprend le parcours d'accueil à l'étape où il s'était arrêté. */
export default async function Bienvenue() {
  const u = await utilisateurCollege({ admin: true });
  const c = await lireCollege(u.collegeId);
  redirect(c.etapeAccueil > ETAPES_ACCUEIL ? "/saisie" : `/bienvenue/${c.etapeAccueil}`);
}
