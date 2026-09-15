import { useId } from "react";
import { Link } from "react-router";
import { MovieCard } from "@/components/movie/MovieCard";
import { EmptyState, ErrorState, PosterSkeleton } from "@/components/States";
import { RubriqueTab, type Rubrique } from "@/components/movie/Rubrique";
import { ScrollerArrows, useScroller } from "@/components/ui/scroller";
import { TmdbError, type MovieSummary } from "@/lib/tmdb";

const SIZES = "(min-width: 768px) 176px, 140px";

/** Sous-ensemble d'un résultat TanStack Query ; permet aussi de passer des données déjà chargées. */
export interface RowSource {
  /** Une page TMDB convient, comme toute liste déjà filtrée. */
  data?: { results: MovieSummary[] };
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

export interface MovieRowProps {
  eyebrow?: string;
  title: string;
  query: RowSource;
  moreHref?: string;
  ranked?: boolean;
  /** Voir MovieCard : « Épisode » pour une saga. */
  rankLabel?: string;
  /** Onglet de couleur de la rubrique, devant le surtitre. */
  rubrique?: Rubrique;
}

export function MovieRow({ eyebrow, title, query, moreHref, ranked = false, rankLabel, rubrique }: MovieRowProps) {
  const headingId = useId();
  const movies = query.data?.results ?? [];
  const empty = !query.isPending && !query.isError && movies.length === 0;
  const { ref, atStart, atEnd, page } = useScroller<HTMLDivElement>([query.isPending, query.isError, movies.length]);

  // Clé absente : l'explication est déjà affichée en haut de page, inutile de la répéter à chaque rangée.
  if (query.error instanceof TmdbError && query.error.code === "missing_api_key") return null;

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-page px-gouttiere pt-10 md:px-gouttiere-lg md:pt-14">
      <div className="mb-2 flex items-end justify-between gap-4 md:mb-3">
        <div>
          {eyebrow ? (
            <p className="surtitre mb-1 flex items-center gap-2">
              {rubrique ? <RubriqueTab rubrique={rubrique} /> : null}
              {eyebrow}
            </p>
          ) : null}
          <h2 id={headingId} className="titre-section">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {moreHref ? (
            <Link to={moreHref} className="btn btn-sm">
              Tout voir
            </Link>
          ) : null}
          {!query.isError && !empty ? <ScrollerArrows atStart={atStart} atEnd={atEnd} page={page} /> : null}
        </div>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} what="cette rangée" onRetry={() => void query.refetch()} className="mt-3" />
      ) : empty ? (
        <EmptyState
          title="Aucun film dans cette rangée pour le moment."
          action={
            <Link to="/explorer" className="btn btn-sm">
              Explorer le catalogue
            </Link>
          }
          className="mt-3"
        >
          Revenez plus tard ou explorez le catalogue.
        </EmptyState>
      ) : (
        <div
          ref={ref}
          role="region"
          tabIndex={0}
          aria-label={`${title}, rangée défilante`}
          aria-busy={query.isPending || undefined}
          className="rangee-scroll"
        >
          {query.isPending
            ? Array.from({ length: 8 }, (_, i) => <PosterSkeleton key={i} />)
            : movies.map((movie, i) => (
                <MovieCard key={movie.id} movie={movie} sizes={SIZES} rank={ranked ? i + 1 : undefined} rankLabel={rankLabel} />
              ))}
        </div>
      )}
    </section>
  );
}
