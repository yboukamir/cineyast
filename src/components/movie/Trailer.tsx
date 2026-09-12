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
    <div className={cn("relative aspect-video overflow-hidden bg-ink-2 ring-1 ring-line", className)}>
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
          aria-label={`Lire la bande-annonce de ${title}`}
          className="group absolute inset-0"
        >
          <img
            src={`https://i.ytimg.com/vi/${key}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-90"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="flex size-16 items-center justify-center bg-velvet text-bone ring-1 ring-velvet-bright transition-transform duration-300 group-hover:scale-110 md:size-20">
              <Play className="size-7 translate-x-0.5 fill-current" aria-hidden />
            </span>
          </span>
          <span className="marquee absolute bottom-4 left-4 text-left text-xs text-bone/85">{video.name}</span>
        </button>
      )}
    </div>
  );
}
