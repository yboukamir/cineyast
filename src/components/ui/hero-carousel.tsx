// Adapté de « Hero Carousel » (crafterui) — catalogue 21st.dev.
//
// Conservé : la pellicule dont la carte active se déploie pleine hauteur, le
// fond qui bascule sur l'image active, le titre qui remonte ligne à ligne, la
// géométrie entièrement proportionnelle à la scène (ResizeObserver).
// Modifié pour Cineyast :
//  - affiche (portrait 2:3) dans la pellicule, backdrop paysage en fond ;
//  - pas d'étalonnage colorimétrique : on respecte la photo du film ;
//  - la molette VERTICALE fait défiler la page, seul le geste horizontal
//    (trackpad) fait avancer la pellicule — plus de piège au scroll ;
//  - clic sur la carte active = ouverture de la fiche ; un glisser ne compte pas comme clic ;
//  - lecture automatique désactivée si l'utilisateur préfère réduire les animations.
import * as React from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface HeroCarouselItem {
  id: string | number;
  title: string;
  /** Image paysage affichée en plein fond. */
  backdrop: string;
  backdropSrcSet?: string;
  /** Affiche portrait affichée dans la pellicule. */
  image: string;
  href?: string;
  /** Petite ligne au-dessus du titre, ex. « N°1 des tendances ». */
  credit?: string;
  meta?: string[];
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

/* Proportions, toutes relatives à la scène. */
const CARD_H = 0.27; // hauteur de la carte active ÷ hauteur de scène
const CARD_AR = 2 / 3; // affiche de cinéma
const GAP = 0.08; // espace ÷ largeur de carte
const STRIP_TOP = 0.58; // bord supérieur commun de la pellicule
const TITLE = 0.068; // corps du titre ÷ hauteur de scène
const LABEL = 0.016; // libellés ÷ hauteur de scène
const PAD = 0.045; // gouttière ÷ largeur de scène
const RAIL = 0.2; // largeur de la barre de progression ÷ largeur de scène

const WHEEL_THRESHOLD = 60;
const WHEEL_COOLDOWN = 420;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function HeroCarousel({
  items,
  defaultIndex = 0,
  autoplay = false,
  autoplayDelay = 7000,
  renderActions,
  label = "Films à la une",
  className,
}: HeroCarouselProps) {
  const navigate = useNavigate();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const draggedRef = React.useRef(false);
  const [box, setBox] = React.useState({ w: 0, h: 0 });
  const [current, setCurrent] = React.useState(defaultIndex);
  const [dragging, setDragging] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const reduced = useReducedMotion();

  const last = items.length - 1;
  const index = clamp(current, 0, Math.max(0, last));
  const go = React.useCallback((next: number) => setCurrent(clamp(next, 0, Math.max(0, last))), [last]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const read = () => setBox({ w: stage.clientWidth, h: stage.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const fullH = clamp(box.h * CARD_H, 120, 340);
  const halfH = fullH / 2;
  const cardW = fullH * CARD_AR;
  const gap = Math.max(6, Math.round(cardW * GAP));
  const step = cardW + gap;
  const pad = Math.max(20, Math.round(box.w * PAD));
  const labelSize = clamp(Math.round(box.h * LABEL), 11, 14);
  const titleSize = Math.max(30, Math.round(Math.min(box.h * TITLE, box.w * 0.1)));

  // La pellicule glisse pour centrer la carte active.
  const xFor = React.useCallback((i: number) => box.w / 2 - (i * step + cardW / 2), [box.w, step, cardW]);
  const x = useMotionValue(0);
  const target = xFor(index);

  const spring = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 260, damping: 34, mass: 0.9 };

  React.useEffect(() => {
    if (dragging) return;
    const run = animate(x, target, spring);
    return () => run.stop();
  }, [target, dragging, reduced, x]); // eslint-disable-line react-hooks/exhaustive-deps

  // Trackpad : uniquement les gestes horizontaux.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let acc = 0;
    let until = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      const stuck = (e.deltaX > 0 && index === last) || (e.deltaX < 0 && index === 0);
      if (stuck) return;
      e.preventDefault();
      if (e.timeStamp < until) return;
      acc += e.deltaX;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;
      go(index + Math.sign(acc));
      acc = 0;
      until = e.timeStamp + WHEEL_COOLDOWN;
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [go, index, last]);

  React.useEffect(() => {
    if (!autoplay || reduced || paused || dragging || items.length < 2) return;
    const id = window.setTimeout(() => go(index === last ? 0 : index + 1), autoplayDelay);
    return () => window.clearTimeout(id);
  }, [autoplay, autoplayDelay, dragging, go, index, items.length, last, paused, reduced]);

  const active = items[index];
  if (!active) return null;

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carrousel"
      aria-label={label}
      onKeyDown={(e) => {
        const keys: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: last };
        if (!(e.key in keys) || e.target !== e.currentTarget) return;
        e.preventDefault();
        go(keys[e.key]!);
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "relative w-full overflow-hidden bg-ink text-bone select-none",
        "outline-none focus-visible:ring-1 focus-visible:ring-gold/60 focus-visible:ring-inset",
        className,
      )}
    >
      {/* ── Fond : backdrop du film actif, lent travelling avant ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={active.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, ease: "easeOut" }}
        >
          <motion.img
            src={active.backdrop}
            srcSet={active.backdropSrcSet}
            sizes="100vw"
            alt=""
            aria-hidden
            draggable={false}
            fetchPriority={index === defaultIndex ? "high" : "auto"}
            className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
            initial={{ scale: reduced ? 1.02 : 1.1 }}
            animate={{ scale: 1.02 }}
            transition={reduced ? { duration: 0 } : { duration: 9, ease: "linear" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Voiles de lisibilité : noir chaud à gauche et en bas, fondu vers la page. */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(12_10_9/0.92)_0%,rgb(12_10_9/0.55)_45%,transparent_80%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/60" />

      {/* ── Titre, au-dessus du bord commun de la pellicule ── */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col justify-end"
        style={{ height: `${STRIP_TOP * 100}%`, paddingLeft: pad, paddingRight: pad, paddingBottom: Math.round(box.h * 0.035) }}
      >
        <div className="max-w-3xl" aria-live="off">
          {active.credit ? (
            <motion.p
              key={`credit-${active.id}`}
              className="marquee mb-3 text-gold"
              style={{ fontSize: labelSize }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {active.credit}
            </motion.p>
          ) : null}

          <AnimatePresence mode="wait" initial={false}>
            <motion.h2
              key={active.id}
              className="font-display leading-[0.95] font-medium tracking-[-0.01em]"
              style={{ fontSize: titleSize }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="line-clamp-3 block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                >
                  {active.href ? (
                    <Link to={active.href} draggable={false} className="hover:text-gold-bright">
                      {active.title}
                    </Link>
                  ) : (
                    active.title
                  )}
                </motion.span>
              </span>
            </motion.h2>
          </AnimatePresence>

          {active.meta?.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
              {active.meta.map((fact, i) => (
                <motion.span
                  key={`${active.id}-${fact}`}
                  className="marquee whitespace-nowrap text-bone/80"
                  style={{ fontSize: labelSize }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.45, delay: 0.12 + i * 0.06 }}
                >
                  {fact}
                </motion.span>
              ))}
            </div>
          ) : null}

          {renderActions ? <div className="mt-5 flex flex-wrap gap-3">{renderActions(active)}</div> : null}
        </div>
      </div>

      {/* ── La pellicule : bord supérieur commun, carte active deux fois plus haute ── */}
      <div className="absolute inset-x-0" style={{ top: `${STRIP_TOP * 100}%`, height: fullH }}>
        <motion.div
          className="flex items-start"
          style={{ gap, x, cursor: dragging ? "grabbing" : "grab" }}
          drag="x"
          dragMomentum={false}
          dragElastic={0.08}
          dragConstraints={{ left: xFor(last), right: xFor(0) }}
          onDragStart={() => {
            draggedRef.current = true;
            setDragging(true);
          }}
          onDragEnd={(_, info) => {
            setDragging(false);
            const thrown = x.get() + info.velocity.x * 0.12;
            go(Math.round((box.w / 2 - thrown - cardW / 2) / step));
            // Le clic natif arrive juste après : on l'ignore.
            window.setTimeout(() => (draggedRef.current = false), 0);
          }}
        >
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              aria-label={i === index ? `Ouvrir la fiche : ${item.title}` : `Afficher : ${item.title}`}
              aria-current={i === index}
              onClick={() => {
                if (draggedRef.current) return;
                if (i === index && item.href) navigate(item.href);
                else go(i);
              }}
              className="relative shrink-0 overflow-hidden bg-ink-2 ring-1 ring-line ring-inset"
              style={{ width: cardW }}
              animate={{ height: i === index ? fullH : halfH }}
              transition={spring}
            >
              <img
                src={item.image}
                alt=""
                draggable={false}
                loading={Math.abs(i - index) <= 4 ? "eager" : "lazy"}
                decoding="async"
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 18%" }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-ink"
                animate={{ opacity: i === index ? 0 : 0.35 }}
                transition={spring}
              />
              {i === index ? <span aria-hidden className="absolute inset-0 ring-1 ring-gold/70 ring-inset" /> : null}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── Compteur / barre de progression ── */}
      <div className="absolute" style={{ left: pad, bottom: Math.max(16, box.h * 0.03), width: Math.max(140, box.w * RAIL) }}>
        <div className="marquee flex justify-between tabular-nums text-bone/70" style={{ fontSize: labelSize }}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{String(items.length).padStart(2, "0")}</span>
        </div>
        <div className="relative mt-2 h-px w-full bg-bone/20">
          <motion.div
            className="absolute inset-y-0 bg-gold"
            style={{ width: `${100 / items.length}%` }}
            animate={{ left: `${(index / items.length) * 100}%` }}
            transition={spring}
          />
        </div>
      </div>
    </div>
  );
}
