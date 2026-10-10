/**
 * Lecture du fichier CSV des élèves (export Pronote / SIECLE).
 *
 * Ce module s'exécute dans le navigateur : le fichier complet (avec, souvent,
 * les coordonnées des parents) ne quitte jamais l'ordinateur. Seuls le nom,
 * le prénom et la classe de chaque élève sont envoyés au serveur.
 */
import { cleEleve, niveauDeDivision, normaliser } from "./texte";

export type LigneEleve = { nom: string; prenom: string; division: string; niveau: string };
export type Correspondance = { nom: number; prenom: number; division: number };

export type FichierLu = {
  encodage: "UTF-8" | "Windows (cp1252)";
  separateur: ";" | "," | "\t";
  entetes: string[];
  lignes: string[][];
};

export type Analyse = {
  eleves: LigneEleve[];
  colonnesIgnorees: string[];
  incompletes: number;
  doublons: number;
  parClasse: Record<string, number>;
};

/** Décode le fichier : UTF-8 si possible, sinon l'encodage Windows des exports Pronote. */
export function decoder(octets: ArrayBuffer | Uint8Array): { texte: string; encodage: FichierLu["encodage"] } {
  try {
    const texte = new TextDecoder("utf-8", { fatal: true }).decode(octets);
    return { texte: texte.replace(/^﻿/, ""), encodage: "UTF-8" };
  } catch {
    return { texte: new TextDecoder("windows-1252").decode(octets), encodage: "Windows (cp1252)" };
  }
}

/** Découpe un texte CSV en lignes et en cellules (gère les guillemets). */
export function decouper(texte: string, sep: string): string[][] {
  const out: string[][] = [];
  let ligne: string[] = [], cell = "", guillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (guillemets) {
      if (c === '"') { if (texte[i + 1] === '"') { cell += '"'; i++; } else guillemets = false; }
      else cell += c;
    } else if (c === '"') guillemets = true;
    else if (c === sep) { ligne.push(cell); cell = ""; }
    else if (c === "\n") { ligne.push(cell); out.push(ligne); ligne = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || ligne.length) { ligne.push(cell); out.push(ligne); }
  return out.filter((l) => l.some((x) => x.trim()));
}

export function lireFichier(octets: ArrayBuffer | Uint8Array): FichierLu {
  const { texte, encodage } = decoder(octets);
  const premiere = texte.split(/\r?\n/)[0] ?? "";
  const separateur = ([";", ",", "\t"] as const)
    .map((s) => [s, premiere.split(s).length] as const)
    .sort((a, b) => b[1] - a[1])[0][0];
  const toutes = decouper(texte, separateur);
  return { encodage, separateur, entetes: (toutes[0] ?? []).map((x) => x.trim()), lignes: toutes.slice(1) };
}

/** Devine les colonnes Nom / Prénom / Classe en ignorant celles des responsables légaux. */
export function devinerColonnes(entetes: string[]): Correspondance {
  const c: Correspondance = { nom: -1, prenom: -1, division: -1 };
  entetes.forEach((e, i) => {
    const n = normaliser(e);
    if (/repr|resp|legal|tel|mail|adresse|parent/.test(n)) return;
    if (c.prenom < 0 && /prenom/.test(n)) c.prenom = i;
    else if (c.nom < 0 && /^nom\b|nom de famille|nom d'usage|^eleve$/.test(n)) c.nom = i;
    else if (c.division < 0 && /division|classe/.test(n)) c.division = i;
  });
  return c;
}

export function analyser(fichier: FichierLu, col: Correspondance): Analyse {
  const garde = new Set([col.nom, col.prenom, col.division]);
  const res: Analyse = {
    eleves: [], incompletes: 0, doublons: 0, parClasse: {},
    colonnesIgnorees: fichier.entetes.filter((_, i) => !garde.has(i)),
  };
  if (col.nom < 0 || col.prenom < 0 || col.division < 0) return res;
  const vus = new Set<string>();
  for (const l of fichier.lignes) {
    const nom = (l[col.nom] ?? "").trim().toUpperCase();
    const prenom = (l[col.prenom] ?? "").trim();
    const division = (l[col.division] ?? "").trim().toUpperCase();
    if (!nom || !prenom || !division) { res.incompletes++; continue; }
    const k = cleEleve(nom, prenom) + "|" + division;
    if (vus.has(k)) { res.doublons++; continue; }
    vus.add(k);
    res.eleves.push({ nom, prenom, division, niveau: niveauDeDivision(division) });
    res.parClasse[division] = (res.parClasse[division] ?? 0) + 1;
  }
  res.eleves.sort((a, b) => a.nom.localeCompare(b.nom, "fr") || a.prenom.localeCompare(b.prenom, "fr"));
  return res;
}
