import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import type { MovieSummary } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

type FavoriteTarget = Pick<MovieSummary, "id" | "title" | "poster_path" | "release_date" | "vote_average">;

/** Pastille cœur posée sur une affiche. */
export function FavoriteButton({ movie, className }: { movie: FavoriteTarget; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(movie.id);

  return (
    <button
      type="button"
      onClick={() => toggle(movie)}
      aria-pressed={active}
      aria-label={active ? `Retirer « ${movie.title} » des favoris` : `Ajouter « ${movie.title} » aux favoris`}
      className={cn(
        "flex size-9 items-center justify-center border bg-ink/70 backdrop-blur-sm transition-colors",
        active
          ? "border-velvet-bright text-velvet-bright"
          : "border-line-strong text-bone/80 hover:border-gold hover:text-gold",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} strokeWidth={1.75} />
    </button>
  );
}
