import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** <select> natif (clavier, lecteurs d'écran et roue iOS/Android gratuits) habillé à la charte. */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-11 w-full cursor-pointer appearance-none border border-line-strong bg-ink-2 pr-9 pl-3 text-base text-bone transition-[border-color,box-shadow] focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/20 focus-visible:outline-none md:text-sm"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-mute" aria-hidden />
    </div>
  );
}
