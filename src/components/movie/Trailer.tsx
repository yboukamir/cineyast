import { useState } from "react";
import { Play } from "lucide-react";
import type { Video } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

/**
 * Lecteur « façade » : seule une vignette est chargée. L'iframe YouTube
 * (≈ 1 Mo de JS + cookies) n'est créée qu'au clic, via youtube-nocookie.com.
 */
export function Trailer({ video, title, className }: { video: Video; title: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const key = encodeURIComponent(video.key);

  return (
    <div className={cn("zone aspect-video border-[3px] border-noir bg-noir", className)}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`}
          title={`Bande-annonce : ${title}`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 grid size-full cursor-pointer place-items-center"
        >
          <img
            src={`https://i.ytimg.com/vi/${key}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          {/* Le nom accessible reprend le texte visible (commande vocale : « cliquer sur … ») et le complète. */}
          <span className="relative inline-flex h-14 items-center gap-3 border-2 border-noir bg-jaune px-6 text-[15px] font-bold text-noir shadow-dure transition-[transform,box-shadow] duration-(--duration-vite) group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-dure-sm">
            <Play className="size-5 fill-current" aria-hidden />
            Lire la bande-annonce
            <span className="sr-only"> de {title} (YouTube)</span>
          </span>
        </button>
      )}
    </div>
  );
}
