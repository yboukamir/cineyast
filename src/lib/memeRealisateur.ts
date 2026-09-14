import type { PersonCrewCredit, PersonDetail } from "@/lib/tmdb";

/**
 * Rangée « Du même réalisateur » de la fiche film, inspirée des dossiers que les revues de cinéma
 * consacrent à un cinéaste à l'occasion d'une sortie.
 */

/**
 * Sous 30 votes, les « réalisations » sont surtout des courts métrages, des captations et des bonus :
 * Apichatpong Weerasethakul en compte 103 sur 112, et le réalisateur de Vaiana des making-of de Hamilton.
 */
export const MIN_VOTES_REALISATION = 30;
export const MAX_FILMS_REALISATION = 20;
/** Genre « Téléfilm » de TMDB. */
const TELEFILM = 10770;

/** Autres films réalisés, sans le film de la fiche, les plus connus d'abord (nombre de votes TMDB). */
export function autresFilms(persons: readonly Pick<PersonDetail, "movie_credits">[], movieId: number): PersonCrewCredit[] {
  const films = new Map<number, PersonCrewCredit>();
  for (const person of persons) {
    for (const credit of person.movie_credits?.crew ?? []) {
      if (credit.job !== "Director" || credit.id === movieId || credit.adult) continue;
      if (!credit.release_date || credit.vote_count < MIN_VOTES_REALISATION || credit.genre_ids?.includes(TELEFILM)) continue;
      films.set(credit.id, credit);
    }
  }
  return [...films.values()].sort((a, b) => b.vote_count - a.vote_count).slice(0, MAX_FILMS_REALISATION);
}

/** Genre TMDB : 1 = femme. Inconnu ou mixte : masculin, selon l'usage du français. */
export function titreMemeRealisation(directors: readonly { gender?: number }[]) {
  const femmes = directors.length > 0 && directors.every((d) => d.gender === 1);
  if (directors.length > 1) return femmes ? "Des mêmes réalisatrices" : "Des mêmes réalisateurs";
  return femmes ? "De la même réalisatrice" : "Du même réalisateur";
}

/** « A », « A et B », « A, B et C ». */
export const nomsRealisation = (names: readonly string[]) =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} et ${names.at(-1)}`;
