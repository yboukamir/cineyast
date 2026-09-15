/**
 * Classement du mois de l'accueil, inspiré des « 5 films qui… » des revues de cinéma : un genre
 * par mois et ses 5 films les mieux notés sur TMDB. En décembre, comme les numéros de fin d'année,
 * le bilan : les 10 films les mieux notés sortis dans l'année. Aucun avis rédigé : l'ordre vient
 * des notes du public.
 */

export type Classement =
  | {
      type: "genre";
      /** Identifiant du genre dans TMDB (/genre/movie/list). */
      genre: number;
      nom: string;
      /** Occasion du mois, affichée dans le surtitre quand elle existe. */
      raison?: string;
      /** Seuil de votes : sans lui, des films confidentiels à la note flatteuse passent devant. */
      minVotes: number;
    }
  | { type: "annee"; raison: string; minVotes: number };

/**
 * Index 0 = janvier. Classements vérifiés le 14/09/2026. Le documentaire reste à 1 000 votes :
 * à 300, des making-of et des films de fans prenaient la tête. Le bilan de décembre a été vérifié
 * sur 2025 le 15/09/2026 : 37 premières sorties sur 40 résultats, une fois les ressorties écartées.
 */
export const CLASSEMENTS: readonly Classement[] = [
  { type: "genre", genre: 878, nom: "Science-fiction", minVotes: 3000 },
  { type: "genre", genre: 10749, nom: "Romance", raison: "Saint-Valentin", minVotes: 3000 },
  { type: "genre", genre: 9648, nom: "Mystère", minVotes: 3000 },
  { type: "genre", genre: 16, nom: "Animation", raison: "vacances de printemps", minVotes: 3000 },
  { type: "genre", genre: 10402, nom: "Musique", minVotes: 3000 },
  { type: "genre", genre: 12, nom: "Aventure", minVotes: 3000 },
  { type: "genre", genre: 37, nom: "Western", minVotes: 1000 },
  { type: "genre", genre: 35, nom: "Comédie", minVotes: 3000 },
  { type: "genre", genre: 18, nom: "Drame", minVotes: 3000 },
  { type: "genre", genre: 27, nom: "Horreur", raison: "Halloween", minVotes: 3000 },
  { type: "genre", genre: 99, nom: "Documentaire", raison: "mois du documentaire", minVotes: 1000 },
  { type: "annee", raison: "bilan de l'année", minVotes: 1000 },
];

export const tailleClassement = (classement: Classement) => (classement.type === "annee" ? 10 : 5);

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export const nomDuMois = (now: Date) => MOIS[now.getMonth()];

export const classementDuMois = (now: Date): Classement => CLASSEMENTS[now.getMonth()];

/** « Classement de septembre », « Classement d'octobre · Halloween ». */
export function surtitreClassement(now: Date) {
  const mois = nomDuMois(now);
  const { raison } = classementDuMois(now);
  return `Classement ${/^[aeiou]/.test(mois) ? `d'${mois}` : `de ${mois}`}${raison ? ` · ${raison}` : ""}`;
}

export function titreClassement(classement: Classement, now: Date) {
  const taille = tailleClassement(classement);
  return classement.type === "annee"
    ? `Le meilleur de ${now.getFullYear()} : les ${taille} films les mieux notés`
    : `${classement.nom} : les ${taille} films les mieux notés`;
}

/** « Tout voir » : Explorer avec le même filtre, trié par note. */
export const lienClassement = (classement: Classement, now: Date) =>
  classement.type === "annee" ? `/explorer?annee=${now.getFullYear()}&tri=note` : `/explorer?genres=${classement.genre}&tri=note`;

/**
 * Date de sortie maximale des classements par genre : un an avant aujourd'hui. La note d'un film
 * récent, portée par ses premiers spectateurs, n'est pas encore stable (en septembre 2026, trois
 * films de l'année dépassaient 8,5 et prenaient la tête de leur genre).
 */
export function sortiAvant(now: Date) {
  const date = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Bornes de l'année civile en cours, pour le bilan de décembre. */
export const anneeEnCours = (now: Date) => ({ from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` });
