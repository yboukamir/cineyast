// Adapté de « Rating » (haydenbleasel) — catalogue 21st.dev.
// Conservé : lecture seule, étoiles partielles à la décimale près, une seule étiquette accessible
// au lieu de cinq icônes muettes.
// Refonte « L'Affiche » : étoile jaune à contour noir sur fond filet. `decorative` masque les
// étoiles aux lecteurs d'écran quand la note est déjà donnée à côté (tuiles).
import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const starVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
    },
  },
  defaultVariants: { size: "lg" },
});

interface RatingProps extends VariantProps<typeof starVariants> {
  /** Note sur `outOf` (TMDB note sur 10). */
  value: number;
  outOf?: number;
  stars?: number;
  label?: string;
  decorative?: boolean;
  className?: string;
}

export function Rating({ value, outOf = 10, stars = 5, size, label, decorative = false, className }: RatingProps) {
  const filled = Math.max(0, Math.min(stars, (value / outOf) * stars));
  const star = cn(starVariants({ size }));

  return (
    <span
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": label ?? `Note ${value.toFixed(1).replace(".", ",")} sur ${outOf}` })}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: stars }, (_, i) => {
        const fill = Math.max(0, Math.min(1, filled - i)) * 100;
        return (
          <span key={i} className="relative inline-block text-filet" aria-hidden>
            <Star className={star} fill="currentColor" stroke="#111111" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden text-jaune" style={{ width: `${fill}%` }}>
              <Star className={star} fill="currentColor" stroke="#111111" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}
