/**
 * Client TMDB. Toutes les requêtes passent par /api/tmdb.php, qui ajoute la
 * clé côté serveur (PHP en production, middleware Vite en développement).
 * Aucune clé n'est donc présente dans ce code ni dans le bundle.
 */

// ─── Types (sous-ensemble des réponses TMDB réellement utilisé) ─────────────

export interface MovieSummary {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  original_language?: string;
}

export interface Paginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  iso_639_1: string;
}

interface ReleaseDatesByCountry {
  iso_3166_1: string;
  release_dates: { certification: string; type: number; release_date: string }[];
}

export interface MovieDetail extends Omit<MovieSummary, "genre_ids"> {
  genres: Genre[];
  runtime: number | null;
  tagline: string | null;
  status: string;
  imdb_id: string | null;
  production_countries: { iso_3166_1: string; name: string }[];
  credits: { cast: CastMember[]; crew: CrewMember[] };
  videos: { results: Video[] };
  recommendations: Paginated<MovieSummary>;
  release_dates: { results: ReleaseDatesByCountry[] };
}

// ─── Requêtes ────────────────────────────────────────────────────────────────

export class TmdbError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
    this.code = code;
  }
}

const ENDPOINT = "/api/tmdb.php";
export const LANGUAGE = "fr-FR";
export const REGION = "FR";
/** TMDB refuse les pages au-delà de 500. */
export const MAX_PAGE = 500;

type Params = Record<string, string | number | undefined | null>;

export async function tmdb<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const qs = new URLSearchParams({ path, language: LANGUAGE });
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(name, String(value));
  }

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?${qs}`, { signal, headers: { accept: "application/json" } });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new TmdbError("Connexion impossible. Vérifiez votre réseau puis réessayez.", 0);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // corps vide ou non JSON : traité ci-dessous
  }

  if (!response.ok) {
    const body = data as { message?: string; status_message?: string; error?: string } | null;
    if (response.status === 401) {
      throw new TmdbError("La clé TMDB configurée sur le serveur est invalide ou révoquée.", 401, body?.error);
    }
    throw new TmdbError(
      body?.message ?? body?.status_message ?? `Le serveur a répondu ${response.status}.`,
      response.status,
      body?.error,
    );
  }
  if (data === null) throw new TmdbError("Réponse inattendue du serveur.", response.status);

  return data as T;
}

export type SortKey = "popularity.desc" | "vote_average.desc" | "primary_release_date.desc" | "revenue.desc";

export interface CatalogFilters {
  query: string;
  genres: number[];
  year?: number;
  minRating: number;
  sort: SortKey;
}

export const api = {
  trending: (window: "day" | "week", signal?: AbortSignal) =>
    tmdb<Paginated<MovieSummary>>(`/trending/movie/${window}`, {}, signal),

  list: (kind: "popular" | "top_rated" | "now_playing" | "upcoming", signal?: AbortSignal) =>
    tmdb<Paginated<MovieSummary>>(`/movie/${kind}`, { region: REGION }, signal),

  genres: (signal?: AbortSignal) => tmdb<{ genres: Genre[] }>("/genre/movie/list", {}, signal),

  movie: (id: number, signal?: AbortSignal) =>
    tmdb<MovieDetail>(
      `/movie/${id}`,
      {
        append_to_response: "credits,videos,recommendations,release_dates",
        // Sans ce paramètre, language=fr-FR ne renvoie que les vidéos françaises.
        include_video_language: "fr,en,null",
      },
      signal,
    ),

  search: (query: string, page: number, year: number | undefined, signal?: AbortSignal) =>
    tmdb<Paginated<MovieSummary>>("/search/movie", { query, page, primary_release_year: year }, signal),

  discover: (filters: CatalogFilters, page: number, signal?: AbortSignal) => {
    const byRating = filters.sort === "vote_average.desc";
    return tmdb<Paginated<MovieSummary>>(
      "/discover/movie",
      {
        page,
        sort_by: filters.sort,
        with_genres: filters.genres.length ? filters.genres.join(",") : undefined,
        primary_release_year: filters.year,
        "vote_average.gte": filters.minRating || undefined,
        // Sans seuil de votes, un film noté 10/10 par 1 personne passerait devant tout le monde.
        "vote_count.gte": byRating ? 300 : filters.minRating ? 100 : undefined,
        // Trier par date sans borne remonte les annonces de films pas encore sortis.
        "primary_release_date.lte": filters.sort === "primary_release_date.desc" ? today() : undefined,
        region: REGION,
      },
      signal,
    );
  },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Images ──────────────────────────────────────────────────────────────────

const IMG = "https://image.tmdb.org/t/p";

export const posterUrl = (path: string | null, size: "w185" | "w342" | "w500" | "w780" = "w342") =>
  path ? `${IMG}/${size}${path}` : undefined;

export const posterSrcSet = (path: string | null) =>
  path ? `${IMG}/w185${path} 185w, ${IMG}/w342${path} 342w, ${IMG}/w500${path} 500w, ${IMG}/w780${path} 780w` : undefined;

export const backdropUrl = (path: string | null, size: "w780" | "w1280" | "original" = "w1280") =>
  path ? `${IMG}/${size}${path}` : undefined;

export const backdropSrcSet = (path: string | null) =>
  path ? `${IMG}/w780${path} 780w, ${IMG}/w1280${path} 1280w, ${IMG}/original${path} 1920w` : undefined;

export const profileUrl = (path: string | null) => (path ? `${IMG}/w185${path}` : undefined);

// ─── Extraction ──────────────────────────────────────────────────────────────

/** Bande-annonce YouTube la plus pertinente : trailer > teaser, VF > VO, officielle d'abord. */
export function pickTrailer(videos: Video[]): Video | undefined {
  const score = (v: Video) =>
    (v.type === "Trailer" ? 100 : 50) + (v.iso_639_1 === "fr" ? 20 : 0) + (v.official ? 10 : 0);
  return videos
    .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
    .sort((a, b) => score(b) - score(a))[0];
}

const FR_CERTIFICATIONS: Record<string, string> = {
  U: "Tous publics",
  TP: "Tous publics",
  "10": "Déconseillé -10 ans",
  "12": "Interdit -12 ans",
  "16": "Interdit -16 ans",
  "18": "Interdit -18 ans",
};

export function frenchCertification(movie: MovieDetail): string | undefined {
  const fr = movie.release_dates?.results.find((r) => r.iso_3166_1 === REGION);
  const cert = fr?.release_dates.find((d) => d.certification.trim())?.certification.trim();
  return cert ? (FR_CERTIFICATIONS[cert] ?? cert) : undefined;
}

export const directors = (movie: MovieDetail) =>
  movie.credits.crew.filter((c) => c.job === "Director").map((c) => c.name);
