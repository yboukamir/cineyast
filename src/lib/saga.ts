import type { Collection, MovieSummary } from "@/lib/tmdb";

/**
 * Rangée « La saga » de la fiche film, inspirée des dossiers qui suivent une même histoire à
 * travers plusieurs films. TMDB ne relie pas les remakes, mais il regroupe les suites en
 * « collections » (Le Seigneur des anneaux, Le Parrain, Matrix…).
 */

/** « Le Seigneur des anneaux - Saga » → « Le Seigneur des anneaux » : TMDB ajoute ce suffixe en français. */
export const nomDeSaga = (name: string) =>
  name
    .replace(/\s*[-–—:]\s*(saga|collection)$/i, "")
    .replace(/\s*\((saga|collection)\)$/i, "")
    .trim();

/** Films dans l'ordre de sortie ; ceux qui n'ont pas encore de date (annoncés) à la fin. */
export function filmsDeLaSaga(collection: Pick<Collection, "parts">): MovieSummary[] {
  return collection.parts
    .filter((film) => !film.adult)
    .sort((a, b) => (a.release_date || "9999").localeCompare(b.release_date || "9999") || a.id - b.id);
}
