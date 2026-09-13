// Adapté de « Scroller » (diceui) — catalogue 21st.dev.
// Conservé : la détection des bords selon la position de défilement et l'avance « page par page ».
// Refonte « L'Affiche » : plus de fondu ni de flèches superposées au contenu. Les flèches se
// placent là où la maquette les veut (en-tête de rangée) et se désactivent en bout de course.
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** `deps` : à fournir quand le conteneur défilant apparaît ou change de contenu après le premier rendu. */
export function useScroller<T extends HTMLElement>(deps: React.DependencyList = []) {
  const ref = React.useRef<T>(null);
  const [edges, setEdges] = React.useState({ atStart: true, atEnd: true });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setEdges((prev) => (prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }));
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  const page = React.useCallback((direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduced ? "auto" : "smooth" });
  }, []);

  return { ref, ...edges, page };
}

interface ScrollerArrowsProps {
  atStart: boolean;
  atEnd: boolean;
  page: (direction: -1 | 1) => void;
  className?: string;
}

/** Flèches de rangée, réservées au desktop : au doigt, la rangée défile directement. */
export function ScrollerArrows({ atStart, atEnd, page, className }: ScrollerArrowsProps) {
  const arrow = "btn btn-icon shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-jaune";
  return (
    <div role="group" aria-label="Faire défiler la rangée" className={cn("hidden md:flex", className)}>
      <button type="button" className={arrow} onClick={() => page(-1)} disabled={atStart} aria-label="Précédent">
        <ChevronLeft className="size-5" strokeWidth={2.6} aria-hidden />
      </button>
      <button type="button" className={cn(arrow, "-ml-0.5")} onClick={() => page(1)} disabled={atEnd} aria-label="Suivant">
        <ChevronRight className="size-5" strokeWidth={2.6} aria-hidden />
      </button>
    </div>
  );
}

/** Conteneur défilant simple, sans flèches. */
export function Scroller({ className, label, children, ...props }: React.ComponentProps<"div"> & { label?: string }) {
  const { ref } = useScroller<HTMLDivElement>();
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={label ? 0 : undefined}
      className={cn("scrollbar-none overflow-x-auto overscroll-x-contain", className)}
      {...props}
    >
      {children}
    </div>
  );
}
