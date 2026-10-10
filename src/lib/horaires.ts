/** Vérification des horaires, partagée entre l'écran de paramétrage et le serveur. */

export type PlageSaisie = { jour: number; debut: number; fin: number; type: string };

/** Renvoie les messages d'erreur (liste vide = horaires valides). */
export function verifierHoraires(plages: PlageSaisie[], types: string[]): string[] {
  const erreurs: string[] = [];
  const jours = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi"];
  for (const p of plages) {
    if (p.jour < 1 || p.jour > 5) erreurs.push("Jour invalide.");
    if (!(p.fin > p.debut)) erreurs.push(`Le ${jours[p.jour]}, une plage finit avant de commencer.`);
    if (!types.includes(p.type)) erreurs.push(`Le type « ${p.type} » n'existe pas.`);
  }
  for (let j = 1; j <= 5; j++) {
    const l = plages.filter((p) => p.jour === j).sort((a, b) => a.debut - b.debut);
    for (let i = 1; i < l.length; i++) {
      if (l[i].debut < l[i - 1].fin) { erreurs.push(`Le ${jours[j]}, deux plages se chevauchent.`); break; }
    }
  }
  return [...new Set(erreurs)];
}

/** Indices des plages en conflit, pour les afficher en rouge. */
export function plagesEnConflit(plages: PlageSaisie[]): Set<number> {
  const out = new Set<number>();
  const idx = plages.map((p, i) => ({ ...p, i }));
  for (let j = 1; j <= 5; j++) {
    const l = idx.filter((p) => p.jour === j).sort((a, b) => a.debut - b.debut);
    l.forEach((p, k) => {
      if (!(p.fin > p.debut)) out.add(p.i);
      if (k > 0 && p.debut < l[k - 1].fin) { out.add(p.i); out.add(l[k - 1].i); }
    });
  }
  return out;
}
