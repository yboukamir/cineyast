import { keepPreviousData, QueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api, MAX_PAGE, TmdbError, type CatalogFilters, type MovieSummary } from "@/lib/tmdb";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Inutile de réessayer une clé invalide, un id inexistant ou un endpoint refusé.
      retry: (failures, error) =>
        !(error instanceof TmdbError && [400, 401, 404, 405, 500].includes(error.status)) && failures < 2,
    },
  },
});

export const useTrending = (window: "day" | "week" = "week") =>
  useQuery({ queryKey: ["trending", window], queryFn: ({ signal }) => api.trending(window, signal) });

export type ListKind = "popular" | "top_rated" | "now_playing" | "upcoming";

/** `enabled` permet de ne charger une rangée que lorsqu'elle approche de l'écran. */
export const useMovieList = (kind: ListKind, enabled = true) =>
  useQuery({ queryKey: ["list", kind], queryFn: ({ signal }) => api.list(kind, signal), enabled });

export const useGenres = () =>
  useQuery({
    queryKey: ["genres"],
    queryFn: ({ signal }) => api.genres(signal),
    select: (data) => data.genres,
    staleTime: Infinity,
  });

export const useMovie = (id: number) =>
  useQuery({
    queryKey: ["movie", id],
    queryFn: ({ signal }) => api.movie(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  });

export const usePerson = (id: number) =>
  useQuery({
    queryKey: ["person", id],
    queryFn: ({ signal }) => api.person(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  });

/**
 * Catalogue paginé. Avec un titre, on passe par /search/movie (qui ne sait
 * filtrer que par année) : genres et note minimale sont alors appliqués sur
 * les résultats reçus. Sans titre, /discover/movie filtre tout côté TMDB.
 */
export function useCatalog(filters: CatalogFilters) {
  const query = filters.query.trim();

  return useInfiniteQuery({
    queryKey: ["catalog", { ...filters, query }],
    queryFn: ({ pageParam, signal }) =>
      query ? api.search(query, pageParam, filters.year, signal) : api.discover(filters, pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < Math.min(last.total_pages, MAX_PAGE) ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
    select: (data) => {
      const seen = new Set<number>();
      const movies: MovieSummary[] = [];
      for (const page of data.pages) {
        for (const movie of page.results) {
          // TMDB renvoie parfois le même film sur deux pages consécutives.
          if (seen.has(movie.id)) continue;
          seen.add(movie.id);
          if (query && !matchesLocally(movie, filters)) continue;
          movies.push(movie);
        }
      }
      return {
        movies,
        totalResults: data.pages[0]?.total_results ?? 0,
        filteredLocally: Boolean(query) && (filters.genres.length > 0 || filters.minRating > 0),
      };
    },
  });
}

function matchesLocally(movie: MovieSummary, filters: CatalogFilters) {
  if (filters.minRating && movie.vote_average < filters.minRating) return false;
  if (filters.genres.length && !filters.genres.every((g) => movie.genre_ids?.includes(g))) return false;
  return true;
}
