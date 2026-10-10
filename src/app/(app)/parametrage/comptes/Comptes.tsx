"use client";
import { useActionState, useState, useTransition } from "react";
import { actionAjouterCompte, actionSupprimerCompte } from "../actions";

export function FormCompte() {
  const [etat, action, enCours] = useActionState(actionAjouterCompte, null);
  return (
    <form action={action}>
      <div className="form">
        <label>Nom<input className="inp" id="compte-nom" name="nom" required /></label>
        <label>Adresse e-mail<input className="inp" id="compte-email" name="email" type="email" required /></label>
        <label>Mot de passe provisoire <span>10 caractères minimum</span><input className="inp" id="compte-mdp" name="mdp" minLength={10} required autoComplete="off" /></label>
        <label>Rôle<select className="inp" id="compte-role" name="role" defaultValue="utilisateur"><option value="utilisateur">Utilisateur</option><option value="admin">Administrateur</option></select></label>
      </div>
      {etat && (etat.ok ? <div className="alert ok">{etat.message}</div> : <div className="alert bad">{etat.erreur}</div>)}
      <div className="actions"><button className="btn primary" disabled={enCours}>Créer le compte</button></div>
    </form>
  );
}

/** Suppression en deux clics, sans fenêtre de confirmation. */
export function BoutonSupprimer({ id, nom }: { id: string; nom: string }) {
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, demarrer] = useTransition();
  if (!confirmer) return <button className="btn ghost sm" onClick={() => setConfirmer(true)}>Supprimer</button>;
  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <button className="btn sm danger" disabled={enCours} onClick={() => demarrer(async () => { await actionSupprimerCompte(id); })}>Supprimer {nom}</button>
      <button className="btn ghost sm" onClick={() => setConfirmer(false)}>Garder</button>
    </span>
  );
}
