import type { Genre } from "@/lib/tmdb";

/**
 * Numéro de « salle » d'un genre : sa position dans la liste des genres TMDB (01 Action… 19 Western).
 * Le même calcul sert à l'accueil et aux fiches, pour qu'un genre garde son numéro partout.
 */
export function numeroDeSalle(genres: Genre[] | undefined, genreId: number): string | undefined {
  const position = genres?.findIndex((g) => g.id === genreId) ?? -1;
  return position < 0 ? undefined : String(position + 1).padStart(2, "0");
}
