import type { MovieImage } from "@/lib/tmdb";

/**
 * Galerie « Les affiches » de la fiche film : quelles affiches montrer, et dans quel ordre.
 * TMDB en recense souvent des dizaines par film (61 pour Fight Club, 184 pour Le Retour du roi),
 * surtout anglaises : on garde les versions françaises et celles sans texte.
 */

/** Au-delà, la rangée devient un catalogue : les 12 premières suffisent à montrer la variété. */
export const MAX_AFFICHES = 12;

/** Françaises d'abord, puis sans texte ; dans chaque groupe, les mieux notées par la communauté TMDB. */
export function choisirAffiches(posters: readonly MovieImage[], affichePrincipale: string | null): MovieImage[] {
  const vues = new Set<string>();
  return posters
    .filter((p) => (p.iso_639_1 === "fr" || p.iso_639_1 === null) && p.file_path !== affichePrincipale)
    .filter((p) => !vues.has(p.file_path) && Boolean(vues.add(p.file_path)))
    .sort((a, b) => groupe(a) - groupe(b) || b.vote_average - a.vote_average || b.vote_count - a.vote_count)
    .slice(0, MAX_AFFICHES);
}

const groupe = (p: MovieImage) => (p.iso_639_1 === "fr" ? 0 : 1);

export const libelleAffiche = (p: MovieImage) => (p.iso_639_1 === "fr" ? "Version française" : "Sans texte");
