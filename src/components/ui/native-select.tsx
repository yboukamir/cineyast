import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** <select> natif (clavier, lecteurs d'écran et roue iOS/Android gratuits), habillé : bordure 2 px et ombre dure. */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-11 w-full cursor-pointer appearance-none border-2 border-noir bg-blanc pr-10 pl-3 text-[15px] font-semibold text-noir shadow-dure-sm disabled:cursor-not-allowed disabled:border-gris disabled:bg-zone disabled:text-gris disabled:shadow-none"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-[18px] -translate-y-1/2" strokeWidth={2.6} aria-hidden />
    </div>
  );
}
