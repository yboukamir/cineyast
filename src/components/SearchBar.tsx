// Composition reprise de la démo « Search input with icon » (originui, 21st.dev).
// Refonte « L'Affiche » : cadre noir 2 px et ombre dure ; au focus, le champ s'enfonce
// et prend le contour outremer. Entrée lance la recherche.
import { useId, type Ref } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
  /** Affiche l'indice du raccourci clavier « / ». */
  shortcut?: boolean;
  className?: string;
  inputClassName?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Rechercher un film…",
  label = "Rechercher un film",
  autoFocus,
  shortcut = false,
  className,
  inputClassName,
  inputRef,
}: SearchBarProps) {
  const id = useId();

  return (
    <form
      role="search"
      className={cn(
        // text-noir : la loupe hérite de currentColor et resterait crème, donc invisible, sur le bandeau outremer.
        "flex h-12 items-center gap-2.5 border-2 border-noir bg-blanc px-3.5 text-noir shadow-dure-sm",
        "transition-[transform,box-shadow] duration-(--duration-vite)",
        "focus-within:translate-x-0.5 focus-within:translate-y-0.5 focus-within:shadow-none",
        "has-[input:focus-visible]:outline-[3px] has-[input:focus-visible]:outline-offset-[3px] has-[input:focus-visible]:outline-outremer has-[input:focus-visible]:outline-solid",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value.trim());
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="size-[18px] shrink-0" strokeWidth={2.4} aria-hidden />
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
        className={cn("h-full flex-1", inputClassName)}
      />
      {shortcut ? (
        <kbd aria-hidden className="border-2 border-filet px-1.5 py-0.5 text-xs font-bold text-gris">
          /
        </kbd>
      ) : null}
    </form>
  );
}
