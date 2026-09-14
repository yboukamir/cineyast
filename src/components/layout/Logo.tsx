import { cn } from "@/lib/utils";

/** Mot-symbole : « Cinéyast » en Bebas Neue, souligné d'un trait jaune légèrement incliné. */
export function Wordmark({ variant = "entete", className }: { variant?: "entete" | "pied"; className?: string }) {
  const pied = variant === "pied";
  return (
    <span
      className={cn(
        "relative isolate inline-block px-2 py-0.5 font-display leading-none tracking-[.02em]",
        pied ? "text-[36px]" : "text-d-sm md:text-[40px]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-1/2 -z-10 -rotate-[1.5deg] bg-jaune", pied ? "h-3.5" : "h-3 md:h-4")}
      />
      Cinéyast
    </span>
  );
}
