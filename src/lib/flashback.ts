/**
 * Rangée « Flashback » de l'accueil : les films sortis en salle en France la même
 * semaine, 25 ans plus tôt. Fonctions pures ; la requête vit dans lib/tmdb.ts.
 */

export const FLASHBACK_YEARS = 25;
/** En dessous, la semaine est trop maigre pour remplir une rangée : on élargit au mois. */
export const MIN_FLASHBACK_MOVIES = 6;

export interface ReleaseWindow {
  kind: "week" | "month";
  /** Bornes incluses, au format AAAA-MM-JJ. */
  from: string;
  to: string;
  year: number;
  /** 0 = janvier. */
  month: number;
}

const DAY = 86_400_000;
const iso = (date: Date) => date.toISOString().slice(0, 10);

/** Même jour du calendrier, `years` ans plus tôt (en UTC) ; un 29 février devient le 28. */
function sameDayYearsAgo(today: Date, years: number) {
  const year = today.getFullYear() - years;
  const month = today.getMonth();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(today.getDate(), lastDay)));
}

/** Semaine de sortie française (les films sortent le mercredi) qui contient ce jour-là. */
export function flashbackWeek(today: Date, years = FLASHBACK_YEARS): ReleaseWindow {
  const day = sameDayYearsAgo(today, years);
  const sinceWednesday = (day.getUTCDay() + 4) % 7;
  const start = new Date(day.getTime() - sinceWednesday * DAY);
  const end = new Date(start.getTime() + 6 * DAY);
  return { kind: "week", from: iso(start), to: iso(end), year: day.getUTCFullYear(), month: day.getUTCMonth() };
}

export function flashbackMonth(today: Date, years = FLASHBACK_YEARS): ReleaseWindow {
  const day = sameDayYearsAgo(today, years);
  const year = day.getUTCFullYear();
  const month = day.getUTCMonth();
  return {
    kind: "month",
    from: iso(new Date(Date.UTC(year, month, 1))),
    to: iso(new Date(Date.UTC(year, month + 1, 0))),
    year,
    month,
  };
}

/**
 * Premières sorties seulement. Une reprise en salle répond aussi au filtre de TMDB,
 * mais elle revient avec sa date de sortie d'origine (1938 pour Hôtel du Nord,
 * ressorti en août 2001) : tout ce qui tombe hors de la période est écarté.
 */
export const firstReleasesIn = <T extends { release_date?: string }>(movies: T[], period: ReleaseWindow) =>
  movies.filter((movie) => Boolean(movie.release_date) && movie.release_date! >= period.from && movie.release_date! <= period.to);

export function flashbackTitle(period: ReleaseWindow) {
  if (period.kind === "week") return `Cette semaine, en ${period.year}`;
  const month = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(period.year, period.month, 1)),
  );
  return `En ${month} ${period.year}`;
}
