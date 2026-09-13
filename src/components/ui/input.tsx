// Adapté de « Input » (originui) — catalogue 21st.dev.
// Refonte « L'Affiche » : le cadre (bordure, ombre dure, enfoncement au focus) est porté par le
// formulaire de recherche ; le champ reste nu, avec le bouton d'effacement natif de type="search".
import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "min-w-0 bg-transparent font-medium text-noir placeholder:text-gris focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:text-gris",
        className,
      )}
      {...props}
    />
  );
}
