"use client";
import { useState, useTransition } from "react";
import { plagesEnConflit, type PlageSaisie } from "@/lib/horaires";
import { JOURS, formatMinute, parseHeure } from "@/lib/texte";
import { actionHoraires } from "../actions";

const couleurType = (types: string[], t: string) => `var(--t${Math.min(types.indexOf(t) + 1, 6) || 6})`;
const versChamp = (m: number) => { const h = Math.floor(m / 60), mn = m % 60; return `${String(h).padStart(2, "0")}:${String(mn).padStart(2, "0")}`; };

export default function EditeurHoraires({ typesInitiaux, plagesInitiales, etapeSuivante, libelle = "Enregistrer les horaires" }: { typesInitiaux: string[]; plagesInitiales: PlageSaisie[]; etapeSuivante?: number; libelle?: string }) {
  const [types, setTypes] = useState(typesInitiaux);
  const [plages, setPlages] = useState(plagesInitiales);
  const [jour, setJour] = useState(1);
  const [nouveauType, setNouveauType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [modifie, setModifie] = useState(false);
  const [enCours, demarrer] = useTransition();

  const conflits = plagesEnConflit(plages);
  const duJour = plages.map((p, i) => ({ ...p, i })).filter((p) => p.jour === jour).sort((a, b) => a.debut - b.debut);
  const changer = (f: (p: PlageSaisie[]) => PlageSaisie[]) => { setPlages(f); setModifie(true); setMessage(null); };

  function maj(i: number, champ: "debut" | "fin" | "type", valeur: string) {
    changer((l) => l.map((p, k) => {
      if (k !== i) return p;
      if (champ === "type") return { ...p, type: valeur };
      const m = parseHeure(valeur);
      return m === null ? p : { ...p, [champ]: m };
    }));
  }
  function ajouter() {
    const fin = duJour.length ? duJour[duJour.length - 1].fin : 8 * 60;
    changer((l) => [...l, { jour, debut: fin, fin: Math.min(fin + 55, 23 * 60 + 59), type: types[0] }]);
  }
  function copierSurSemaine() {
    const modele = plages.filter((p) => p.jour === jour);
    changer((l) => [...l.filter((p) => p.jour === jour || p.jour === 3), ...[1, 2, 4, 5].filter((j) => j !== jour).flatMap((j) => modele.map((p) => ({ ...p, jour: j })))]);
    setMessage({ ok: true, texte: `Horaires du ${JOURS[jour - 1].toLowerCase()} copiés sur les autres jours, sauf le mercredi. Pensez à enregistrer.` });
  }
  function ajouterType() {
    const t = (nouveauType ?? "").trim();
    if (t && !types.includes(t)) { setTypes([...types, t]); setModifie(true); }
    setNouveauType(null);
  }
  function retirerType(t: string) {
    if (plages.some((p) => p.type === t)) { setMessage({ ok: false, texte: `Le type « ${t} » est utilisé par des plages : changez-les d'abord.` }); return; }
    setTypes(types.filter((x) => x !== t)); setModifie(true);
  }
  function enregistrer() {
    demarrer(async () => {
      const r = await actionHoraires(types, plages, etapeSuivante);
      setMessage(r.ok ? { ok: true, texte: r.message ?? "Enregistré." } : { ok: false, texte: r.erreur });
      if (r.ok) setModifie(false);
    });
  }

  const A = 7 * 60 + 45, B = 17 * 60 + 30, pct = (m: number) => ((m - A) / (B - A)) * 100;

  return (
    <>
      <div className="types">
        {types.map((t) => (
          <span key={t} className="type" style={{ "--c": couleurType(types, t) } as React.CSSProperties}>
            <i />{t}<button aria-label={`Retirer le type ${t}`} onClick={() => retirerType(t)}>×</button>
          </span>
        ))}
        {nouveauType === null
          ? <button className="btn ghost sm" onClick={() => setNouveauType("")}>+ Ajouter un type</button>
          : <input className="inp" id="nouveau-type" autoFocus placeholder="Nom du type, ex. Club" value={nouveauType}
              onChange={(e) => setNouveauType(e.target.value)} onBlur={ajouterType}
              onKeyDown={(e) => { if (e.key === "Enter") ajouterType(); if (e.key === "Escape") setNouveauType(null); }}
              style={{ padding: "4px 10px", fontSize: 13 }} />}
      </div>

      <div className="sched">
        <div>
          <div className="days">
            {JOURS.map((n, i) => (
              <button key={n} className={`${i + 1 === jour ? "on" : ""} ${plages.some((p) => p.jour === i + 1) ? "" : "off"}`} onClick={() => setJour(i + 1)}>{n.slice(0, 3)}.</button>
            ))}
          </div>
          {duJour.length ? (
            <>
              <div className="rowhead"><span /><span>Début</span><span>Fin</span><span>Type</span><span /></div>
              <div className="rows">
                {duJour.map((p) => (
                  <div key={`${p.i}`} className={`row ${conflits.has(p.i) ? "overlap" : ""}`} style={{ "--c": couleurType(types, p.type) } as React.CSSProperties}>
                    <i />
                    <input className="inp" type="time" step={300} aria-label="Début" id={`debut-${p.i}`} value={versChamp(p.debut)} onChange={(e) => maj(p.i, "debut", e.target.value)} />
                    <input className="inp" type="time" step={300} aria-label="Fin" id={`fin-${p.i}`} value={versChamp(p.fin)} onChange={(e) => maj(p.i, "fin", e.target.value)} />
                    <select className="inp" aria-label="Type de plage" id={`type-${p.i}`} value={p.type} onChange={(e) => maj(p.i, "type", e.target.value)}>
                      {types.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <button className="del" aria-label="Supprimer la plage" onClick={() => changer((l) => l.filter((_, k) => k !== p.i))}>×</button>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="alert warn">Le CDI est fermé le {JOURS[jour - 1].toLowerCase()}. Ajoutez une plage pour l&apos;ouvrir.</div>}
          <div className="tools">
            <button className="btn sm" onClick={ajouter}>+ Ajouter une plage</button>
            {duJour.length > 0 && <button className="btn sm" onClick={copierSurSemaine}>Copier le {JOURS[jour - 1].toLowerCase()} sur la semaine</button>}
            {duJour.length > 0 && <button className="btn ghost sm" onClick={() => changer((l) => l.filter((p) => p.jour !== jour))}>Fermer ce jour</button>}
          </div>
          {conflits.size > 0 && <div className="alert bad">Deux plages se chevauchent ou une plage finit avant de commencer. Corrigez les horaires en rouge.</div>}
        </div>

        <div className="week" aria-label="Aperçu de la semaine">
          <div />
          {JOURS.map((n, i) => <div key={n} className={`dh ${i + 1 === jour ? "on" : ""}`}>{n.slice(0, 3)}.</div>)}
          <div className="axis">{[8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => <span key={h} style={{ top: `${pct(h * 60)}%` }}>{h}h</span>)}</div>
          {JOURS.map((n, i) => {
            const l = plages.filter((p) => p.jour === i + 1 && p.fin > p.debut);
            return (
              <div key={n} className="col" onClick={() => setJour(i + 1)}>
                {l.length ? l.map((p, k) => (
                  <div key={k} className="blk" title={`${formatMinute(p.debut)}–${formatMinute(p.fin)} · ${p.type}`}
                    style={{ "--c": couleurType(types, p.type), top: `${pct(Math.max(p.debut, A))}%`, height: `calc(${pct(Math.min(p.fin, B)) - pct(Math.max(p.debut, A))}% - 2px)` } as React.CSSProperties}>
                    {p.fin - p.debut >= 40 ? p.type : ""}
                  </div>
                )) : <div className="closed-day">Fermé</div>}
              </div>
            );
          })}
        </div>
      </div>

      {message && <div className={`alert ${message.ok ? "ok" : "bad"}`}>{message.texte}</div>}
      <div className="actions">
        {modifie && <span className="muted small" style={{ alignSelf: "center" }}>Modifications non enregistrées</span>}
        <button className="btn primary" onClick={enregistrer} disabled={enCours || conflits.size > 0}>{enCours ? "Enregistrement…" : libelle}</button>
      </div>
    </>
  );
}
