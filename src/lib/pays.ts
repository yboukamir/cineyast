/**
 * Pays des offres de streaming. Les offres JustWatch (fournies par TMDB) changent d'un pays à
 * l'autre : la fiche film les montre pour le pays du visiteur, détecté puis modifiable.
 * Les listes de sorties en salle, elles, restent françaises (REGION dans src/lib/tmdb.ts).
 *
 * Liste retenue le 14/09/2026 : pays francophones où TMDB référence des offres (sur 40 films
 * populaires : Canada 26, Suisse 23, Belgique 19, Luxembourg 17, France 16, Afrique 9 à 10,
 * Monaco 8). Haïti et La Réunion sont absents des données TMDB.
 */

export interface Pays {
  /** Code ISO 3166-1, celui des résultats watch/providers de TMDB. */
  code: string;
  nom: string;
  /** Complément de lieu : « Où regarder en Belgique », « au Canada », « à Monaco ». */
  dans: string;
}

export const PAYS: readonly Pays[] = [
  { code: "BE", nom: "Belgique", dans: "en Belgique" },
  { code: "FR", nom: "France", dans: "en France" },
  { code: "CH", nom: "Suisse", dans: "en Suisse" },
  { code: "CA", nom: "Canada", dans: "au Canada" },
  { code: "LU", nom: "Luxembourg", dans: "au Luxembourg" },
  { code: "MC", nom: "Monaco", dans: "à Monaco" },
  { code: "MA", nom: "Maroc", dans: "au Maroc" },
  { code: "DZ", nom: "Algérie", dans: "en Algérie" },
  { code: "TN", nom: "Tunisie", dans: "en Tunisie" },
  { code: "SN", nom: "Sénégal", dans: "au Sénégal" },
  { code: "CI", nom: "Côte d'Ivoire", dans: "en Côte d'Ivoire" },
  { code: "CM", nom: "Cameroun", dans: "au Cameroun" },
  { code: "MG", nom: "Madagascar", dans: "à Madagascar" },
  { code: "MU", nom: "Maurice", dans: "à Maurice" },
];

/** Pays inconnu ou hors liste : la France, premier marché francophone. */
export const PAYS_PAR_DEFAUT = "FR";

export const paysConnu = (code: unknown): code is string => typeof code === "string" && PAYS.some((p) => p.code === code);

export const infosPays = (code: string): Pays => PAYS.find((p) => p.code === code) ?? PAYS.find((p) => p.code === PAYS_PAR_DEFAUT)!;

/** Première région connue parmi les langues du navigateur : ["fr", "fr-BE"] → BE. */
export function paysDesLangues(langues: readonly string[]): string | undefined {
  for (const langue of langues) {
    const region = langue.split(/[-_]/)[1]?.toUpperCase();
    if (paysConnu(region)) return region;
  }
  return undefined;
}

/** Page JustWatch du pays, pour l'attribution obligatoire des offres (toutes vérifiées en 200). */
export const justWatchUrl = (code: string) => `https://www.justwatch.com/${infosPays(code).code.toLowerCase()}`;
