"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { executer } from "@/lib/actions";
import { renvoyerInvitation } from "@/lib/data/demandes";
import { smtpConfigure } from "@/lib/email";
import { superAdmin } from "@/lib/session";

export async function actionRenvoyer(userId: string) {
  await superAdmin();
  const r = await executer(() => renvoyerInvitation(z.string().uuid().parse(userId)),
    smtpConfigure() ? "Nouveau lien d'activation envoyé." : "Nouveau lien dans « E-mails de test ».");
  revalidatePath("/admin");
  return r;
}
