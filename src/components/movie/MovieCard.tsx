import { Link } from "react-router";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { NoteAbsente, NoteTuiles } from "@/components/movie/NoteTuiles";
import { Poster } from "@/components/movie/Poster";
import { releaseYear } from "@/lib/format";
import { movieHref } from "@/lib/slug";
import type { MovieSummary } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

export type CardMovie = Pick<MovieSummary, "id" | "title" | "poster_path" | "release_date" | "vote_average"> &
  Partial<Pick<MovieSummary, "overview" | "vote_count">> & {
    /** Ligne secondaire facultative, par exemple le rôle dans une filmographie. */
    subtitle?: string;
  };

interface MovieCardProps {
  movie: CardMovie;
  sizes: string;
  eager?: boolean;
  /** Pastille de classement (tendances). */
  rank?: number;
  /** Mot lu avant le numéro par les lecteurs d'écran : « Classement », « Épisode » pour une saga. */
  rankLabel?: string;
  /** Largeur donnée par la grille parente au lieu de la largeur fixe des rangées. */
  fluid?: boolean;
  className?: string;
}

export function MovieCard({ movie, sizes, eager, rank, rankLabel = "Classement", fluid = false, className }: MovieCardProps) {
  const href = movieHref(movie);
  const year = releaseYear(movie.release_date);
  const hasScore = movie.vote_average > 0 && (movie.vote_count ?? 1) > 0;

  return (
    <article className={cn("carte", fluid && "w-auto snap-none md:w-auto", className)}>
      {rank ? (
        <span className="pastille">
          <span className="sr-only">{rankLabel} </span>
          {rank}
        </span>
      ) : null}

      {/* L'affiche est cliquable à la souris ; au clavier, c'est le titre qui porte le lien. */}
      <Link to={href} className="carte-media" aria-label={`Voir la fiche de ${movie.title}`} tabIndex={-1}>
        <Poster path={movie.poster_path} title={movie.title} sizes={sizes} eager={eager} />
      </Link>

      <FavoriteButton movie={movie} />

      <h3 className="carte-titre">
        <Link to={href} className="decoration-2 underline-offset-2 hover:underline">
          {movie.title}
        </Link>
      </h3>
      <p className="carte-meta">
        <span>{year || "—"}</span>
        {hasScore ? <NoteTuiles value={movie.vote_average} /> : <NoteAbsente />}
      </p>
      {movie.subtitle ? <p className="mt-1 line-clamp-1 text-sm text-gris">{movie.subtitle}</p> : null}
    </article>
  );
}
