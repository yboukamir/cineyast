import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SlidersHorizontal } from "lucide-react";
import { Filters, SORT_OPTIONS } from "@/components/explore/Filters";
import { MovieGrid, GridSkeleton } from "@/components/movie/MovieGrid";
import { SearchBar } from "@/components/SearchBar";
import { EmptyState, ErrorState } from "@/components/States";
import { TicketButton } from "@/components/ui/ticket-button";
import { useCatalog, useGenres } from "@/hooks/queries";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useInView } from "@/hooks/useInView";
import { count } from "@/lib/format";
import type { CatalogFilters } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

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
    <div className="px-page pt-24 md:pt-28">
      <header className="border-b border-line pb-8">
        <p className="marquee text-xs text-gold">Catalogue</p>
        <h1 className="mt-1 font-display text-4xl leading-tight md:text-6xl">
          {searchMode ? (
            <>
              Résultats pour <em className="text-gold-bright">« {filters.query} »</em>
            </>
          ) : (
            "Explorer les films"
          )}
        </h1>
        <SearchBar
          value={text}
          onChange={setText}
          onSubmit={(q) => update({ query: q })}
          placeholder="Un titre : Le Mépris, Parasite, In the Mood for Love…"
          className="mt-6 max-w-2xl"
          inputClassName="h-12"
        />
      </header>

      <div className="mt-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
        <aside aria-label="Filtres" className="mb-8 lg:mb-0">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-controls="panneau-filtres"
            className="marquee flex h-11 w-full items-center justify-between border border-line-strong px-4 text-sm lg:hidden"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" aria-hidden /> Filtres
            </span>
            {activeCount ? <span className="bg-velvet px-2 text-xs leading-5 tracking-normal">{activeCount}</span> : null}
          </button>
          <div id="panneau-filtres" className={cn("mt-6 lg:sticky lg:top-28 lg:mt-0 lg:block", !panelOpen && "hidden")}>
            <Filters
              filters={filters}
              genres={genres.data}
              searchMode={searchMode}
              activeCount={activeCount}
              onChange={update}
              onReset={() => update({ genres: [], year: undefined, minRating: 0, sort: "popularity.desc" })}
            />
          </div>
        </aside>

        <section aria-label="Résultats" aria-busy={isPending || isPlaceholderData}>
          {data && !isError ? (
            <p className="marquee mb-6 text-xs text-mute" aria-live="polite">
              {data.filteredLocally
                ? `${count(movies.length)} film${movies.length > 1 ? "s" : ""} correspondant à vos filtres parmi les résultats chargés`
                : `${count(data.totalResults)} film${data.totalResults > 1 ? "s" : ""}`}
            </p>
          ) : null}

          {isError && !data ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : isPending ? (
            <GridSkeleton />
          ) : movies.length === 0 && !hasNextPage ? (
            <EmptyState title="Aucun film à l'affiche pour ces critères.">
              Essayez un autre titre, élargissez l'année ou baissez la note minimale.
            </EmptyState>
          ) : (
            <div className={cn("transition-opacity", isPlaceholderData && "opacity-50")}>
              <MovieGrid movies={movies} eagerCount={4} />
            </div>
          )}

          <div ref={sentinelRef} aria-hidden className="h-px" />

          {hasNextPage ? (
            <div className="mt-12 flex justify-center">
              <TicketButton variant="ghost" onClick={() => void fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Chargement…" : "Charger plus de films"}
              </TicketButton>
            </div>
          ) : null}
          {isError && data ? <ErrorState className="mt-8" error={error} onRetry={() => void fetchNextPage()} /> : null}
        </section>
      </div>
    </div>
  );
}
