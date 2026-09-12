import { Link } from "react-router";
import { CardHoverReveal, CardHoverRevealContent, CardHoverRevealMain } from "@/components/ui/reveal-on-hover";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { Poster } from "@/components/movie/Poster";
import { releaseYear, score } from "@/lib/format";
import { movieHref } from "@/lib/slug";
import type { MovieSummary } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

export type CardMovie = Pick<MovieSummary, "id" | "title" | "poster_path" | "release_date" | "vote_average"> &
  Partial<Pick<MovieSummary, "overview" | "vote_count">>;

interface MovieCardProps {
  movie: CardMovie;
  sizes: string;
  eager?: boolean;
  /** Numéro affiché en filigrane (classement des tendances). */
  rank?: number;
  className?: string;
}

export function MovieCard({ movie, sizes, eager, rank, className }: MovieCardProps) {
  const year = releaseYear(movie.release_date);
  const hasScore = movie.vote_average > 0 && (movie.vote_count ?? 1) > 0;

  return (
    <CardHoverReveal className={cn("group overflow-visible", className)}>
      <Link to={movieHref(movie)} className="block">
        <div className="relative aspect-[2/3] overflow-hidden bg-ink-2">
          <CardHoverRevealMain hoverScale={1.04}>
            <Poster path={movie.poster_path} title={movie.title} sizes={sizes} eager={eager} />
          </CardHoverRevealMain>

          {movie.overview ? (
            <CardHoverRevealContent className="inset-x-0 bottom-0 hidden bg-gradient-to-t from-ink via-ink/90 to-transparent px-3 pt-12 pb-3 [@media(hover:hover)]:block">
              <p className="line-clamp-6 text-xs leading-relaxed text-bone/85">{movie.overview}</p>
            </CardHoverRevealContent>
          ) : null}

          {rank ? (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-1 left-2 font-display text-5xl leading-none italic text-bone/90 [text-shadow:0_2px_12px_rgb(0_0_0/0.8)] transition-opacity group-hover:opacity-0"
            >
              {rank}
            </span>
          ) : null}

          {/* Cadre doré au survol */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 ring-1 ring-line ring-inset transition-shadow duration-300 group-hover:ring-gold/70"
          />
        </div>

        <div className="mt-2.5 pr-1">
          <h3 className="line-clamp-2 font-display text-[15px] leading-snug transition-colors group-hover:text-gold-bright">
            {movie.title}
          </h3>
          <p className="marquee mt-1 flex items-center gap-2 text-[11px] text-mute">
            {year ? <span>{year}</span> : null}
            {year && hasScore ? <span aria-hidden className="text-line-strong">/</span> : null}
            {hasScore ? (
              <span className="text-gold">
                <span aria-hidden>★ </span>
                <span className="sr-only">Note </span>
                {score(movie.vote_average)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>

      <FavoriteButton movie={movie} className="absolute top-2 right-2 z-10" />
    </CardHoverReveal>
  );
}
