"use client";
import { useActionState } from "react";
import { actionCreerCollege } from "./actions";

export default function FormulaireCollege({ annee }: { annee: string }) {
  const [etat, action, enCours] = useActionState(actionCreerCollege, null);
  return (
    <form action={action}>
      <div className="form">
        <label>Nom du collège<input className="inp" id="nom" name="nom" required /></label>
        <label>Code UAI <span>7 chiffres et une lettre</span><input className="inp" id="uai" name="uai" required maxLength={8} /></label>
        <label>Commune<input className="inp" id="commune" name="commune" /></label>
        <label>Année scolaire<input className="inp" id="annee" name="annee" defaultValue={annee} required /></label>
        <label>Nom de l'administrateur <span>En général le professeur documentaliste</span><input className="inp" id="adminNom" name="adminNom" required /></label>
        <label>Son adresse e-mail<input className="inp" id="adminEmail" name="adminEmail" type="email" required /></label>
        <label>Mot de passe provisoire <span>10 caractères minimum</span><input className="inp" id="adminMdp" name="adminMdp" type="text" minLength={10} required autoComplete="off" /></label>
      </div>
      {etat && (etat.ok ? <div className="alert ok">{etat.message}</div> : <div className="alert bad">{etat.erreur}</div>)}
      <div className="actions"><button className="btn primary" disabled={enCours}>Créer le collège</button></div>
    </form>
  );
}
