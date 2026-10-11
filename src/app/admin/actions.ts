"use server";
import { revalidatePath } from "next/cache";
import { executer } from "@/lib/actions";
import { accepterDemande, refuserDemande, renvoyerInvitation } from "@/lib/data/demandes";
import { smtpConfigure } from "@/lib/email";
import { superAdmin } from "@/lib/session";
import { z } from "zod";

const id = z.string().uuid();

export async function actionAccepter(demandeId: string) {
  await superAdmin();
  const r = await executer(async () => {
    const c = await accepterDemande(id.parse(demandeId));
    return c.nom;
  });
  revalidatePath("/admin");
  return r.ok ? { ok: true as const, message: smtpConfigure()
    ? `${r.donnees} est créé. L'invitation est partie par e-mail.`
    : `${r.donnees} est créé. Mode test : l'invitation est dans « E-mails de test ».` } : r;
}

export async function actionRefuser(demandeId: string) {
  await superAdmin();
  const r = await executer(() => refuserDemande(id.parse(demandeId)), "Demande refusée. Le demandeur a été prévenu.");
  revalidatePath("/admin");
  return r;
}

export async function actionRenvoyer(userId: string) {
  await superAdmin();
  const r = await executer(() => renvoyerInvitation(id.parse(userId)), smtpConfigure() ? "Nouvelle invitation envoyée." : "Nouvelle invitation dans « E-mails de test ».");
  revalidatePath("/admin");
  return r;
}
