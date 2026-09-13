import { score } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Note TMDB composée en tuiles de fronton : chaque chiffre sur une tuile noire.
 * La valeur est donnée en toutes lettres aux lecteurs d'écran, jamais portée par l'image seule.
 */
export function NoteTuiles({ value, size = "xs", className }: { value: number; size?: "xs" | "sm" | "lg"; className?: string }) {
  const text = score(value);
  return (
    <span role="img" aria-label={`Note ${text} sur 10`} className={cn("tuiles", `tuiles-${size}`, className)}>
      {[...text].map((char, i) => (
        <b key={i} aria-hidden className={char === "," ? "v" : undefined}>
          {char}
        </b>
      ))}
    </span>
  );
}

export function NoteAbsente({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="Note indisponible" className={cn("font-display text-[20px] leading-none text-gris", className)}>
      —
    </span>
  );
}
