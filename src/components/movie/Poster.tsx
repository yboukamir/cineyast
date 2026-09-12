import { Film } from "lucide-react";
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

export function Poster({ path, title, sizes, eager = false, className }: PosterProps) {
  if (!path) {
    return (
      <div className={cn("flex size-full flex-col items-center justify-center gap-3 bg-ink-2 p-4 text-center", className)}>
        <Film className="size-7 text-gold/50" strokeWidth={1.25} aria-hidden />
        <span className="line-clamp-3 font-display text-sm italic text-bone/70">{title}</span>
        <span className="marquee text-[10px] text-mute">Affiche indisponible</span>
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
      className={cn("size-full bg-ink-2 object-cover", className)}
    />
  );
}
