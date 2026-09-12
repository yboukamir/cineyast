// Adapté de « Input » (originui) — catalogue 21st.dev.
import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full border border-line-strong bg-ink-2/80 px-3 text-base text-bone transition-[border-color,box-shadow] placeholder:text-mute/70 md:text-sm",
        "focus-visible:border-gold focus-visible:ring-[3px] focus-visible:ring-gold/20 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        type === "search" &&
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}
