"use client";
import { useActionState } from "react";
import { actionCreerGroupe } from "../actions";

export default function NouveauGroupe() {
  const [etat, action, enCours] = useActionState(actionCreerGroupe, null);
  return (
    <form action={action}>
      <div className="form">
        <label>Nom du groupe<input className="inp" id="groupe-nom" name="nom" required maxLength={60} placeholder="Club manga" /></label>
        <label>Description <span>Facultatif : jour, enseignant…</span><input className="inp" id="groupe-description" name="description" maxLength={300} placeholder="Le jeudi midi" /></label>
      </div>
      {etat && !etat.ok && <div className="alert bad">{etat.erreur}</div>}
      <div className="actions"><button className="btn primary" disabled={enCours}>Créer et choisir les élèves</button></div>
    </form>
  );
}
