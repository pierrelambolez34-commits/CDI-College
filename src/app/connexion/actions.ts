"use server";
import { redirect } from "next/navigation";
import { fermerSession, ouvrirSession, verifierIdentifiants } from "@/lib/session";

export async function seConnecter(_: unknown, form: FormData) {
  const email = String(form.get("email") ?? "");
  const motDePasse = String(form.get("motDePasse") ?? "");
  const u = await verifierIdentifiants(email, motDePasse);
  if (!u) return { erreur: "Adresse e-mail ou mot de passe incorrect." };
  await ouvrirSession(u.id);
  redirect(u.role === "superadmin" ? "/admin" : "/saisie");
}

export async function seDeconnecter() {
  await fermerSession();
  redirect("/connexion");
}
