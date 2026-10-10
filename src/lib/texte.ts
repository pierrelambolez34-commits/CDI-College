/** Petites fonctions de texte partagées entre le serveur et le navigateur. */

/** « Élodie » → « elodie » : sans accents, en minuscules, espaces simplifiés. */
export function normaliser(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Clé qui identifie un élève d'un import à l'autre. */
export function cleEleve(nom: string, prenom: string): string {
  return `${normaliser(nom)}|${normaliser(prenom)}`;
}

/** « 5C » → « 5e », « 6EME2 » → « 6e ». Renvoie « Autre » si la classe ne commence pas par 3 à 6. */
export function niveauDeDivision(division: string): string {
  const m = division.trim().match(/^([3-6])/);
  return m ? `${m[1]}e` : "Autre";
}

/** 545 → « 9:05 » */
export function formatMinute(m: number): string {
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** « 09:05 » ou « 9:05 » → 545 ; renvoie null si le format est invalide. */
export function parseHeure(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})[:h](\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), mn = Number(m[2]);
  if (h > 23 || mn > 59) return null;
  return h * 60 + mn;
}

export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"] as const;
