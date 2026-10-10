"use server";
import { revalidatePath } from "next/cache";
import { executer } from "@/lib/actions";
import { creerCollege } from "@/lib/data/college";
import { superAdmin } from "@/lib/session";

export async function actionCreerCollege(_: unknown, f: FormData) {
  await superAdmin();
  const v = (k: string) => String(f.get(k) ?? "");
  const r = await executer(() => creerCollege({
    nom: v("nom"), uai: v("uai"), commune: v("commune"), anneeScolaire: v("annee"),
    admin: { nom: v("adminNom"), email: v("adminEmail"), motDePasse: v("adminMdp") },
  }), "Collège créé. Transmettez l'adresse et le mot de passe au professeur documentaliste.");
  if (r.ok) revalidatePath("/admin");
  return r;
}
