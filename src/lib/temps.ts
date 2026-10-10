/** Heure locale française, quel que soit le fuseau du serveur. */

const FUSEAU = "Europe/Paris";

export type Instant = { jour: string; minute: number; jourSemaine: number };

/** Date (AAAA-MM-JJ), minute depuis minuit et jour de la semaine (1 = lundi … 7 = dimanche) à Paris. */
export function instantParis(date = new Date()): Instant {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("fr-FR", {
      timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  const jours: Record<string, number> = { "lun.": 1, "mar.": 2, "mer.": 3, "jeu.": 4, "ven.": 5, "sam.": 6, "dim.": 7 };
  return {
    jour: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
    jourSemaine: jours[parts.weekday] ?? 0,
  };
}

export type PlageSimple = { id: string; jour: number; debut: number; fin: number; type: string };

/** La plage ouverte à ce moment-là, ou null si le CDI est fermé. */
export function plageEnCours<T extends PlageSimple>(plages: T[], jourSemaine: number, minute: number): T | null {
  return plages.find((p) => p.jour === jourSemaine && minute >= p.debut && minute < p.fin) ?? null;
}
