/** Paramétrage proposé à la création d'un collège ; tout est modifiable ensuite. */

export const TYPES_PLAGE_DEFAUT = ["Cours", "Récréation", "Pause méridienne", "Étude"];

export const MOTIFS_DEFAUT = [
  "Lecture plaisir",
  "Recherche documentaire",
  "Devoirs, révisions",
  "Emprunt ou retour",
  "Travail de groupe",
  "Envoyé par un professeur",
  "Jeux, club",
  "Ordinateur, impression",
];

const JOURNEE: [string, string, string][] = [
  ["8:00", "8:55", "Cours"], ["8:55", "9:50", "Cours"], ["9:50", "10:05", "Récréation"],
  ["10:05", "11:00", "Cours"], ["11:00", "11:55", "Cours"], ["11:55", "13:25", "Pause méridienne"],
  ["13:25", "14:20", "Cours"], ["14:20", "15:15", "Cours"], ["15:15", "15:30", "Récréation"],
  ["15:30", "16:25", "Cours"], ["16:25", "17:00", "Étude"],
];
const enMinutes = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

/** Semaine type : journée complète, sauf le mercredi qui s'arrête à midi. */
export function plagesDefaut() {
  const out: { jour: number; debut: number; fin: number; type: string }[] = [];
  for (let jour = 1; jour <= 5; jour++) {
    const liste = jour === 3 ? JOURNEE.slice(0, 5) : JOURNEE;
    for (const [d, f, type] of liste) out.push({ jour, debut: enMinutes(d), fin: enMinutes(f), type });
  }
  return out;
}

export const MAX_MOTIFS = 8;
