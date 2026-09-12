// Adapté de « Reveal on hover » (youcefbnm) — catalogue 21st.dev.
// Ajout : le panneau se révèle aussi au focus clavier (focus-within), pas
// seulement au survol souris.
import * as React from "react";
import { cn } from "@/lib/utils";

const RevealContext = React.createContext(false);

export function CardHoverReveal({ className, ...props }: React.ComponentProps<"div">) {
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  return (
    <RevealContext.Provider value={hovered || focused}>
      <div
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
        }}
        {...props}
      />
    </RevealContext.Provider>
  );
}

export function CardHoverRevealMain({
  className,
  style,
  hoverScale = 1.05,
  ...props
}: React.ComponentProps<"div"> & { hoverScale?: number }) {
  const active = React.useContext(RevealContext);
  return (
    <div
      className={cn("size-full transition-transform duration-500 ease-cine", className)}
      style={{ transform: `scale(${active ? hoverScale : 1})`, ...style }}
      {...props}
    />
  );
}

export function CardHoverRevealContent({ className, style, ...props }: React.ComponentProps<"div">) {
  const active = React.useContext(RevealContext);
  return (
    <div
      aria-hidden={!active}
      className={cn("absolute transition-all duration-500 ease-cine", className)}
      style={{ translate: active ? "0 0" : "0 110%", opacity: active ? 1 : 0, ...style }}
      {...props}
    />
  );
}
