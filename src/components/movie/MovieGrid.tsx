import { MovieCard, type CardMovie } from "@/components/movie/MovieCard";
import { PosterSkeleton } from "@/components/States";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 lg:grid-cols-5 xl:grid-cols-6";
const SIZES =
  "(min-width: 1280px) 15vw, (min-width: 1024px) 18vw, (min-width: 768px) 23vw, (min-width: 640px) 31vw, 47vw";

export function MovieGrid({ movies, eagerCount = 0 }: { movies: CardMovie[]; eagerCount?: number }) {
  return (
    <ul className={GRID}>
      {movies.map((movie, i) => (
        <li key={movie.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i % 20, 12) * 30}ms` }}>
          <MovieCard movie={movie} sizes={SIZES} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul className={GRID} aria-label="Chargement des films">
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <PosterSkeleton />
        </li>
      ))}
    </ul>
  );
}
