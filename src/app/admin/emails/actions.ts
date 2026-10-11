"use server";
import { revalidatePath } from "next/cache";
import { viderEmailsTest } from "@/lib/email";
import { superAdmin } from "@/lib/session";

export async function actionVider() {
  await superAdmin();
  viderEmailsTest();
  revalidatePath("/admin/emails");
}
