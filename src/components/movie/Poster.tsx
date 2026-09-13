import { posterSrcSet, posterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

interface PosterProps {
  path: string | null;
  title: string;
  /** Attribut `sizes` : laisse le navigateur choisir w185/w342/w500/w780 selon la largeur réelle. */
  sizes: string;
  eager?: boolean;
  className?: string;
}

/** Affiche TMDB ; sans affiche, une affiche typographique (jamais une image générique). Le parent est positionné. */
export function Poster({ path, title, sizes, eager = false, className }: PosterProps) {
  if (!path) {
    return (
      <div className={cn("affiche-absente content-center", className)}>
        <b className="line-clamp-4">{title}</b>
        <small>Affiche indisponible</small>
      </div>
    );
  }

  return (
    <img
      src={posterUrl(path, "w342")}
      srcSet={posterSrcSet(path)}
      sizes={sizes}
      alt={`Affiche de ${title}`}
      width={342}
      height={513}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : undefined}
      className={cn("absolute inset-0 size-full object-cover", className)}
    />
  );
}
