import type { PersonDetail } from "@/lib/tmdb";

/**
 * « Cinéaste belge du mois » de l'accueil, inspiré des portraits de cinéastes belges des revues.
 * Le choix des noms est éditorial ; tout le reste (portrait, biographie, films) vient de TMDB.
 */

export interface Cineaste {
  /** Identifiants TMDB : deux pour les duos qui réalisent ensemble. */
  ids: number[];
  nom: string;
}

/**
 * Un cinéaste par mois (index 0 = janvier). Vérifiés dans TMDB le 15/09/2026 : lieu de naissance
 * en Belgique, photo, au moins deux films réalisés à 30 votes ou plus. Agnès Varda, née à Ixelles
 * mais cinéaste française, n'y figure pas : le titre de la rubrique serait faux.
 */
export const CINEASTES_BELGES: readonly Cineaste[] = [
  { ids: [130030], nom: "Chantal Akerman" },
  { ids: [56209, 45138], nom: "Jean-Pierre et Luc Dardenne" },
  { ids: [107490], nom: "Jaco Van Dormael" },
  { ids: [1274468], nom: "Lukas Dhont" },
  { ids: [71485], nom: "Joachim Lafosse" },
  { ids: [72611], nom: "Fabrice Du Welz" },
  { ids: [1399841, 1399842], nom: "Adil El Arbi et Bilall Fallah" },
  { ids: [239672], nom: "Felix van Groeningen" },
  { ids: [47822], nom: "Bouli Lanners" },
  { ids: [236859], nom: "Michaël R. Roskam" },
  { ids: [81964], nom: "Stijn Coninx" },
  { ids: [39271], nom: "André Delvaux" },
];

export const cineasteDuMois = (now: Date): Cineaste => CINEASTES_BELGES[now.getMonth()];

/** « Née en 1950 », « Né en 1991 » ; rien si la date manque. Genre TMDB : 1 = femme. */
export function naissance(person: Pick<PersonDetail, "birthday" | "gender">) {
  const annee = person.birthday?.slice(0, 4);
  if (!annee) return "";
  return `${person.gender === 1 ? "Née" : "Né"} en ${annee}`;
}
