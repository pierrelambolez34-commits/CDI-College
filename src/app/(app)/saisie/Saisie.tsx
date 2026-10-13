"use client";
/**
 * Écran de saisie, pensé pour le clavier :
 *   taper quelques lettres → Entrée → touche du motif (1 à 8).
 * Le type de plage est déduit de l'heure ; F2 permet de le corriger.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { normaliser, formatMinute } from "@/lib/texte";
import { instantParis, plageEnCours, type PlageSimple } from "@/lib/temps";
import { actionAnnuler, actionEnregistrer } from "./actions";
import EnTete, { TeteCarte } from "@/components/EnTete";
import Icone from "@/components/Icone";

type Eleve = { id: string; nom: string; prenom: string; division: string };
type Motif = { id: string; libelle: string; ordre: number };
type Passage = { id: string; eleveId: string; motifId: string; typePlage: string; minute: number; projetId?: string | null };
/** Un résultat de recherche : une classe entière, un groupe d'élèves, ou un élève. */
type Resultat = { groupe: string; ids: string[]; sorte: "classe" | "groupe" } | { eleve: Eleve };
type Groupe = { id: string; nom: string; eleveIds: string[] };
type Projet = { id: string; nom: string };

type Props = {
  eleves: Eleve[]; motifs: Motif[]; plages: PlageSimple[]; types: string[];
  passagesInitiaux: Passage[]; habitudes: Record<string, string>; jour: string; instantInitial: ReturnType<typeof instantParis>;
  groupes: Groupe[]; projets: Projet[];
};

const HORS = "Hors horaires";
const couleur = (ordre: number) => `var(--s${Math.min(Math.max(ordre, 1), 8)})`;

export default function Saisie({ eleves, motifs, plages, types, passagesInitiaux, habitudes: habInit, jour, instantInitial, groupes, projets }: Props) {
  // Projet choisi : il reste actif d'un élève à l'autre (une séance de projet), jusqu'à ce qu'on le change.
  const [projetId, setProjetId] = useState<string | null>(null);
  const projet = projets.find((p) => p.id === projetId) ?? null;
  const [instant, setInstant] = useState(instantInitial);
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState<string[]>([]);
  const [surligne, setSurligne] = useState(0);
  const [typeForce, setTypeForce] = useState<string | null>(null);
  const [passages, setPassages] = useState<Passage[]>(passagesInitiaux);
  const [habitudes, setHabitudes] = useState(habInit);
  const [toast, setToast] = useState<{ texte: string; annulable: boolean; erreur?: boolean } | null>(null);
  const derniers = useRef<{ ids: Promise<string[]>; eleveIds: string[]; habitudes: Record<string, string> }[]>([]);
  const champ = useRef<HTMLInputElement>(null);
  const minuteurToast = useRef<ReturnType<typeof setTimeout>>(undefined);

  // L'horloge avance toutes les 20 secondes ; le type forcé est oublié quand la plage change.
  useEffect(() => {
    const t = setInterval(() => setInstant(instantParis()), 20_000);
    return () => clearInterval(t);
  }, []);
  const plage = plageEnCours(plages, instant.jourSemaine, instant.minute);
  useEffect(() => setTypeForce(null), [plage?.id]);
  const typeActuel = typeForce ?? plage?.type ?? HORS;

  const parId = useMemo(() => new Map(eleves.map((e) => [e.id, e])), [eleves]);
  const motifParId = useMemo(() => new Map(motifs.map((m) => [m.id, m])), [motifs]);
  const index = useMemo(() => eleves.map((e) => ({ e, nom: normaliser(e.nom), prenom: normaliser(e.prenom), div: e.division.toLowerCase() })), [eleves]);
  const divisions = useMemo(() => [...new Set(eleves.map((e) => e.division))].sort((a, b) => a.localeCompare(b, "fr", { numeric: true })), [eleves]);

  // Passages de la plage en cours (ou de la dernière heure si le CDI est « fermé »)
  const presents = useMemo(() => {
    const debut = plage ? plage.debut : instant.minute - 60;
    const fin = plage ? plage.fin : instant.minute + 1;
    return passages.filter((p) => p.minute >= debut && p.minute < fin);
  }, [passages, plage, instant.minute]);
  const idsPresents = useMemo(() => new Set(presents.map((p) => p.eleveId)), [presents]);

  // Recherche : chaque mot tapé doit être le début du nom, du prénom ou la classe.
  const resultats: Resultat[] = useMemo(() => {
    const q = normaliser(recherche);
    if (!q) return [];
    const mots = q.split(" ");
    const out: Resultat[] = [];
    const div = divisions.find((d) => d.toLowerCase() === q.replace(/\s/g, ""));
    if (div) {
      const ids = eleves.filter((e) => e.division === div && !selection.includes(e.id)).map((e) => e.id);
      if (ids.length) out.push({ groupe: div, ids, sorte: "classe" });
    }
    // Groupes d'élèves dont le nom contient ce qui est tapé
    for (const g of groupes) {
      if (!normaliser(g.nom).includes(q)) continue;
      const ids = g.eleveIds.filter((id) => !selection.includes(id) && parId.has(id));
      if (ids.length) out.push({ groupe: g.nom, ids, sorte: "groupe" });
      if (out.length >= 3) break;
    }
    for (const x of index) {
      if (selection.includes(x.e.id)) continue;
      const ok = mots.every((m) => x.nom.startsWith(m) || x.prenom.startsWith(m) || x.div === m || x.nom.split(/[ '-]/).some((w) => w.startsWith(m)));
      if (ok) out.push({ eleve: x.e });
      if (out.length >= (div ? 6 : 7)) break;
    }
    return out;
  }, [recherche, index, divisions, eleves, selection, groupes, parId]);
  useEffect(() => setSurligne(0), [recherche]);

  const motifSuggere = useMemo(() => {
    if (!selection.length) return null;
    const compte = new Map<string, number>();
    for (const id of selection) { const m = habitudes[id]; if (m && motifParId.has(m)) compte.set(m, (compte.get(m) ?? 0) + 1); }
    let meilleur: string | null = null, n = 0;
    for (const [m, c] of compte) if (c > n) { meilleur = m; n = c; }
    return meilleur;
  }, [selection, habitudes, motifParId]);

  function afficher(texte: string, annulable: boolean, erreur = false) {
    setToast({ texte, annulable, erreur });
    clearTimeout(minuteurToast.current);
    minuteurToast.current = setTimeout(() => setToast(null), erreur ? 7000 : 5000);
  }

  function choisir(i: number) {
    const r = resultats[i];
    if (!r) return;
    setSelection((s) => "groupe" in r ? [...s, ...r.ids.filter((id) => !s.includes(id))] : [...s, r.eleve.id]);
    setRecherche("");
    champ.current?.focus();
  }

  function enregistrer(motifId: string) {
    const eleveIds = selection;
    if (!eleveIds.length) return;
    const motif = motifParId.get(motifId)!;
    const tempIds = eleveIds.map((_, i) => `tmp-${Date.now()}-${i}`);
    const avant = Object.fromEntries(eleveIds.map((id) => [id, habitudes[id]]));
    // Affichage immédiat, sans attendre le serveur
    setPassages((p) => [...eleveIds.map((eleveId, i) => ({ id: tempIds[i], eleveId, motifId, typePlage: typeActuel, minute: instant.minute, projetId })), ...p]);
    setHabitudes((h) => ({ ...h, ...Object.fromEntries(eleveIds.map((id) => [id, motifId])) }));
    setSelection([]);
    setRecherche("");
    const e0 = parId.get(eleveIds[0]);
    const qui = eleveIds.length === 1 && e0 ? `${e0.prenom} ${e0.nom}` : `${eleveIds.length} élèves`;
    afficher(`${qui} · ${motif.libelle}${projet ? ` · ${projet.nom}` : ""} · enregistré`, true);

    const promesse = actionEnregistrer({ eleveIds, motifId, typePlage: typeActuel, projetId }).then((r) => {
      if (!r.ok || !r.donnees) {
        setPassages((p) => p.filter((x) => !tempIds.includes(x.id)));
        setHabitudes((h) => ({ ...h, ...avant }));
        setSelection(eleveIds);
        afficher(r.ok ? "Enregistrement impossible." : r.erreur, false, true);
        return [];
      }
      const { ids, minute } = r.donnees;
      setPassages((p) => p.map((x) => { const k = tempIds.indexOf(x.id); return k >= 0 ? { ...x, id: ids[k], minute } : x; }));
      return ids;
    }).catch(() => {
      setPassages((p) => p.filter((x) => !tempIds.includes(x.id)));
      setSelection(eleveIds);
      afficher("Connexion perdue : la saisie n'a pas été enregistrée. Les élèves sont toujours sélectionnés, réessayez.", false, true);
      return [] as string[];
    });
    derniers.current.push({ ids: promesse, eleveIds, habitudes: avant });
    champ.current?.focus();
  }

  async function annuler() {
    const d = derniers.current.pop();
    if (!d) return;
    const ids = await d.ids;
    if (!ids.length) return;
    setPassages((p) => p.filter((x) => !ids.includes(x.id)));
    setHabitudes((h) => {
      const n = { ...h };
      for (const [k, v] of Object.entries(d.habitudes)) { if (v) n[k] = v; else delete n[k]; }
      return n;
    });
    setSelection(d.eleveIds);
    const r = await actionAnnuler(ids);
    afficher(r.ok ? "Saisie annulée. Les élèves sont de nouveau sélectionnés." : r.erreur, false, !r.ok);
    champ.current?.focus();
  }

  function changerProjet() {
    if (!projets.length) return;
    const liste = [null, ...projets.map((p) => p.id)];
    setProjetId(liste[(liste.indexOf(projetId) + 1) % liste.length]);
    champ.current?.focus();
  }

  function changerType() {
    const liste = plage ? types : [HORS, ...types];
    const i = liste.indexOf(typeActuel);
    const suivant = liste[(i + 1) % liste.length];
    setTypeForce(suivant === (plage?.type ?? HORS) ? null : suivant);
    champ.current?.focus();
  }

  function clavier(ev: React.KeyboardEvent<HTMLInputElement>) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") { ev.preventDefault(); annuler(); return; }
    if (ev.key === "ArrowDown" && resultats.length) { ev.preventDefault(); setSurligne((s) => (s + 1) % resultats.length); return; }
    if (ev.key === "ArrowUp" && resultats.length) { ev.preventDefault(); setSurligne((s) => (s - 1 + resultats.length) % resultats.length); return; }
    if (ev.key === "Enter") {
      ev.preventDefault();
      if (resultats.length) choisir(surligne);
      else if (!recherche && motifSuggere) enregistrer(motifSuggere);
      return;
    }
    if (ev.key === "Escape") { setRecherche(""); setSelection([]); return; }
    if (ev.key === "Backspace" && !recherche && selection.length) { setSelection((s) => s.slice(0, -1)); return; }
    if (!recherche && selection.length && /^[1-8]$/.test(ev.key)) {
      const m = motifs.find((x) => x.ordre === Number(ev.key));
      if (m) { ev.preventDefault(); enregistrer(m.id); }
    }
  }

  useEffect(() => {
    const f = (ev: KeyboardEvent) => {
      if (ev.key === "F2") { ev.preventDefault(); changerType(); }
      else if (ev.key === "F3") { ev.preventDefault(); changerProjet(); }
      else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z" && document.activeElement !== champ.current) { ev.preventDefault(); annuler(); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });

  // Frise de la journée
  const plagesDuJour = plages.filter((p) => p.jour === instant.jourSemaine);
  const compteParMotif = motifs.map((m) => ({ m, n: passages.filter((p) => p.motifId === m.id).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
  const maxMotif = Math.max(1, ...compteParMotif.map((x) => x.n));
  const nomJour = new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const ligne = (p: Passage) => {
    const e = parId.get(p.eleveId); const m = motifParId.get(p.motifId);
    return (
      <li key={p.id}>
        <span className="h">{formatMinute(p.minute)}</span>
        <span className="who">{e ? `${e.prenom} ${e.nom}` : "Élève archivé"} <small>{e?.division}</small></span>
        {m && <span className="pill" style={{ "--c": couleur(m.ordre) } as React.CSSProperties} title={p.projetId ? `Projet : ${projets.find((x) => x.id === p.projetId)?.nom ?? ""}` : undefined}>{p.projetId ? "★ " : ""}{m.libelle}</span>}
      </li>
    );
  };

  return (
    <main className="wrap">
      <EnTete sur="Aujourd'hui au CDI" icone="clavier" titre="Saisie des passages" intro="Quelques lettres du nom, Entrée, puis le chiffre du motif.">
        <div className="clock"><span className="muted" style={{ textTransform: "capitalize" }}>{nomJour}</span><span className="t">{formatMinute(instant.minute)}</span></div>
      </EnTete>

      {plagesDuJour.length > 0 && (
        <div className="strip" aria-label="Plages horaires du jour">
          {plagesDuJour.map((p) => (
            <div key={p.id} className={`slot ${p.type === "Récréation" ? "recre" : p.type === "Pause méridienne" ? "midi" : ""} ${plage?.id === p.id ? "now" : ""}`} style={{ "--w": p.fin - p.debut } as React.CSSProperties}>
              <b>{p.type === "Pause méridienne" ? "Midi" : p.type === "Récréation" ? "Récré" : p.type}</b>{formatMinute(p.debut)}
            </div>
          ))}
        </div>
      )}

      <div className="saisie-grid">
        <section className="panel">
          <div className="ctx">
            <button className={`plage ${!plage && !typeForce ? "closed" : ""}`} onClick={changerType} title="Changer le type de plage (F2)">
              {typeActuel} <span className="auto">{plage ? `${formatMinute(plage.debut)}–${formatMinute(plage.fin)}` : "CDI normalement fermé"}{typeForce ? " · modifié" : ""}</span>
            </button>
            <span className="hint">Déduit de l&apos;heure · <kbd>F2</kbd> pour corriger</span>
            {projets.length > 0 && (
              <button type="button" className={`projet-choix ${projet ? "actif" : ""}`} onClick={changerProjet} title="Rattacher les passages à un projet (F3)">
                <Icone nom="etincelles" taille={15} />{projet ? `Projet : ${projet.nom}` : "Aucun projet"} <kbd>F3</kbd>
              </button>
            )}
          </div>

          <label htmlFor="recherche" className="muted small">Élève(s) qui entre(nt)</label>
          <div className="field" onClick={() => champ.current?.focus()}>
            {selection.map((id) => { const e = parId.get(id)!; return (
              <span className="chip" key={id}>{e.prenom} {e.nom} <small>{e.division}</small>
                <button type="button" aria-label={`Retirer ${e.prenom} ${e.nom}`} onClick={(ev) => { ev.stopPropagation(); setSelection((s) => s.filter((x) => x !== id)); champ.current?.focus(); }}>×</button>
              </span>); })}
            <input id="recherche" ref={champ} value={recherche} onChange={(e) => setRecherche(e.target.value)} onKeyDown={clavier}
              autoComplete="off" spellCheck={false} autoFocus aria-autocomplete="list" aria-controls="resultats"
              placeholder={selection.length ? "Ajouter un autre élève, ou tapez le motif (1–8)" : groupes.length ? "Nom, prénom, classe ou groupe…" : "Nom, prénom ou classe (ex. « mar », « 5C »)…"} />
          </div>
          {recherche.trim() && (
            <ul className="results" id="resultats" role="listbox">
              {resultats.length === 0 && <li className="empty">Aucun élève trouvé. Vérifiez l&apos;orthographe ou tapez la classe.</li>}
              {resultats.map((r, i) => "groupe" in r ? (
                <li key={`${r.sorte}${r.groupe}`} className={`group ${r.sorte === "groupe" ? "groupe-res" : ""} ${i === surligne ? "hi" : ""}`} role="option" aria-selected={i === surligne} onMouseDown={(e) => { e.preventDefault(); choisir(i); }}>
                  {r.sorte === "classe"
                    ? <><span className="div">{r.groupe}</span><span className="nm">Toute la {r.groupe}</span></>
                    : <><span className="div"><Icone nom="equipe" taille={15} /></span><span className="nm">Groupe « {r.groupe} »</span></>}
                  <span className="tag">{r.ids.length} élève{r.ids.length > 1 ? "s" : ""}</span>
                </li>
              ) : (
                <li key={r.eleve.id} className={i === surligne ? "hi" : ""} role="option" aria-selected={i === surligne} onMouseDown={(e) => { e.preventDefault(); choisir(i); }}>
                  <span className="div">{r.eleve.division}</span><span><span className="nm">{r.eleve.nom}</span> {r.eleve.prenom}</span>
                  {idsPresents.has(r.eleve.id) ? <span className="tag here">déjà au CDI</span>
                    : <span className="tag">{motifParId.get(habitudes[r.eleve.id])?.libelle ?? ""}</span>}
                </li>
              ))}
            </ul>
          )}

          <div className="step">
            <h2>Motif de venue</h2>
            <span className="hint">
              {!selection.length ? "Choisissez d'abord un élève" : <>
                {selection.length} élève{selection.length > 1 ? "s" : ""} · touche <kbd>1</kbd>…<kbd>{motifs.length}</kbd>
                {motifSuggere && <> ou <kbd>Entrée</kbd> pour « {motifParId.get(motifSuggere)?.libelle} »</>}
              </>}
            </span>
          </div>
          <div className="motifs">
            {motifs.map((m) => (
              <button key={m.id} className={`motif ${motifSuggere === m.id ? "last" : ""}`} disabled={!selection.length}
                style={{ "--c": couleur(m.ordre) } as React.CSSProperties} onClick={() => enregistrer(m.id)}>
                <span className="k">{m.ordre}</span><span className="l">{m.libelle}</span>
              </button>
            ))}
          </div>

          <div className="keys">
            <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
            <span><kbd>Entrée</kbd> choisir l&apos;élève</span>
            <span><kbd>1</kbd>…<kbd>8</kbd> motif = enregistré</span>
            <span><kbd>Entrée</kbd> à vide = motif habituel</span>
            <span><kbd>⌫</kbd> retirer le dernier élève</span>
            <span><kbd>Échap</kbd> tout effacer</span>
            <span><kbd>Ctrl</kbd>+<kbd>Z</kbd> annuler</span>
            {projets.length > 0 && <span><kbd>F3</kbd> projet en cours</span>}
          </div>
        </section>

        <aside className="side">
          <section className="panel">
            <TeteCarte icone="equipe" titre={plage ? "Au CDI sur cette plage" : "Dernière heure"} sous={plage ? `${formatMinute(plage.debut)}–${formatMinute(plage.fin)}` : undefined}><span className="count">{presents.length}</span></TeteCarte>
            <ul className="list">{presents.length ? presents.map(ligne) : <li className="empty">Personne pour l&apos;instant.</li>}</ul>
          </section>
          <section className="panel">
            <TeteCarte icone="graphique" couleur="var(--sun)" titre="Motifs aujourd'hui" sous={`${passages.length} passage${passages.length > 1 ? "s" : ""}`} />
            <div className="hbars" style={{ marginTop: 10 }}>
              {compteParMotif.length ? compteParMotif.map(({ m, n }) => (
                <div className="hb" key={m.id} style={{ gridTemplateColumns: "minmax(0,1fr) 34px" }}>
                  <span className="tr" style={{ height: 22, background: "var(--sunk)", borderRadius: 5, overflow: "hidden" }}>
                    <span className="f" style={{ "--c": couleur(m.ordre), width: `${(n / maxMotif) * 100}%`, opacity: .85 } as React.CSSProperties} />
                    <span style={{ position: "relative", paddingLeft: 8, lineHeight: "22px", fontSize: 13, whiteSpace: "nowrap" }}>{m.libelle}</span>
                  </span>
                  <span className="v"><b>{n}</b></span>
                </div>
              )) : <p className="muted small">Aucun passage aujourd&apos;hui.</p>}
            </div>
          </section>
          <section className="panel">
            <TeteCarte icone="horloge" couleur="var(--mint)" titre="Journal du jour" sous="Les 15 derniers passages" />
            <ul className="list">{passages.length ? passages.slice(0, 15).map(ligne) : <li className="empty">Aucun passage aujourd&apos;hui.</li>}</ul>
          </section>
        </aside>
      </div>

      {toast && (
        <div className={`toast ${toast.erreur ? "err" : ""}`} role="status">
          <span>{toast.texte}</span>
          {toast.annulable && <button onClick={annuler}>Annuler <kbd style={{ background: "transparent", color: "inherit", borderColor: "currentColor" }}>Ctrl Z</kbd></button>}
        </div>
      )}
    </main>
  );
}
