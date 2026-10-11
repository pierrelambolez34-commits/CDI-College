"use server";
import { redirect } from "next/navigation";
import { executer } from "@/lib/actions";
import { activerCompte } from "@/lib/data/demandes";
import { ouvrirSession } from "@/lib/session";

export async function choisirMotDePasse(jeton: string, _: unknown, f: FormData) {
  const r = await executer(() => activerCompte(jeton, String(f.get("motDePasse") ?? ""), String(f.get("confirmation") ?? "")));
  if (!r.ok) return r;
  await ouvrirSession(r.donnees!);
  redirect("/bienvenue");
}
