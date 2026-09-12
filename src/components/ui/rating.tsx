// Adapté de « Rating » (haydenbleasel) — catalogue 21st.dev.
// Version lecture seule : étoiles partielles à la décimale près, couleurs de
// la charte (or sur noir), et une étiquette accessible au lieu de 5 icônes muettes.
import { cva, type VariantProps } from "class-variance-authority";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const starVariants = cva("", {
  variants: {
    size: {
      sm: "size-3.5",
      md: "size-4",
      lg: "size-5",
    },
  },
  defaultVariants: { size: "md" },
});

interface RatingProps extends VariantProps<typeof starVariants> {
  /** Note sur `outOf` (TMDB note sur 10). */
  value: number;
  outOf?: number;
  stars?: number;
  label?: string;
  className?: string;
}

export function Rating({ value, outOf = 10, stars = 5, size, label, className }: RatingProps) {
  const filled = Math.max(0, Math.min(stars, (value / outOf) * stars));

  return (
    <div
      role="img"
      aria-label={label ?? `Note ${value.toFixed(1).replace(".", ",")} sur ${outOf}`}
      className={cn("flex items-center gap-0.5", className)}
    >
      {Array.from({ length: stars }, (_, i) => {
        const fill = Math.max(0, Math.min(1, filled - i)) * 100;
        return (
          <span key={i} className="relative" aria-hidden>
            <Star className={cn(starVariants({ size }), "text-bone/15")} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <Star className={cn(starVariants({ size }), "fill-gold text-gold")} strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
