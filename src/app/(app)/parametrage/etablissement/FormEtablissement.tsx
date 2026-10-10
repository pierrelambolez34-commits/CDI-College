"use client";
import { useActionState } from "react";
import { ACADEMIES } from "@/lib/academies";
import { actionEtablissement } from "../actions";

type V = { nom: string; uai: string; commune: string; codePostal: string; academie: string; annee: string };

export default function FormEtablissement({ valeurs }: { valeurs: V }) {
  const [etat, action, enCours] = useActionState(actionEtablissement, null);
  return (
    <form action={action}>
      <div className="form">
        <label>Nom du collège<input className="inp" id="nom" name="nom" defaultValue={valeurs.nom} required /></label>
        <label>Code UAI <span>Facultatif : 7 chiffres et une lettre</span><input className="inp" id="uai" name="uai" defaultValue={valeurs.uai} maxLength={8} /></label>
        <label>Ville<input className="inp" id="commune" name="commune" defaultValue={valeurs.commune} /></label>
        <label>Code postal<input className="inp" id="codePostal" name="codePostal" defaultValue={valeurs.codePostal} inputMode="numeric" maxLength={5} /></label>
        <label>Académie
          <select className="inp" id="academie" name="academie" defaultValue={valeurs.academie}>
            <option value="">— Choisir —</option>
            {ACADEMIES.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label>Année scolaire <span>Format 2026-2027</span><input className="inp" id="annee" name="annee" defaultValue={valeurs.annee} required /></label>
      </div>
      {etat && (etat.ok ? <div className="alert ok">{etat.message}</div> : <div className="alert bad">{etat.erreur}</div>)}
      <div className="actions"><button className="btn primary" disabled={enCours}>Enregistrer</button></div>
    </form>
  );
}
