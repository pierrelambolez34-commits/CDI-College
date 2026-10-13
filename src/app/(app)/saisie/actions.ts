"use server";
import { executer } from "@/lib/actions";
import { annulerPassages, enregistrerPassages } from "@/lib/data/passages";
import { utilisateurCollege } from "@/lib/session";
import { instantParis } from "@/lib/temps";
import { schemas, verifier } from "@/lib/validation";

/** Enregistre l'entrée d'un ou plusieurs élèves. L'heure est celle du serveur (heure de Paris). */
export async function actionEnregistrer(d: { eleveIds: string[]; motifId: string; typePlage: string; projetId?: string | null }) {
  const u = await utilisateurCollege();
  const instant = instantParis();
  return executer(async () => {
    const v = verifier(schemas.enregistrer, d);
    const crees = await enregistrerPassages(u.collegeId, u.id, { ...v, instant });
    return { ids: crees.map((c) => c.id), minute: instant.minute };
  });
}

export async function actionAnnuler(ids: string[]) {
  const u = await utilisateurCollege();
  return executer(() => annulerPassages(u.collegeId, verifier(schemas.annuler, ids)));
}
