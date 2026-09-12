// Adapté de « Selector Chips » (preetsuthar17) — catalogue 21st.dev.
// Changements : composant contrôlé et générique (valeur ≠ libellé), plus
// d'animation de largeur (19 genres qui changent de taille = mise en page qui
// saute), rôle checkbox pour les lecteurs d'écran, couleurs de la charte.
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectorChipsProps<T extends string | number> {
  options: ChipOption<T>[];
  value: T[];
  onChange: (next: T[]) => void;
  className?: string;
  "aria-label"?: string;
}

const COLORS = {
  on: { backgroundColor: "rgba(143, 29, 29, 1)", borderColor: "rgba(181, 42, 37, 1)", color: "rgba(239, 230, 212, 1)" },
  off: { backgroundColor: "rgba(143, 29, 29, 0)", borderColor: "rgba(232, 215, 180, 0.18)", color: "rgba(166, 157, 140, 1)" },
};

export function SelectorChips<T extends string | number>({
  options,
  value,
  onChange,
  className,
  ...aria
}: SelectorChipsProps<T>) {
  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <div role="group" className={cn("flex flex-wrap gap-2", className)} {...aria}>
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <motion.button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => toggle(option.value)}
            initial={false}
            animate={selected ? COLORS.on : COLORS.off}
            transition={{ duration: 0.15 }}
            className="flex h-9 cursor-pointer items-center border px-3 font-sans text-sm hover:!text-bone"
          >
            <span>{option.label}</span>
            <motion.span
              initial={false}
              animate={{ width: selected ? 16 : 0, marginLeft: selected ? 6 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex items-center overflow-hidden"
              aria-hidden
            >
              <AnimatePresence>
                {selected && (
                  <motion.svg
                    key="tick"
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <motion.path
                      d="M5 10.5L9 14.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
