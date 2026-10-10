"use client";
import { useActionState, useState } from "react";
import { choisirMotDePasse } from "./actions";

export default function FormulaireMotDePasse({ jeton, email }: { jeton: string; email: string }) {
  const [etat, action, enCours] = useActionState(choisirMotDePasse.bind(null, jeton), null);
  const [mdp, setMdp] = useState("");
  const [conf, setConf] = useState("");
  const tropCourt = mdp.length > 0 && mdp.length < 10;
  const different = conf.length > 0 && conf !== mdp;
  return (
    <form action={action} className="form one">
      <input type="email" name="identifiant" autoComplete="username" value={email} readOnly hidden />
      <label>Identifiant<input className="inp" id="identifiant-visible" value={email} readOnly disabled /></label>
      <label>Mot de passe <span>10 caractères minimum</span>
        <input className="inp" id="motDePasse" name="motDePasse" type="password" autoComplete="new-password" required minLength={10} autoFocus value={mdp} onChange={(e) => setMdp(e.target.value)} />
      </label>
      {tropCourt && <span className="small" style={{ color: "var(--warn)", marginTop: -8 }}>Encore {10 - mdp.length} caractère{10 - mdp.length > 1 ? "s" : ""}.</span>}
      <label>Confirmer le mot de passe
        <input className="inp" id="confirmation" name="confirmation" type="password" autoComplete="new-password" required value={conf} onChange={(e) => setConf(e.target.value)} />
      </label>
      {different && <span className="small" style={{ color: "var(--bad)", marginTop: -8 }}>Les deux mots de passe ne sont pas identiques.</span>}
      {etat && !etat.ok && <div className="alert bad" role="alert" style={{ marginTop: 0 }}>{etat.erreur}</div>}
      <button className="btn primary" disabled={enCours || mdp.length < 10 || mdp !== conf}>{enCours ? "Enregistrement…" : "Activer mon compte"}</button>
    </form>
  );
}
