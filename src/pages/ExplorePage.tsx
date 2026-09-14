import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SlidersHorizontal } from "lucide-react";
import { Filters, SORT_OPTIONS } from "@/components/explore/Filters";
import { MovieGrid, GridSkeleton } from "@/components/movie/MovieGrid";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState, ErrorState } from "@/components/States";
import { useCatalog, useGenres } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useInView } from "@/hooks/useInView";
import { count } from "@/lib/format";
import type { CatalogFilters } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

const PAGE = "mx-auto max-w-page px-gouttiere md:px-gouttiere-lg";

/** Les filtres vivent dans l'URL : une recherche se partage et survit au bouton Retour. */
function readFilters(params: URLSearchParams): CatalogFilters {
  const year = Number(params.get("annee"));
  const rating = Number(params.get("note"));
  return {
    query: params.get("q") ?? "",
    genres: (params.get("genres") ?? "")
      .split(",")
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0),
    year: Number.isInteger(year) && year >= 1874 && year <= 2100 ? year : undefined,
    minRating: Number.isFinite(rating) ? Math.min(9, Math.max(0, rating)) : 0,
    sort: SORT_OPTIONS.find((o) => o.slug === params.get("tri"))?.value ?? "popularity.desc",
  };
}

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);
  const searchMode = filters.query.trim().length > 0;
  const [panelOpen, setPanelOpen] = useState(false);

  useDocumentTitle(searchMode ? `Recherche « ${filters.query} »` : "Explorer les films");

  const update = (patch: Partial<CatalogFilters>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const set = (key: string, value: string | undefined) => (value ? next.set(key, value) : next.delete(key));
        if ("query" in patch) set("q", patch.query?.trim() || undefined);
        if ("genres" in patch) set("genres", patch.genres?.join(",") || undefined);
        if ("year" in patch) set("annee", patch.year ? String(patch.year) : undefined);
        if ("minRating" in patch) set("note", patch.minRating ? String(patch.minRating) : undefined);
        if ("sort" in patch) {
          const slug = SORT_OPTIONS.find((o) => o.value === patch.sort)?.slug;
          set("tri", slug === "popularite" ? undefined : slug);
        }
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  };
  const resetFilters = () => update({ genres: [], year: undefined, minRating: 0, sort: "popularity.desc" });

  // Saisie libre → URL, avec un léger délai pour ne pas appeler TMDB à chaque lettre.
  const [text, setText] = useState(filters.query);
  const debouncedText = useDebouncedValue(text, 350);
  useEffect(() => {
    if (debouncedText.trim() !== filters.query) update({ query: debouncedText });
  }, [debouncedText]); // eslint-disable-line react-hooks/exhaustive-deps
  // URL → saisie (bouton Retour, lien « Tout voir »…).
  useEffect(() => {
    setText((current) => (current.trim() === filters.query ? current : filters.query));
  }, [filters.query]);

  const genres = useGenres();
  const catalog = useCatalog(filters);
  const { data, isPending, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage, isPlaceholderData } =
    catalog;

  // Défilement infini : une sentinelle sous la grille déclenche la page suivante.
  const [sentinelRef, sentinelVisible] = useInView<HTMLDivElement>({ rootMargin: "800px", once: false });
  useEffect(() => {
    if (sentinelVisible && hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [sentinelVisible, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  const activeCount =
    filters.genres.length + (filters.year ? 1 : 0) + (filters.minRating ? 1 : 0) + (filters.sort !== "popularity.desc" ? 1 : 0);

  const movies = data?.movies ?? [];

  return (
    <>
      <section aria-labelledby="explorer-titre" className="border-b-[3px] border-noir bg-outremer text-creme">
        <div className={cn(PAGE, "py-8 md:py-10")}>
          {/* pt-[.15em] : line-clamp masquerait les accents des capitales de la première ligne. */}
          <h1 id="explorer-titre" className="hero-titre line-clamp-2 pt-[.15em] !text-[44px] [overflow-wrap:anywhere] md:!text-d-lg">
            {searchMode ? `Résultats pour « ${filters.query} »` : "Explorer"}
          </h1>
          <p className="mt-3 text-[15px] md:text-lg">Le catalogue TMDB par titre, par genre, par année et par note.</p>
          <SearchBar
            value={text}
            onChange={setText}
            onSubmit={(q) => update({ query: q })}
            placeholder="Un titre : Le Mépris, Parasite, In the Mood for Love…"
            className="mt-5 max-w-2xl"
          />
        </div>
      </section>

      <div className={cn(PAGE, "pt-8")}>
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          aria-controls="panneau-filtres"
          className="btn w-full justify-between md:hidden"
        >
          <span className="flex items-center gap-2.5">
            <SlidersHorizontal className="size-[18px]" strokeWidth={2.4} aria-hidden />
            Filtres
          </span>
          {activeCount ? (
            <span className="tuiles tuiles-sm">
              <b>{activeCount}</b>
              <span className="sr-only"> actifs</span>
            </span>
          ) : null}
        </button>
        <div id="panneau-filtres" className={cn("mt-4 md:mt-0 md:block", !panelOpen && "hidden")}>
          <Filters
            filters={filters}
            genres={genres.data}
            searchMode={searchMode}
            activeCount={activeCount}
            onChange={update}
            onReset={resetFilters}
          />
        </div>

        <section aria-label="Résultats" aria-busy={isPending || isPlaceholderData} className="mt-8">
          {data && !isError ? (
            <p className="mb-6 text-sm font-bold tracking-[.08em] text-gris uppercase" aria-live="polite">
              {data.filteredLocally
                ? `${count(movies.length)} film${movies.length > 1 ? "s" : ""} correspondant à vos filtres parmi les résultats chargés`
                : `${count(data.totalResults)} film${data.totalResults > 1 ? "s" : ""}`}
            </p>
          ) : null}

          {isError && !data ? (
            <ErrorState error={error} what="le catalogue" onRetry={() => void refetch()} />
          ) : isPending ? (
            <GridSkeleton />
          ) : movies.length === 0 && !hasNextPage ? (
            <EmptyState
              title="Aucun film à l'affiche pour ces critères."
              action={
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setText("");
                    update({ query: "", genres: [], year: undefined, minRating: 0, sort: "popularity.desc" });
                  }}
                >
                  Effacer les filtres
                </button>
              }
            >
              Essayez un autre titre, un autre genre, une autre année ou une note plus basse.
            </EmptyState>
          ) : (
            <div className={cn("transition-opacity", isPlaceholderData && "opacity-50")}>
              <MovieGrid movies={movies} eagerCount={4} />
            </div>
          )}

          <div ref={sentinelRef} aria-hidden className="h-px" />

          {isFetchingNextPage ? (
            <div className="mt-8">
              <GridSkeleton count={7} />
            </div>
          ) : null}
          {/* Secours pour le clavier et les lecteurs d'écran : le défilement infini ne se déclenche qu'à la vue. */}
          {hasNextPage && !isFetchingNextPage && !isError ? (
            <div className="mt-10 flex justify-center">
              <button type="button" className="btn" onClick={() => void fetchNextPage()}>
                Charger la suite
              </button>
            </div>
          ) : null}
          {isError && data ? (
            <ErrorState className="mt-8" error={error} what="la suite du catalogue" onRetry={() => void fetchNextPage()} />
          ) : null}
        </section>
      </div>
    </>
  );
}
