"use client";
/**
 * Import du fichier CSV. Le fichier est lu ici, dans le navigateur :
 * seuls le nom, le prénom et la classe sont envoyés au serveur.
 */
import { useRef, useState, useTransition } from "react";
import { analyser, devinerColonnes, lireFichier, type Correspondance, type FichierLu } from "@/lib/csv";
import { actionImport } from "../actions";

export default function ImportEleves({ dejaDesEleves }: { dejaDesEleves: boolean }) {
  const [fichier, setFichier] = useState<(FichierLu & { nomFichier: string }) | null>(null);
  const [col, setCol] = useState<Correspondance>({ nom: -1, prenom: -1, division: -1 });
  const [archiver, setArchiver] = useState(true);
  const [survol, setSurvol] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [bilan, setBilan] = useState<{ ajoutes: number; misAJour: number; archives: number; total: number } | null>(null);
  const [enCours, demarrer] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function charger(f: File) {
    setErreur(null); setBilan(null);
    if (f.size > 5_000_000) { setErreur("Ce fichier dépasse 5 Mo : vérifiez qu'il s'agit bien de l'export des élèves."); return; }
    const lu = lireFichier(await f.arrayBuffer());
    if (lu.lignes.length < 1) { setErreur("Ce fichier ne contient pas de lignes d'élèves. Vérifiez qu'il s'agit bien d'un export CSV."); return; }
    setFichier({ ...lu, nomFichier: f.name });
    setCol(devinerColonnes(lu.entetes));
  }

  if (bilan) return (
    <>
      <div className="alert ok">Import terminé : {bilan.total} élèves sont prêts pour la saisie.</div>
      <div className="sec"><div className="stats-row">
        <div><b>{bilan.ajoutes}</b><span>ajoutés</span></div>
        <div><b>{bilan.misAJour}</b><span>mis à jour (classe ou orthographe)</span></div>
        <div><b>{bilan.archives}</b><span>archivés (absents du fichier)</span></div>
      </div></div>
      <div className="actions"><button className="btn" onClick={() => { setBilan(null); setFichier(null); }}>Importer un autre fichier</button><a className="btn primary" href="/saisie">Ouvrir la saisie</a></div>
    </>
  );

  if (!fichier) return (
    <>
      <div className={`drop ${survol ? "over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)}
        onDrop={(e) => { e.preventDefault(); setSurvol(false); const f = e.dataTransfer.files[0]; if (f) charger(f); }}>
        <b>Glissez le fichier CSV ici</b><span className="muted small">ou</span>
        <button className="btn primary" onClick={() => input.current?.click()}>Choisir un fichier</button>
        <span className="muted small">Séparateur point-virgule ou virgule, encodage Windows ou UTF-8. Le fichier est lu sur votre ordinateur.</span>
        <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) charger(f); e.target.value = ""; }} />
      </div>
      {erreur && <div className="alert bad">{erreur}</div>}
    </>
  );

  const a = analyser(fichier, col);
  const complet = col.nom >= 0 && col.prenom >= 0 && col.division >= 0;
  const choix = (k: keyof Correspondance, label: string) => (
    <label>{label}
      <select className="inp" id={`col-${k}`} value={col[k]} onChange={(e) => setCol({ ...col, [k]: Number(e.target.value) })}>
        <option value={-1}>— Choisir —</option>
        {fichier.entetes.map((h, i) => <option key={i} value={i}>{h}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}><b style={{ color: "var(--ink)" }}>{fichier.nomFichier}</b> · {fichier.lignes.length} lignes · encodage {fichier.encodage} · séparateur « {fichier.separateur === "\t" ? "tabulation" : fichier.separateur} »</p>
      <div className="sec" style={{ marginTop: 0 }}>
        <h3>Colonnes reconnues</h3>
        <div className="cols3">{choix("nom", "Nom")}{choix("prenom", "Prénom")}{choix("division", "Classe")}</div>
        {a.colonnesIgnorees.length > 0 && <>
          <span className="muted small">Colonnes ignorées, jamais envoyées ni enregistrées :</span>
          <div className="ignored">{a.colonnesIgnorees.map((c, i) => <span key={i}>{c}</span>)}</div>
        </>}
      </div>
      {complet ? <>
        <div className="sec"><h3>Résultat</h3>
          <div className="stats-row">
            <div><b>{a.eleves.length}</b><span>élèves</span></div>
            <div><b>{Object.keys(a.parClasse).length}</b><span>classes</span></div>
            <div><b>{a.doublons}</b><span>doublons</span></div>
            <div><b>{a.incompletes}</b><span>lignes incomplètes</span></div>
          </div>
          <div className="divs">{Object.entries(a.parClasse).sort(([x], [y]) => x.localeCompare(y, "fr", { numeric: true })).map(([d, n]) => <span key={d}>{d} <small>{n}</small></span>)}</div>
          {a.incompletes > 0 && <div className="alert warn">{a.incompletes} ligne(s) sans nom, prénom ou classe seront ignorées.</div>}
          {a.doublons > 0 && <div className="alert warn">{a.doublons} élève(s) en double ne seront importés qu&apos;une fois.</div>}
        </div>
        <div className="sec"><h3>Aperçu</h3>
          <div className="tbl"><table>
            <thead><tr><th>Nom</th><th>Prénom</th><th>Classe</th><th>Niveau</th></tr></thead>
            <tbody>{a.eleves.slice(0, 8).map((e, i) => <tr key={i}><td>{e.nom}</td><td>{e.prenom}</td><td>{e.division}</td><td>{e.niveau}</td></tr>)}</tbody>
          </table></div>
          <span className="muted small">8 premiers élèves sur {a.eleves.length}</span>
        </div>
        {dejaDesEleves && (
          <label className="check sec">
            <input type="checkbox" id="archiver" checked={archiver} onChange={(e) => setArchiver(e.target.checked)} />
            <span>Archiver les élèves absents de ce fichier (élèves partis). Leurs passages restent dans les statistiques.</span>
          </label>
        )}
      </> : <div className="alert bad">Indiquez quelle colonne contient le nom, le prénom et la classe.</div>}
      {erreur && <div className="alert bad">{erreur}</div>}
      <div className="actions">
        <button className="btn" onClick={() => setFichier(null)}>Changer de fichier</button>
        <button className="btn primary" disabled={!complet || !a.eleves.length || enCours} onClick={() => demarrer(async () => {
          const r = await actionImport(a.eleves.map(({ nom, prenom, division }) => ({ nom, prenom, division })), archiver);
          if (r.ok && r.donnees) setBilan(r.donnees); else if (!r.ok) setErreur(r.erreur);
        })}>{enCours ? "Import…" : `Importer ${complet ? a.eleves.length + " élèves" : ""}`}</button>
      </div>
    </>
  );
}
