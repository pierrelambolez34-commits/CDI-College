"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ACADEMIES } from "@/lib/academies";
import { envoyerDemande } from "./actions";

export default function FormulaireDemande() {
  const [etat, action, enCours] = useActionState(envoyerDemande, null);

  if (etat?.ok) return (
    <>
      <div><h1>Vérifiez votre messagerie</h1><p className="intro">L&apos;espace de votre collège est créé.</p></div>
      <div className="encart">
        <p>Un e-mail d&apos;activation vient d&apos;être envoyé{etat.email ? <> à <b>{etat.email}</b></> : null}. Cliquez sur le lien qu&apos;il contient pour choisir votre mot de passe.</p>
        <p>Vous serez ensuite guidé en 4 étapes : votre établissement, les horaires du CDI, les motifs de venue et l&apos;import des élèves.</p>
        <p className="muted small">Rien reçu après quelques minutes ? Vérifiez vos courriers indésirables, ou refaites l&apos;inscription avec la même adresse pour recevoir un nouveau lien.</p>
      </div>
      {etat.lienTest && (
        <div className="alert warn" style={{ marginTop: 0 }}>
          Mode test : aucun e-mail n&apos;est réellement envoyé sur cet ordinateur.{" "}
          <a href={etat.lienTest}>Ouvrir le lien d&apos;activation</a>
        </div>
      )}
      <Link href="/connexion" className="retour">← Retour à la connexion</Link>
    </>
  );

  return (
    <>
      <div>
        <Link href="/connexion" className="retour">← Retour à la connexion</Link>
        <h1 style={{ marginTop: 10 }}>Création d&apos;un collège</h1>
        <p className="intro">Créez l&apos;espace CDI de votre collège. Vous en serez l&apos;administrateur : un e-mail vous permettra d&apos;activer votre compte.</p>
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
          <label style={{ gridColumn: "1 / -1" }}>E-mail du professeur documentaliste <span>Vous recevrez le lien d&apos;activation à cette adresse</span>
            <input className="inp" id="email" name="email" type="email" required autoComplete="email" />
          </label>
          <label className="cache" aria-hidden="true">Site web<input id="site" name="site" tabIndex={-1} autoComplete="off" /></label>
        </div>
        {etat && !etat.ok && <div className="alert bad" role="alert">{etat.erreur}</div>}
        <div className="actions" style={{ borderTop: 0, paddingTop: 0 }}>
          <button className="btn primary" style={{ width: "100%" }} disabled={enCours}>{enCours ? "Envoi…" : "Envoyer la demande"}</button>
        </div>
      </form>
    </>
  );
}
