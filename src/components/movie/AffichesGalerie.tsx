import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PosterSkeleton } from "@/components/States";
import { ScrollerArrows, useScroller } from "@/components/ui/scroller";
import { useMovieImages } from "@/hooks/queries";
import { useInView } from "@/hooks/useInView";
import { choisirAffiches, libelleAffiche } from "@/lib/affiches";
import { posterSrcSet, posterUrl, type MovieImage } from "@/lib/tmdb";

/**
 * Galerie « Les affiches » de la fiche film, inspirée des pages que les revues de cinéma consacrent
 * à l'art de l'affiche. Les images ne sont demandées qu'à l'approche de la section, pour ne rien
 * retarder de la fiche. S'il y a moins de deux affiches, la section disparaît.
 */
export function AffichesGalerie({ movieId, title, affichePrincipale }: { movieId: number; title: string; affichePrincipale: string | null }) {
  const [sectionRef, inView] = useInView<HTMLElement>();
  const images = useMovieImages(movieId, inView);
  const affiches = useMemo(() => choisirAffiches(images.data?.posters ?? [], affichePrincipale), [images.data, affichePrincipale]);
  const { ref, atStart, atEnd, page } = useScroller<HTMLDivElement>([images.isSuccess, affiches.length]);
  const [ouverte, setOuverte] = useState<number | null>(null);

  // En cas d'erreur ou de galerie trop maigre, la fiche s'en passe plutôt que d'afficher un bloc vide.
  if (images.isError || (images.isSuccess && affiches.length < 2)) return null;

  return (
    <section ref={sectionRef} aria-labelledby="affiches-titre" className="mx-auto max-w-page px-gouttiere pt-10 md:px-gouttiere-lg md:pt-14">
      <div className="mb-2 flex items-end justify-between gap-4 md:mb-3">
        <div>
          <p className="surtitre mb-1">L'art de l'affiche</p>
          <h2 id="affiches-titre" className="titre-section">
            Les affiches
          </h2>
        </div>
        {images.isSuccess ? <ScrollerArrows atStart={atStart} atEnd={atEnd} page={page} /> : null}
      </div>

      <div
        ref={ref}
        role="region"
        tabIndex={0}
        aria-label="Affiches du film, rangée défilante"
        aria-busy={!images.isSuccess || undefined}
        className="rangee-scroll"
      >
        {images.isSuccess
          ? affiches.map((affiche, i) => (
              <figure key={affiche.file_path} className="m-0 w-[150px] shrink-0 snap-start md:w-48">
                <button
                  type="button"
                  onClick={() => setOuverte(i)}
                  aria-label={`Agrandir l'affiche ${i + 1} sur ${affiches.length}, ${libelleAffiche(affiche).toLowerCase()}`}
                  className="zone block aspect-[2/3] w-full cursor-zoom-in border-[3px] border-noir transition-transform duration-(--duration-vite) hover:-translate-y-1"
                >
                  <img
                    src={posterUrl(affiche.file_path, "w342")}
                    srcSet={posterSrcSet(affiche.file_path)}
                    sizes="(min-width: 768px) 192px, 150px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover"
                  />
                </button>
                <figcaption className="mt-2 text-sm font-semibold text-gris">{libelleAffiche(affiche)}</figcaption>
              </figure>
            ))
          : Array.from({ length: 6 }, (_, i) => <PosterSkeleton key={i} />)}
      </div>

      {ouverte !== null ? (
        <Visionneuse affiches={affiches} index={ouverte} title={title} onChange={setOuverte} onClose={() => setOuverte(null)} />
      ) : null}
    </section>
  );
}

interface VisionneuseProps {
  affiches: MovieImage[];
  index: number;
  title: string;
  onChange: (index: number) => void;
  onClose: () => void;
}

/** <dialog> natif : Échap, piège du focus et retour du focus sur la vignette sont gérés par le navigateur. */
function Visionneuse({ affiches, index, title, onChange, onClose }: VisionneuseProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const affiche = affiches[index];
  const total = affiches.length;
  const aller = (pas: number) => onChange((index + pas + total) % total);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Un clic hors de l'affiche (sur le fond assombri) ferme la visionneuse.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          aller(e.key === "ArrowRight" ? 1 : -1);
        }
      }}
      aria-label={`Affiches de ${title}`}
      // Largeur bornée par la hauteur d'écran : l'affiche 2:3 tient toujours en entier.
      className="m-auto w-[min(92vw,560px,50dvh)] max-w-none border-[3px] border-noir bg-creme p-0 text-noir shadow-dure-lg backdrop:bg-noir/85"
    >
      <figure className="m-0">
        <div className="zone aspect-[2/3] w-full">
          <img
            key={affiche.file_path}
            src={posterUrl(affiche.file_path, "w780")}
            alt={`Affiche de ${title}, ${libelleAffiche(affiche).toLowerCase()}`}
            className="absolute inset-0 size-full object-contain"
          />
        </div>
        <figcaption className="flex items-center justify-between gap-3 border-t-[3px] border-noir p-3">
          <span className="text-sm font-bold" aria-live="polite">
            {index + 1} / {total} · {libelleAffiche(affiche)}
          </span>
          <span className="flex items-center gap-2">
            <button type="button" className="btn btn-icon" onClick={() => aller(-1)} aria-label="Affiche précédente">
              <ChevronLeft className="size-5" strokeWidth={2.6} aria-hidden />
            </button>
            <button type="button" className="btn btn-icon" onClick={() => aller(1)} aria-label="Affiche suivante">
              <ChevronRight className="size-5" strokeWidth={2.6} aria-hidden />
            </button>
            <button type="button" className="btn btn-icon" onClick={() => dialogRef.current?.close()} aria-label="Fermer">
              <X className="size-5" strokeWidth={2.6} aria-hidden />
            </button>
          </span>
        </figcaption>
      </figure>
    </dialog>
  );
}
