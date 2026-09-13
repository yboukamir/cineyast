import { useId } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Scroller } from "@/components/ui/scroller";
import { MovieCard } from "@/components/movie/MovieCard";
import { ErrorState, PosterSkeleton } from "@/components/States";
import { TmdbError, type MovieSummary } from "@/lib/tmdb";

const ITEM = "w-[40vw] max-w-52 shrink-0 snap-start sm:w-44 md:w-48 lg:w-52";
const SIZES = "(min-width: 1024px) 208px, (min-width: 768px) 192px, (min-width: 640px) 176px, 40vw";

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
}

export function MovieRow({ eyebrow, title, query, moreHref, ranked = false }: MovieRowProps) {
  const headingId = useId();
  const movies = query.data?.results ?? [];

  // Clé absente : l'explication est déjà affichée en haut de page, inutile de la répéter à chaque rangée.
  if (query.error instanceof TmdbError && query.error.code === "missing_api_key") return null;

  return (
    <section aria-labelledby={headingId} className="py-8 md:py-10">
      <div className="px-page mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="marquee text-xs text-gold">{eyebrow}</p> : null}
          <h2 id={headingId} className="mt-1 font-display text-2xl md:text-3xl">
            {title}
          </h2>
        </div>
        {moreHref ? (
          <Link
            to={moreHref}
            className="marquee inline-flex shrink-0 items-center gap-1.5 pb-1 text-xs text-mute transition-colors hover:text-gold"
          >
            Tout voir <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {query.isError ? (
        <div className="px-page">
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <Scroller label={title} className="px-page scroll-px-page snap-x snap-mandatory">
          <ul className="flex w-max gap-4 pb-2 md:gap-5">
            {query.isPending
              ? Array.from({ length: 8 }, (_, i) => (
                  <li key={i} className={ITEM}>
                    <PosterSkeleton />
                  </li>
                ))
              : movies.map((movie, i) => (
                  <li key={movie.id} className={ITEM}>
                    <MovieCard movie={movie} sizes={SIZES} rank={ranked ? i + 1 : undefined} />
                  </li>
                ))}
          </ul>
        </Scroller>
      )}
    </section>
  );
}
