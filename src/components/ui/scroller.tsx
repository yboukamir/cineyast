// Adapté de « Scroller » (diceui) — catalogue 21st.dev.
// Conservé : bords en fondu (mask-image) selon la position de défilement.
// Modifié : horizontal uniquement, sans dépendance Radix, flèches qui avancent
// d'une « page » avec défilement fluide, masquées sur écran tactile.
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollerProps extends React.ComponentProps<"div"> {
  /** Largeur du fondu sur les bords, en px. */
  fade?: number;
  withNavigation?: boolean;
  label?: string;
}

export function Scroller({ className, fade = 48, withNavigation = true, label, style, children, ...props }: ScrollerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ left: false, right: false });

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      el.dataset.fade = left && right ? "both" : left ? "left" : right ? "right" : "none";
      setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const page = (direction: -1 | 1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="group/scroller relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={label ? 0 : undefined}
        style={{ "--fade": `${fade}px`, ...style } as React.CSSProperties}
        className={cn(
          "scrollbar-none overflow-x-auto overscroll-x-contain",
          "data-[fade=left]:[mask-image:linear-gradient(to_right,transparent,#000_var(--fade))]",
          "data-[fade=right]:[mask-image:linear-gradient(to_left,transparent,#000_var(--fade))]",
          "data-[fade=both]:[mask-image:linear-gradient(to_right,transparent,#000_var(--fade),#000_calc(100%-var(--fade)),transparent)]",
          className,
        )}
        {...props}
      >
        {children}
      </div>

      {withNavigation &&
        ([-1, 1] as const).map((direction) => {
          const visible = direction === -1 ? edges.left : edges.right;
          const Icon = direction === -1 ? ChevronLeft : ChevronRight;
          return (
            <button
              key={direction}
              type="button"
              onClick={() => page(direction)}
              aria-label={direction === -1 ? "Faire défiler vers la gauche" : "Faire défiler vers la droite"}
              tabIndex={-1}
              className={cn(
                "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 items-center justify-center border border-line-strong bg-ink/85 text-bone backdrop-blur transition-opacity hover:border-gold hover:text-gold [@media(hover:hover)]:flex",
                direction === -1 ? "left-2" : "right-2",
                visible ? "opacity-0 group-hover/scroller:opacity-100" : "pointer-events-none !opacity-0",
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
    </div>
  );
}
