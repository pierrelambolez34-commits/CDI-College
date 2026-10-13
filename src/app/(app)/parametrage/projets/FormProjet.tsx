"use client";
/** Création ou modification d'un projet : dates, description, partenaires, classes et groupes participants. */
import { useState, useTransition } from "react";
import { actionEnregistrerProjet, actionSupprimerProjet } from "../actions";

type Valeurs = { nom: string; description: string; partenaires: string; debut: string; fin: string | null; classes: string[]; groupeIds: string[] };

export default function FormProjet({ projetId, initial, divisions, groupes }: {
  projetId: string | null; initial: Valeurs; divisions: string[]; groupes: { id: string; nom: string }[];
}) {
  const [v, setV] = useState<Valeurs>(initial);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, demarrer] = useTransition();
  const maj = (p: Partial<Valeurs>) => { setV((x) => ({ ...x, ...p })); setMessage(null); };
  const basculer = (liste: string[], x: string) => (liste.includes(x) ? liste.filter((y) => y !== x) : [...liste, x]);

  return (
    <form onSubmit={(e) => { e.preventDefault(); demarrer(async () => {
      const r = await actionEnregistrerProjet(projetId, { ...v, fin: v.fin || null });
      if (r) setMessage(r.ok ? { ok: true, texte: r.message ?? "Enregistré." } : { ok: false, texte: r.erreur });
    }); }}>
      <div className="form">
        <label style={{ gridColumn: "1 / -1" }}>Nom du projet<input className="inp" id="projet-nom" required maxLength={80} value={v.nom} onChange={(e) => maj({ nom: e.target.value })} placeholder="Prix des Incorruptibles" /></label>
        <label>Début<input className="inp" id="projet-debut" type="date" required value={v.debut} onChange={(e) => maj({ debut: e.target.value })} /></label>
        <label>Fin <span>Facultatif</span><input className="inp" id="projet-fin" type="date" value={v.fin ?? ""} min={v.debut} onChange={(e) => maj({ fin: e.target.value || null })} /></label>
        <label style={{ gridColumn: "1 / -1" }}>Description <span>Objectifs, déroulé, production attendue…</span>
          <textarea className="inp" id="projet-description" rows={4} maxLength={2000} value={v.description} onChange={(e) => maj({ description: e.target.value })} />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>Enseignants et partenaires <span>Facultatif</span><input className="inp" id="projet-partenaires" maxLength={300} value={v.partenaires} onChange={(e) => maj({ partenaires: e.target.value })} placeholder="Mme Durand (français), médiathèque de Lunel" /></label>
      </div>

      <div className="sec">
        <h3>Classes participantes</h3>
        {divisions.length ? (
          <div className="puces" role="group" aria-label="Classes participantes">
            {divisions.map((d) => <button type="button" key={d} className="puce" aria-pressed={v.classes.includes(d)} onClick={() => maj({ classes: basculer(v.classes, d) })}>{d}</button>)}
          </div>
        ) : <p className="muted small" style={{ margin: 0 }}>Importez les élèves pour choisir des classes.</p>}
      </div>
      <div className="sec">
        <h3>Groupes participants</h3>
        {groupes.length ? (
          <div className="puces" role="group" aria-label="Groupes participants">
            {groupes.map((g) => <button type="button" key={g.id} className="puce" aria-pressed={v.groupeIds.includes(g.id)} onClick={() => maj({ groupeIds: basculer(v.groupeIds, g.id) })}>{g.nom}</button>)}
          </div>
        ) : <p className="muted small" style={{ margin: 0 }}>Aucun groupe. Vous pouvez en créer dans « Groupes d&apos;élèves ».</p>}
        <p className="muted small" style={{ margin: "4px 0 0" }}>Les participants servent de référence pour le bilan (« part des participants venus »). Tout élève peut quand même être rattaché au projet pendant la saisie.</p>
      </div>

      {message && <div className={`alert ${message.ok ? "ok" : "bad"}`}>{message.texte}</div>}
      <div className="actions" style={{ justifyContent: projetId ? "space-between" : "flex-end" }}>
        {projetId && (confirmer
          ? <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="btn danger" disabled={enCours} onClick={() => demarrer(async () => { const r = await actionSupprimerProjet(projetId); if (r && !r.ok) setMessage({ ok: false, texte: r.erreur }); })}>Supprimer le projet</button><button type="button" className="btn ghost" onClick={() => setConfirmer(false)}>Garder</button><span className="muted small" style={{ alignSelf: "center" }}>Les passages restent dans les statistiques générales.</span></span>
          : <button type="button" className="btn ghost danger" onClick={() => setConfirmer(true)}>Supprimer le projet</button>)}
        <button className="btn primary" disabled={enCours || !v.nom.trim() || !v.debut}>{enCours ? "Enregistrement…" : projetId ? "Enregistrer les modifications" : "Créer le projet"}</button>
      </div>
    </form>
  );
}
