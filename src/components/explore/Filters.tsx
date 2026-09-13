import { useId } from "react";
import { RotateCw } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { numeroDeSalle } from "@/lib/salles";
import type { CatalogFilters, Genre, SortKey } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

export const SORT_OPTIONS: { slug: string; value: SortKey; label: string }[] = [
  { slug: "popularite", value: "popularity.desc", label: "Popularité" },
  { slug: "note", value: "vote_average.desc", label: "Mieux notés" },
  { slug: "recent", value: "primary_release_date.desc", label: "Sorties récentes" },
  { slug: "recettes", value: "revenue.desc", label: "Box-office" },
];

const FIRST_YEAR = 1900;
const YEARS = Array.from({ length: new Date().getFullYear() + 2 - FIRST_YEAR }, (_, i) => new Date().getFullYear() + 1 - i);
/** Note minimale en tuiles : 0 = toutes les notes. */
const NOTES = [0, 5, 6, 7, 8, 9];

interface FiltersProps {
  filters: CatalogFilters;
  genres: Genre[] | undefined;
  searchMode: boolean;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
  activeCount: number;
}

export function Filters({ filters, genres, searchMode, onChange, onReset, activeCount }: FiltersProps) {
  const ids = { sort: useId(), year: useId(), note: useId(), sortHelp: useId() };
  const toggleGenre = (id: number) =>
    onChange({ genres: filters.genres.includes(id) ? filters.genres.filter((g) => g !== id) : [...filters.genres, id] });

  return (
    <div className="grid gap-6 border-[3px] border-noir bg-creme p-4 md:p-6">
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="surtitre mb-1 p-0">Genres</legend>
        <p className="mb-3 text-sm text-gris">Les films doivent combiner toutes les salles choisies.</p>
        {genres ? (
          <div className="flex flex-wrap gap-3">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className="plaque"
                aria-pressed={filters.genres.includes(genre.id)}
                onClick={() => toggleGenre(genre.id)}
              >
                <span className="plaque-n" aria-hidden>
                  {numeroDeSalle(genres, genre.id)}
                </span>
                <span className="plaque-t">{genre.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="squelette h-11 w-28" />
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-6 md:grid-cols-[minmax(0,14rem)_auto_minmax(0,14rem)] md:items-start md:gap-10">
        <div>
          <label htmlFor={ids.year} className="surtitre mb-2 block">
            Année de sortie
          </label>
          <NativeSelect
            id={ids.year}
            value={filters.year ?? ""}
            onChange={(e) => onChange({ year: e.target.value ? Number(e.target.value) : undefined })}
          >
            <option value="">Toutes les années</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </NativeSelect>
        </div>

        <fieldset className="m-0 border-0 p-0">
          <legend className="surtitre mb-2 p-0">Note minimale</legend>
          <div className="flex flex-wrap gap-2">
            {NOTES.map((note) => (
              <label key={note} className="cursor-pointer">
                <input
                  type="radio"
                  name={ids.note}
                  className="peer sr-only"
                  checked={filters.minRating === note}
                  onChange={() => onChange({ minRating: note })}
                />
                <span
                  className={cn(
                    "grid h-11 min-w-11 place-items-center border-2 border-noir bg-creme transition-colors duration-(--duration-vite) hover:bg-jaune",
                    "peer-checked:bg-noir peer-checked:text-creme",
                    "peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-outremer peer-focus-visible:outline-solid",
                    note ? "px-2 pt-1 font-display text-[26px] leading-none" : "px-3 text-[15px] font-semibold",
                  )}
                >
                  {note ? (
                    <>
                      {note}
                      <span className="sr-only"> et plus sur 10</span>
                    </>
                  ) : (
                    "Toutes"
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={ids.sort} className="surtitre mb-2 block">
            Trier par
          </label>
          <NativeSelect
            id={ids.sort}
            value={filters.sort}
            disabled={searchMode}
            aria-describedby={searchMode ? ids.sortHelp : undefined}
            onChange={(e) => onChange({ sort: e.target.value as SortKey })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
          {searchMode ? (
            <p id={ids.sortHelp} className="mt-2 text-sm text-gris">
              Pendant une recherche, les films sont classés par pertinence.
            </p>
          ) : null}
        </div>
      </div>

      {activeCount > 0 ? (
        <button type="button" onClick={onReset} className="btn btn-sm justify-self-start">
          <RotateCw className="size-[18px]" strokeWidth={2.4} aria-hidden />
          Réinitialiser les filtres
        </button>
      ) : null}
    </div>
  );
}
