"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ACADEMIES } from "@/lib/academies";
import { envoyerDemande } from "./actions";

export default function FormulaireDemande() {
  const [etat, action, enCours] = useActionState(envoyerDemande, null);

  if (etat?.ok) return (
    <>
      <div><h1>Demande envoyée</h1><p className="intro">Merci. Votre demande a bien été transmise.</p></div>
      <div className="encart">
        <p><b>Et maintenant ?</b></p>
        <p>Dès que l&apos;espace de votre collège sera ouvert, vous recevrez un e-mail{etat.message ? <> à <b>{etat.message}</b></> : null} avec un lien pour choisir votre mot de passe.</p>
        <p className="muted small">Pensez à vérifier vos courriers indésirables.</p>
      </div>
      <Link href="/connexion" className="retour">← Retour à la connexion</Link>
    </>
  );

  return (
    <>
      <div>
        <Link href="/connexion" className="retour">← Retour à la connexion</Link>
        <h1 style={{ marginTop: 10 }}>Création d&apos;un collège</h1>
        <p className="intro">Demandez l&apos;ouverture de l&apos;espace CDI de votre collège. Le compte administrateur sera celui du professeur documentaliste.</p>
      </div>
      <form action={action}>
        <div className="form">
          <label style={{ gridColumn: "1 / -1" }}>Nom du collège<input className="inp" id="nom" name="nom" required placeholder="Collège Jean-Moulin" /></label>
          <label>Ville<input className="inp" id="ville" name="ville" required /></label>
          <label>Code postal<input className="inp" id="codePostal" name="codePostal" required inputMode="numeric" pattern="\d{5}" maxLength={5} title="5 chiffres" /></label>
          <label>Académie
            <select className="inp" id="academie" name="academie" required defaultValue="">
              <option value="" disabled>— Choisir —</option>
              {ACADEMIES.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label>Code UAI <span>Facultatif, ex. 0341234A</span><input className="inp" id="uai" name="uai" maxLength={8} /></label>
          <label style={{ gridColumn: "1 / -1" }}>E-mail du professeur documentaliste <span>Il recevra le lien pour choisir son mot de passe</span>
            <input className="inp" id="email" name="email" type="email" required autoComplete="email" />
          </label>
          <label className="cache" aria-hidden="true">Site web<input id="site" name="site" tabIndex={-1} autoComplete="off" /></label>
        </div>
        {etat && !etat.ok && <div className="alert bad" role="alert">{etat.erreur}</div>}
        <div className="actions" style={{ borderTop: 0, paddingTop: 0 }}>
          <button className="btn primary" style={{ width: "100%" }} disabled={enCours}>{enCours ? "Envoi…" : "Envoyer"}</button>
        </div>
      </form>
    </>
  );
}
