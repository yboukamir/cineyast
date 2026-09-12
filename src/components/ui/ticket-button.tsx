// Adapté de « Movie Pass Button » (radiumcoders) — catalogue 21st.dev.
// L'original simule les encoches avec des pastilles couleur de fond, ce qui ne
// marche que sur un fond uni. Ici les coins sont réellement découpés par un
// masque CSS : le ticket reste propre posé sur une affiche ou un backdrop.
import * as React from "react";
import { Link, type LinkProps } from "react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const NOTCH = "radial-gradient(circle at var(--at), transparent 7px, #000 7.5px)";

const ticketStyle: React.CSSProperties = {
  maskImage: ["top left", "top right", "bottom left", "bottom right"]
    .map((at) => NOTCH.replace("var(--at)", at))
    .join(", "),
  maskSize: "51% 51%",
  maskPosition: "top left, top right, bottom left, bottom right",
  maskRepeat: "no-repeat",
};

export const ticketVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "marquee text-sm transition-[transform,background-color,color] duration-100 active:scale-95",
    // Le masque rogne aussi l'outline : on dessine le focus à l'intérieur.
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bone",
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        gold: "bg-gold text-ink hover:bg-gold-bright",
        velvet: "bg-velvet text-bone hover:bg-velvet-bright",
        ghost: "bg-bone/10 text-bone backdrop-blur-md hover:bg-bone/20",
      },
      size: {
        md: "h-11 px-6",
        sm: "h-9 px-4 text-xs",
      },
    },
    defaultVariants: { variant: "gold", size: "md" },
  },
);

type Variants = VariantProps<typeof ticketVariants>;

export function TicketButton({
  className,
  variant,
  size,
  style,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & Variants) {
  return (
    <button
      type={type}
      className={cn(ticketVariants({ variant, size }), className)}
      style={{ ...ticketStyle, ...style }}
      {...props}
    />
  );
}

export function TicketLink({ className, variant, size, style, ...props }: LinkProps & Variants) {
  return (
    <Link className={cn(ticketVariants({ variant, size }), className)} style={{ ...ticketStyle, ...style }} {...props} />
  );
}

export function TicketAnchor({ className, variant, size, style, ...props }: React.ComponentProps<"a"> & Variants) {
  return (
    <a className={cn(ticketVariants({ variant, size }), className)} style={{ ...ticketStyle, ...style }} {...props} />
  );
}
