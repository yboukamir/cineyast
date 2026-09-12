const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const decimal = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("fr-FR");

export const releaseYear = (date?: string) => (date && date.length >= 4 ? date.slice(0, 4) : "");

export function releaseDateLong(date?: string) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? "" : longDate.format(parsed);
}

/** 139 → "2 h 19" */
export function runtime(minutes: number | null) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

/** 7.834 → "7,8" */
export const score = (vote: number) => decimal.format(vote);

export const count = (n: number) => integer.format(n);
