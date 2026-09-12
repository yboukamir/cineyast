import { cn } from "@/lib/utils";

/** Bobine de film — même dessin que le favicon. */
export function ReelMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-7", className)}>
      <circle cx="24" cy="24" r="22" fill="var(--color-gold)" />
      <g fill="var(--color-ink)">
        <circle cx="35" cy="24" r="5.2" />
        <circle cx="29.5" cy="33.5" r="5.2" />
        <circle cx="18.5" cy="33.5" r="5.2" />
        <circle cx="13" cy="24" r="5.2" />
        <circle cx="18.5" cy="14.5" r="5.2" />
        <circle cx="29.5" cy="14.5" r="5.2" />
      </g>
      <circle cx="24" cy="24" r="2.6" fill="var(--color-velvet-bright)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ReelMark />
      <span className="font-display text-[1.35rem] leading-none font-semibold tracking-tight">
        Cine<span className="italic text-gold">yast</span>
      </span>
    </span>
  );
}
