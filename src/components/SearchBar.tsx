// Composition reprise de la démo « Search input with icon and button » (originui, 21st.dev),
// complétée d'un bouton d'effacement.
import { useId, type Ref } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Rechercher un film…",
  label = "Rechercher un film par titre",
  autoFocus,
  className,
  inputClassName,
  inputRef,
}: SearchBarProps) {
  const id = useId();

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
        className={cn("peer ps-10 pe-20", inputClassName)}
      />
      <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3.5 text-mute transition-colors peer-focus-visible:text-gold">
        <Search className="size-4" aria-hidden />
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute inset-y-0 end-10 flex w-9 items-center justify-center text-mute transition-colors hover:text-bone"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
      <button
        type="submit"
        aria-label="Lancer la recherche"
        className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-mute transition-colors hover:text-gold"
      >
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
}
