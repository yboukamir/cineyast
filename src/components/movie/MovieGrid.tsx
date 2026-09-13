import { MovieCard, type CardMovie } from "@/components/movie/MovieCard";
import { PosterSkeleton } from "@/components/States";

/** 2 colonnes à 390 px, 4 à 768, 6 à 1024, 7 à 1440 ; mêmes cartes que les rangées, sans pastille. */
const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-7 lg:grid-cols-6 min-[90rem]:grid-cols-7";
const SIZES = "(min-width: 1440px) 180px, (min-width: 1024px) 15vw, (min-width: 768px) 23vw, 45vw";

export function MovieGrid({ movies, eagerCount = 0 }: { movies: CardMovie[]; eagerCount?: number }) {
  return (
    <ul className={GRID}>
      {movies.map((movie, i) => (
        <li key={movie.id}>
          <MovieCard movie={movie} sizes={SIZES} eager={i < eagerCount} fluid />
        </li>
      ))}
    </ul>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className={GRID} aria-label="Chargement des films" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <PosterSkeleton className="w-auto md:w-auto" />
        </li>
      ))}
    </ul>
  );
}
