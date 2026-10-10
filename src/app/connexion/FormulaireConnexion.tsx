"use client";
import { useActionState } from "react";
import { seConnecter } from "./actions";

export default function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState(seConnecter, null);
  return (
    <form action={action} className="form one">
      <label>Adresse e-mail<input className="inp" id="email" name="email" type="email" autoComplete="username" required autoFocus /></label>
      <label>Mot de passe<input className="inp" id="motDePasse" name="motDePasse" type="password" autoComplete="current-password" required /></label>
      {etat?.erreur && <div className="alert bad" role="alert">{etat.erreur}</div>}
      <button className="btn primary" disabled={enCours}>{enCours ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}
