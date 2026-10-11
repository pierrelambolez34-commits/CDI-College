"use client";
import { useState, useTransition } from "react";
import { actionRenvoyer } from "./actions";

type R = { ok: true; message?: string } | { ok: false; erreur: string };

export function BoutonRenvoyer({ userId }: { userId: string }) {
  const [enCours, demarrer] = useTransition();
  const [retour, setRetour] = useState<R | null>(null);
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn sm" disabled={enCours} onClick={() => demarrer(async () => setRetour(await actionRenvoyer(userId)))}>Renvoyer le lien</button>
      {retour && <span className="small" style={{ color: retour.ok ? "var(--ok)" : "var(--bad)" }}>{retour.ok ? retour.message : retour.erreur}</span>}
    </span>
  );
}
