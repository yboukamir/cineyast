// Adapté de « Hero Carousel » (crafterui) — catalogue 21st.dev.
//
// Refonte « L'Affiche » (septembre 2026) : le rendu suit la maquette validée par Yassine —
// l'image du film cadrée en haut, jamais recouverte ; un bandeau outremer dessous porte le
// titre, les informations et les boutons ; l'affiche chevauche la couture des deux.
// Conservé de l'original : la mécanique du carrousel — lecture automatique mise en pause au
// survol et au focus, flèches du clavier, geste horizontal du trackpad (la molette verticale
// reste à la page), aucune animation si l'utilisateur préfère les réduire.
// Remplacé : la pellicule animée par un fondu de l'image et un balayage au doigt.
import * as React from "react";
import { Link } from "react-router";
import { useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NoteAbsente, NoteTuiles } from "@/components/movie/NoteTuiles";
import { cn } from "@/lib/utils";

export interface HeroCarouselItem {
  id: string | number;
  title: string;
  /** Image paysage du film, cadrée en haut du héros. */
  backdrop?: string;
  backdropSrcSet?: string;
  /** Affiche portrait qui chevauche la couture. */
  poster?: string;
  posterSrcSet?: string;
  href?: string;
  /** Étiquette jaune posée sur l'image, ex. « N°1 des tendances de la semaine ». */
  credit?: string;
  /** Faits séparés par un carré jaune : année, genres… */
  meta?: string[];
  /** Note TMDB sur 10 ; absente = « — ». */
  note?: number;
}

interface HeroCarouselProps {
  items: HeroCarouselItem[];
  defaultIndex?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  renderActions?: (item: HeroCarouselItem) => React.ReactNode;
  label?: string;
  className?: string;
}

const WHEEL_THRESHOLD = 60;
const WHEEL_COOLDOWN = 420;
const SWIPE = 40;
const FADE = 200;

/** Règle de la maquette : ≤ 14 caractères → taille pleine ; 15 à 28 → « long » ; au-delà → « xlong » sur deux lignes. */
export const heroTitleSize = (title: string) =>
  title.length > 28 ? "hero-titre--xlong" : title.length > 14 ? "hero-titre--long" : "";

const pad = (n: number) => String(n).padStart(2, "0");

/** Titre et informations d'un film. `heading` : version visible (titre en h2 et lien) ; sinon copie de mesure. */
function HeroText({ item, heading = false }: { item: HeroCarouselItem; heading?: boolean }) {
  const Titre = heading ? "h2" : "div";
  return (
    <>
      <Titre className={cn("hero-titre", heroTitleSize(item.title))}>
        {heading && item.href ? (
          <Link to={item.href} className="decoration-4 underline-offset-8 hover:underline">
            {item.title}
          </Link>
        ) : (
          item.title
        )}
      </Titre>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-semibold md:mt-4 md:text-lg">
        {item.meta?.map((fact) => (
          <React.Fragment key={fact}>
            <span>{fact}</span>
            <span className="size-2 border-2 border-noir bg-jaune" aria-hidden />
          </React.Fragment>
        ))}
        {item.note ? (
          <span className="inline-flex items-center gap-1.5">
            <NoteTuiles value={item.note} size="sm" />
            <span className="text-sm font-semibold">/10</span>
          </span>
        ) : (
          <NoteAbsente className="text-[22px] text-creme" />
        )}
      </p>
    </>
  );
}

export function HeroCarousel({
  items,
  defaultIndex = 0,
  autoplay = false,
  autoplayDelay = 6000,
  renderActions,
  label = "Films à la une",
  className,
}: HeroCarouselProps) {
  const count = items.length;
  const sectionRef = React.useRef<HTMLElement>(null);
  const touchX = React.useRef<number | null>(null);
  const [index, setIndex] = React.useState(defaultIndex);
  // Diapositive réellement affichée : elle rejoint `index` après le fondu de sortie.
  const [shown, setShown] = React.useState(defaultIndex);
  const [fading, setFading] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const reduced = useReducedMotion();

  const go = React.useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  React.useEffect(() => {
    if (index === shown) return;
    if (reduced) {
      setShown(index);
      return;
    }
    setFading(true);
    const id = window.setTimeout(() => {
      setShown(index);
      setFading(false);
    }, FADE);
    return () => window.clearTimeout(id);
  }, [index, shown, reduced]);

  // Le minuteur repart à chaque changement de film, y compris après une action manuelle.
  React.useEffect(() => {
    if (!autoplay || reduced || paused || count < 2) return;
    const id = window.setTimeout(() => go(index + 1), autoplayDelay);
    return () => window.clearTimeout(id);
  }, [autoplay, autoplayDelay, count, go, index, paused, reduced]);

  // Trackpad : uniquement les gestes horizontaux.
  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let acc = 0;
    let until = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (e.timeStamp < until) return;
      acc += e.deltaX;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;
      go(index + Math.sign(acc));
      acc = 0;
      until = e.timeStamp + WHEEL_COOLDOWN;
    };
    section.addEventListener("wheel", onWheel, { passive: false });
    return () => section.removeEventListener("wheel", onWheel);
  }, [go, index]);

  const measureRef = React.useRef<HTMLDivElement>(null);
  const [textHeight, setTextHeight] = React.useState<number>();
  React.useLayoutEffect(() => {
    const box = measureRef.current;
    if (!box) return;
    const blocs = [...box.children];
    const read = () => setTextHeight(Math.ceil(Math.max(0, ...blocs.map((b) => b.getBoundingClientRect().height))));
    read();
    // Se remesure à l'arrivée des polices et au redimensionnement.
    const ro = new ResizeObserver(read);
    blocs.forEach((b) => ro.observe(b));
    return () => ro.disconnect();
  }, [items]);

  const item = items[shown] ?? items[0];
  if (!item) return null;

  const fade = cn("transition-opacity duration-(--duration-lente)", fading && "opacity-0");
  const arrow = "btn btn-icon shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-jaune";

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carrousel"
      aria-label={label}
      className={cn("relative", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if ((e.target as HTMLElement).closest("input, textarea, select")) return;
        e.preventDefault();
        go(index + (e.key === "ArrowRight" ? 1 : -1));
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start === null || end === undefined || Math.abs(end - start) <= SWIPE) return;
        go(index + (end < start ? 1 : -1));
      }}
    >
      {/* 1. L'image : jamais sous le bleu. Seuls des éléments à bordure noire se posent dessus. */}
      <div className="mx-auto max-w-page md:px-gouttiere-lg md:pt-8">
        <div className="zone aspect-[16/9] max-h-[560px] w-full border-y-[3px] border-noir md:border-[3px] md:shadow-dure-bleue">
          {item.backdrop ? (
            <img
              src={item.backdrop}
              srcSet={item.backdropSrcSet}
              sizes="(min-width: 1440px) 1344px, (min-width: 768px) calc(100vw - 96px), 100vw"
              alt=""
              fetchPriority={shown === defaultIndex ? "high" : "auto"}
              decoding="async"
              className={cn("absolute inset-0 size-full object-cover", fade)}
            />
          ) : null}

          {item.credit ? (
            <p className="absolute top-3 left-3 m-0 md:top-6 md:left-6">
              <span className="etiquette">{item.credit}</span>
            </p>
          ) : null}

          <div className="absolute right-3 bottom-3 flex items-center gap-2 md:top-6 md:right-6 md:bottom-auto">
            <span className="index" aria-live="polite">
              <b className="font-normal">{pad(shown + 1)}</b>
              <small>/{pad(count)}</small>
            </span>
            {count > 1 ? (
              <div className="flex" role="group" aria-label="Changer de film">
                <button type="button" className={arrow} onClick={() => go(index - 1)} aria-label="Film précédent">
                  <ChevronLeft className="size-5" strokeWidth={2.6} aria-hidden />
                </button>
                <button type="button" className={cn(arrow, "-ml-0.5")} onClick={() => go(index + 1)} aria-label="Film suivant">
                  <ChevronRight className="size-5" strokeWidth={2.6} aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 2. Le bandeau outremer : la signature, sous l'image, porte le texte. */}
      <div className="border-b-[3px] border-noir bg-outremer text-creme">
        <div className="mx-auto grid max-w-page grid-cols-[96px_1fr] items-end gap-x-4 px-gouttiere pb-6 md:grid-cols-[200px_1fr_auto] md:gap-x-10 md:px-gouttiere-lg md:pb-10">
          <div className="zone -mt-16 aspect-[2/3] origin-bottom-left -rotate-2 border-[3px] border-noir shadow-dure-jaune md:-mt-40">
            {item.poster ? (
              <img
                src={item.poster}
                srcSet={item.posterSrcSet}
                sizes="(min-width: 768px) 200px, 96px"
                alt=""
                decoding="async"
                className={cn("absolute inset-0 size-full object-cover", fade)}
              />
            ) : null}
          </div>

          <div className="relative min-w-0 pt-4 md:pt-7">
            {/* Mesure invisible du titre et des informations de chaque film : le bloc réserve la hauteur du
                plus haut. Sans cela, le bandeau changeait de taille à chaque film (une ou deux lignes de titre)
                et tout le contenu en dessous sautait toutes les 6 secondes. */}
            <div ref={measureRef} aria-hidden className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
              {items.map((it) => (
                <div key={it.id}>
                  <HeroText item={it} />
                </div>
              ))}
            </div>
            <div className={fade} style={{ minHeight: textHeight }}>
              <HeroText item={item} heading />
            </div>
          </div>

          {renderActions ? (
            <div className="col-span-2 mt-5 grid grid-cols-2 gap-3 md:col-span-1 md:col-start-2 md:flex md:gap-3.5">
              {renderActions(item)}
            </div>
          ) : null}

          {count > 1 ? (
            <div
              className="hidden gap-1.5 pb-1 md:col-start-3 md:row-span-2 md:row-start-1 md:flex md:self-end"
              role="group"
              aria-label="Position dans le carrousel"
            >
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  data-on={i === index}
                  onClick={() => go(i)}
                  aria-label={`Aller au film ${i + 1} : ${it.title}`}
                  aria-current={i === index || undefined}
                  className="size-3.5 border-2 border-noir bg-creme data-[on=true]:bg-jaune"
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
