"use server";
/** Actions du paramétrage, réservées aux administrateurs du collège. */
import { revalidatePath } from "next/cache";
import { executer } from "@/lib/actions";
import {
  ajouterCompte, enregistrerHoraires, enregistrerMotifs, modifierEtablissement, supprimerCompte,
} from "@/lib/data/college";
import { importerEleves, type EleveImporte } from "@/lib/data/eleves";
import type { PlageSaisie } from "@/lib/horaires";
import { utilisateurCollege } from "@/lib/session";
import { schemas, verifier } from "@/lib/validation";

const admin = () => utilisateurCollege({ admin: true });

export async function actionEtablissement(_: unknown, f: FormData) {
  const u = await admin();
  const v = (k: string) => String(f.get(k) ?? "");
  const r = await executer(() => modifierEtablissement(u.collegeId, {
    nom: v("nom"), uai: v("uai"), commune: v("commune"), codePostal: v("codePostal"), academie: v("academie"), anneeScolaire: v("annee"),
  }), "Informations enregistrées.");
  revalidatePath("/", "layout");
  return r;
}

export async function actionHoraires(types: string[], plages: PlageSaisie[]) {
  const u = await admin();
  const r = await executer(() => { const v = verifier(schemas.horaires, { types, plages }); return enregistrerHoraires(u.collegeId, v.types, v.plages); }, "Horaires enregistrés.");
  revalidatePath("/saisie");
  return r;
}

export async function actionMotifs(liste: { id?: string; libelle: string }[]) {
  const u = await admin();
  const r = await executer(() => enregistrerMotifs(u.collegeId, verifier(schemas.motifs, liste)), "Motifs enregistrés.");
  revalidatePath("/parametrage/motifs");
  revalidatePath("/saisie");
  return r;
}

/** Reçoit uniquement nom, prénom et classe : le reste du fichier n'a jamais quitté le navigateur. */
export async function actionImport(lignes: EleveImporte[], archiverAbsents: boolean) {
  const u = await admin();
  const r = await executer(() => importerEleves(u.collegeId, verifier(schemas.import, lignes), archiverAbsents === true));
  revalidatePath("/saisie");
  return r;
}

export async function actionAjouterCompte(_: unknown, f: FormData) {
  const u = await admin();
  const v = (k: string) => String(f.get(k) ?? "");
  const r = await executer(() => ajouterCompte(u.collegeId, {
    nom: v("nom"), email: v("email"), motDePasse: v("mdp"), role: v("role") === "admin" ? "admin" : "utilisateur",
  }), "Compte créé. Transmettez l'adresse et le mot de passe à la personne.");
  revalidatePath("/parametrage/comptes");
  return r;
}

export async function actionSupprimerCompte(id: string) {
  const u = await admin();
  const r = await executer(() => supprimerCompte(u.collegeId, id, u.id), "Compte supprimé.");
  revalidatePath("/parametrage/comptes");
  return r;
}
