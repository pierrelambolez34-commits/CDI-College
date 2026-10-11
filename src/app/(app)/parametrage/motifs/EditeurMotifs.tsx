"use client";
import { useState, useTransition } from "react";
import { MAX_MOTIFS } from "@/lib/defauts";
import { actionMotifs } from "../actions";

type M = { id?: string; libelle: string; cle: string };

export default function EditeurMotifs({ initiaux, etapeSuivante, libelle = "Enregistrer les motifs" }: { initiaux: { id: string; libelle: string }[]; etapeSuivante?: number; libelle?: string }) {
  const [liste, setListe] = useState<M[]>(initiaux.map((m) => ({ ...m, cle: m.id })));
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, demarrer] = useTransition();
  const vide = liste.some((m) => !m.libelle.trim());

  const deplacer = (i: number, d: number) => setListe((l) => { const n = [...l]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  return (
    <>
      <div className="mlist">
        {liste.map((m, i) => (
          <div className="mrow" key={m.cle}>
            <kbd>{i + 1}</kbd>
            <input className="inp" id={`motif-${m.cle}`} value={m.libelle} aria-label={`Motif ${i + 1}`} maxLength={40}
              onChange={(e) => { setMessage(null); setListe((l) => l.map((x, k) => (k === i ? { ...x, libelle: e.target.value } : x))); }} />
            <span className="ops">
              <button disabled={i === 0} aria-label="Monter" onClick={() => deplacer(i, -1)}>↑</button>
              <button disabled={i === liste.length - 1} aria-label="Descendre" onClick={() => deplacer(i, 1)}>↓</button>
              <button aria-label="Retirer" onClick={() => setListe((l) => l.filter((_, k) => k !== i))}>×</button>
            </span>
          </div>
        ))}
      </div>
      <div className="tools">
        <button className="btn sm" disabled={liste.length >= MAX_MOTIFS} onClick={() => setListe((l) => [...l, { libelle: "", cle: `n${Date.now()}` }])}>+ Ajouter un motif</button>
        <span className="muted small">{liste.length}/{MAX_MOTIFS} motifs</span>
      </div>
      {vide && <div className="alert bad">Un motif est vide. Donnez-lui un nom ou retirez-le.</div>}
      {message && <div className={`alert ${message.ok ? "ok" : "bad"}`}>{message.texte}</div>}
      <div className="actions">
        <button className="btn primary" disabled={enCours || vide || !liste.length} onClick={() => demarrer(async () => {
          const r = await actionMotifs(liste.map(({ id, libelle }) => ({ id, libelle })), etapeSuivante);
          setMessage(r.ok ? { ok: true, texte: r.message ?? "Enregistré." } : { ok: false, texte: r.erreur });
          if (r.ok && r.donnees) setListe(r.donnees.map((m) => ({ id: m.id, libelle: m.libelle, cle: m.id })));
        })}>{enCours ? "Enregistrement…" : libelle}</button>
      </div>
    </>
  );
}
