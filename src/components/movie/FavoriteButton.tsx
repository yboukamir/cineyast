import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import type { MovieSummary } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

type FavoriteTarget = Pick<MovieSummary, "id" | "title" | "poster_path" | "release_date" | "vote_average">;

interface FavoriteButtonProps {
  movie: FavoriteTarget;
  /** « carte » : carré posé sur l'affiche ; « bouton » : bouton texte (héros, fiche). */
  variant?: "carte" | "bouton";
  /** Texte visible de la variante « bouton » (peut varier selon la largeur d'écran). */
  label?: ReactNode;
  className?: string;
}

export function FavoriteButton({ movie, variant = "carte", label = "Favori", className }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(movie.id);
  const icon = <Heart className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden />;

  if (variant === "bouton") {
    // Le texte visible reste le nom accessible (critère 2.5.3) ; l'état passe par aria-pressed.
    return (
      <button type="button" data-fav onClick={() => toggle(movie)} aria-pressed={active} className={cn("btn", className)}>
        {icon}
        <span>
          {label}
          <span className="sr-only"> : {movie.title}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(movie)}
      aria-pressed={active}
      aria-label={active ? `Retirer des favoris : ${movie.title}` : `Ajouter aux favoris : ${movie.title}`}
      className={cn("fav", className)}
    >
      {icon}
    </button>
  );
}
