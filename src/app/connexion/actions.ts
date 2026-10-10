"use server";
import { redirect } from "next/navigation";
import { adresseIp, autoriser } from "@/lib/limite";
import { fermerSession, ouvrirSession, verifierIdentifiants } from "@/lib/session";

export async function seConnecter(_: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const motDePasse = String(form.get("motDePasse") ?? "");
  // 10 essais par quart d'heure et par adresse, pour freiner les robots
  if (!autoriser(`connexion:${await adresseIp()}:${email}`, 10, 15 * 60_000)) {
    return { erreur: "Trop de tentatives. Patientez un quart d'heure avant de réessayer.", email };
  }
  const u = await verifierIdentifiants(email, motDePasse);
  if (!u) return { erreur: "Adresse e-mail ou mot de passe incorrect.", email };
  await ouvrirSession(u.id);
  redirect(u.role === "superadmin" ? "/admin" : "/saisie");
}

export async function seDeconnecter() {
  await fermerSession();
  redirect("/connexion");
}
