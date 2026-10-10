"use client";
import { useState, useTransition } from "react";
import { actionAccepter, actionRefuser, actionRenvoyer } from "./actions";

type R = { ok: true; message?: string } | { ok: false; erreur: string };

function useAction() {
  const [enCours, demarrer] = useTransition();
  const [retour, setRetour] = useState<R | null>(null);
  const lancer = (f: () => Promise<R>) => demarrer(async () => setRetour(await f()));
  const message = retour && <span className={`small`} style={{ color: retour.ok ? "var(--ok)" : "var(--bad)" }}>{retour.ok ? retour.message : retour.erreur}</span>;
  return { enCours, lancer, message };
}

/** Confirmer ou refuser une demande (le refus demande un second clic). */
export function DecisionDemande({ id, nom }: { id: string; nom: string }) {
  const { enCours, lancer, message } = useAction();
  const [refus, setRefus] = useState(false);
  return (
    <div className="boutons">
      {refus ? <>
        <button className="btn danger" disabled={enCours} onClick={() => lancer(() => actionRefuser(id))}>Refuser {nom}</button>
        <button className="btn ghost" onClick={() => setRefus(false)}>Annuler</button>
      </> : <>
        <button className="btn ghost" disabled={enCours} onClick={() => setRefus(true)}>Refuser</button>
        <button className="btn primary" disabled={enCours} onClick={() => lancer(() => actionAccepter(id))}>{enCours ? "Création…" : "Confirmer la création"}</button>
      </>}
      {message}
    </div>
  );
}

export function BoutonRenvoyer({ userId }: { userId: string }) {
  const { enCours, lancer, message } = useAction();
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn sm" disabled={enCours} onClick={() => lancer(() => actionRenvoyer(userId))}>Renvoyer l&apos;invitation</button>
      {message}
    </span>
  );
}
