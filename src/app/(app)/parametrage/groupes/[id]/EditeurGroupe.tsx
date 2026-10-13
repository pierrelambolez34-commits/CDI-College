"use client";
/** Édition d'un groupe : nom, description et membres (recherche par nom ou ajout d'une classe entière). */
import { useMemo, useState, useTransition } from "react";
import { TeteCarte } from "@/components/EnTete";
import Icone from "@/components/Icone";
import { normaliser } from "@/lib/texte";
import { actionModifierGroupe, actionSupprimerGroupe } from "../../actions";

type Eleve = { id: string; nom: string; prenom: string; division: string };

export default function EditeurGroupe({ groupe, eleves }: { groupe: { id: string; nom: string; description: string; eleveIds: string[] }; eleves: Eleve[] }) {
  const [nom, setNom] = useState(groupe.nom);
  const [description, setDescription] = useState(groupe.description);
  const [membres, setMembres] = useState<string[]>(groupe.eleveIds);
  const [recherche, setRecherche] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [modifie, setModifie] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const [enCours, demarrer] = useTransition();

  const parId = useMemo(() => new Map(eleves.map((e) => [e.id, e])), [eleves]);
  const divisions = useMemo(() => [...new Set(eleves.map((e) => e.division))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })), [eleves]);
  const ensemble = new Set(membres);
  const changer = (ids: string[]) => { setMembres(ids); setModifie(true); setMessage(null); };

  const resultats = useMemo(() => {
    const q = normaliser(recherche);
    if (!q) return [];
    const mots = q.split(" ");
    return eleves.filter((e) => !ensemble.has(e.id) && mots.every((m) => normaliser(e.nom).startsWith(m) || normaliser(e.prenom).startsWith(m) || e.division.toLowerCase() === m)).slice(0, 8);
  }, [recherche, eleves, membres]); // eslint-disable-line react-hooks/exhaustive-deps

  const liste = membres.map((id) => parId.get(id)).filter((e): e is Eleve => !!e)
    .sort((a, b) => a.division.localeCompare(b.division, "fr", { numeric: true }) || a.nom.localeCompare(b.nom, "fr"));

  function ajouterClasse(div: string) {
    if (!div) return;
    changer([...membres, ...eleves.filter((e) => e.division === div && !ensemble.has(e.id)).map((e) => e.id)]);
  }
  function enregistrer() {
    demarrer(async () => {
      const r = await actionModifierGroupe(groupe.id, { nom, description, eleveIds: membres });
      setMessage(r.ok ? { ok: true, texte: r.message ?? "Enregistré." } : { ok: false, texte: r.erreur });
      if (r.ok) setModifie(false);
    });
  }

  return (
    <>
      <TeteCarte icone="equipe" couleur="var(--mint)" titre={nom || "Groupe sans nom"} sous={`${membres.length} élève${membres.length > 1 ? "s" : ""}`} />
      <div className="form">
        <label>Nom du groupe<input className="inp" id="nom" value={nom} maxLength={60} onChange={(e) => { setNom(e.target.value); setModifie(true); }} /></label>
        <label>Description <span>Facultatif</span><input className="inp" id="description" value={description} maxLength={300} onChange={(e) => { setDescription(e.target.value); setModifie(true); }} /></label>
      </div>

      <div className="sec">
        <h3>Ajouter des élèves</h3>
        <div className="ajout-membres">
          <div className="recherche-membre">
            <input className="inp" id="recherche-membre" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Nom, prénom ou classe…" autoComplete="off"
              onKeyDown={(e) => { if (e.key === "Enter" && resultats[0]) { e.preventDefault(); changer([...membres, resultats[0].id]); setRecherche(""); } }} />
            {recherche.trim() && (
              <ul className="results">
                {resultats.length === 0 && <li className="empty">Aucun élève trouvé (ou déjà dans le groupe).</li>}
                {resultats.map((e) => (
                  <li key={e.id} onMouseDown={(ev) => { ev.preventDefault(); changer([...membres, e.id]); setRecherche(""); }}>
                    <span className="div">{e.division}</span><span><span className="nm">{e.nom}</span> {e.prenom}</span><span className="tag">Ajouter</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select className="inp" id="ajout-classe" value="" onChange={(e) => ajouterClasse(e.target.value)} aria-label="Ajouter toute une classe">
            <option value="">+ Toute une classe…</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="sec">
        <h3>Membres ({liste.length})</h3>
        {liste.length ? (
          <ul className="membres">
            {liste.map((e) => (
              <li key={e.id}>
                <span className="div">{e.division}</span><span className="qui"><b>{e.nom}</b> {e.prenom}</span>
                <button type="button" aria-label={`Retirer ${e.prenom} ${e.nom}`} onClick={() => changer(membres.filter((x) => x !== e.id))}><Icone nom="x" taille={16} /></button>
              </li>
            ))}
          </ul>
        ) : <div className="vide-encart">Ce groupe est vide. Ajoutez des élèves par leur nom ou une classe entière.</div>}
        {liste.length > 0 && <div className="tools"><button type="button" className="btn ghost sm" onClick={() => changer([])}>Vider le groupe</button></div>}
      </div>

      {message && <div className={`alert ${message.ok ? "ok" : "bad"}`}>{message.texte}</div>}
      <div className="actions" style={{ justifyContent: "space-between" }}>
        {confirmer
          ? <span style={{ display: "inline-flex", gap: 8 }}><button className="btn danger" disabled={enCours} onClick={() => demarrer(async () => { const r = await actionSupprimerGroupe(groupe.id); if (r && !r.ok) setMessage({ ok: false, texte: r.erreur }); })}>Supprimer « {groupe.nom} »</button><button className="btn ghost" onClick={() => setConfirmer(false)}>Garder</button></span>
          : <button className="btn ghost danger" onClick={() => setConfirmer(true)}>Supprimer le groupe</button>}
        <span style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
          {modifie && <span className="muted small">Modifications non enregistrées</span>}
          <button className="btn primary" disabled={enCours || !nom.trim()} onClick={enregistrer}>{enCours ? "Enregistrement…" : "Enregistrer le groupe"}</button>
        </span>
      </div>
    </>
  );
}
