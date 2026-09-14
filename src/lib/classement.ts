/**
 * Classement du mois de l'accueil, inspiré des « 5 films qui… » des revues de cinéma : un genre
 * par mois et ses 5 films les mieux notés sur TMDB. Aucun avis rédigé : l'ordre vient des notes
 * du public.
 */

export interface Classement {
  /** Identifiant du genre dans TMDB (/genre/movie/list). */
  genre: number;
  nom: string;
  /** Occasion du mois, affichée dans le surtitre quand elle existe. */
  raison?: string;
  /** Seuil de votes : sans lui, des films confidentiels à la note flatteuse passent devant. */
  minVotes: number;
}

/**
 * Index 0 = janvier. Classements vérifiés le 14/09/2026. Le documentaire reste à 1 000 votes :
 * à 300, des making-of et des films de fans prenaient la tête.
 */
export const CLASSEMENTS: readonly Classement[] = [
  { genre: 878, nom: "Science-fiction", minVotes: 3000 },
  { genre: 10749, nom: "Romance", raison: "Saint-Valentin", minVotes: 3000 },
  { genre: 9648, nom: "Mystère", minVotes: 3000 },
  { genre: 16, nom: "Animation", raison: "vacances de printemps", minVotes: 3000 },
  { genre: 10402, nom: "Musique", minVotes: 3000 },
  { genre: 12, nom: "Aventure", minVotes: 3000 },
  { genre: 37, nom: "Western", minVotes: 1000 },
  { genre: 35, nom: "Comédie", minVotes: 3000 },
  { genre: 18, nom: "Drame", minVotes: 3000 },
  { genre: 27, nom: "Horreur", raison: "Halloween", minVotes: 3000 },
  { genre: 99, nom: "Documentaire", raison: "mois du documentaire", minVotes: 1000 },
  { genre: 10751, nom: "Familial", raison: "fêtes de fin d'année", minVotes: 3000 },
];

export const TAILLE_CLASSEMENT = 5;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const classementDuMois = (now: Date): Classement => CLASSEMENTS[now.getMonth()];

/** « Classement de septembre », « Classement d'octobre · Halloween ». */
export function surtitreClassement(now: Date) {
  const mois = MOIS[now.getMonth()];
  const { raison } = classementDuMois(now);
  return `Classement ${/^[aeiou]/.test(mois) ? `d'${mois}` : `de ${mois}`}${raison ? ` · ${raison}` : ""}`;
}

export const titreClassement = (classement: Classement) => `${classement.nom} : les ${TAILLE_CLASSEMENT} films les mieux notés`;

/**
 * Date de sortie maximale : un an avant aujourd'hui. La note d'un film récent, portée par ses
 * premiers spectateurs, n'est pas encore stable (en septembre 2026, trois films de l'année
 * dépassaient 8,5 et prenaient la tête de leur genre).
 */
export function sortiAvant(now: Date) {
  const date = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
