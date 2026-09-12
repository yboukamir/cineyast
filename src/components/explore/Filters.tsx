import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { Rating } from "@/components/ui/rating";
import { SelectorChips } from "@/components/ui/selector-chips";
import { score } from "@/lib/format";
import type { CatalogFilters, Genre, SortKey } from "@/lib/tmdb";

export const SORT_OPTIONS: { slug: string; value: SortKey; label: string }[] = [
  { slug: "popularite", value: "popularity.desc", label: "Popularité" },
  { slug: "note", value: "vote_average.desc", label: "Mieux notés" },
  { slug: "recent", value: "primary_release_date.desc", label: "Sorties récentes" },
  { slug: "recettes", value: "revenue.desc", label: "Box-office" },
];

const FIRST_YEAR = 1900;
const YEARS = Array.from({ length: new Date().getFullYear() + 2 - FIRST_YEAR }, (_, i) => new Date().getFullYear() + 1 - i);

interface FiltersProps {
  filters: CatalogFilters;
  genres: Genre[] | undefined;
  searchMode: boolean;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onReset: () => void;
  activeCount: number;
}

export function Filters({ filters, genres, searchMode, onChange, onReset, activeCount }: FiltersProps) {
  const ids = { sort: useId(), year: useId(), rating: useId(), genres: useId() };

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor={ids.sort} className="marquee text-xs text-mute">
          Trier par
        </label>
        <NativeSelect
          id={ids.sort}
          className="mt-2"
          value={filters.sort}
          disabled={searchMode}
          onChange={(e) => onChange({ sort: e.target.value as SortKey })}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
        {searchMode ? <p className="mt-2 text-xs text-mute">Pendant une recherche, les films sont classés par pertinence.</p> : null}
      </div>

      <div>
        <label htmlFor={ids.year} className="marquee text-xs text-mute">
          Année de sortie
        </label>
        <NativeSelect
          id={ids.year}
          className="mt-2"
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

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor={ids.rating} className="marquee text-xs text-mute">
            Note minimale
          </label>
          <span className="font-display text-lg text-gold" aria-hidden>
            {filters.minRating ? `${score(filters.minRating)}+` : "Toutes"}
          </span>
        </div>
        <input
          id={ids.rating}
          type="range"
          min={0}
          max={9}
          step={0.5}
          value={filters.minRating}
          onChange={(e) => onChange({ minRating: Number(e.target.value) })}
          aria-valuetext={filters.minRating ? `${score(filters.minRating)} sur 10 minimum` : "Toutes les notes"}
          className="mt-3 w-full cursor-pointer accent-[var(--color-gold)]"
        />
        <Rating value={filters.minRating} size="sm" className="mt-2" label={`Note minimale : ${filters.minRating} sur 10`} />
      </div>

      <div>
        <p id={ids.genres} className="marquee text-xs text-mute">
          Genres
        </p>
        <p className="mt-1 text-xs text-mute/80">Les films doivent combiner tous les genres cochés.</p>
        {genres ? (
          <SelectorChips
            aria-labelledby={ids.genres}
            className="mt-3"
            options={genres.map((g) => ({ value: g.id, label: g.name }))}
            value={filters.genres}
            onChange={(next) => onChange({ genres: next })}
          />
        ) : (
          <div className="mt-3 flex flex-wrap gap-2" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="skeleton h-9 w-20" />
            ))}
          </div>
        )}
      </div>

      {activeCount > 0 ? (
        <button
          type="button"
          onClick={onReset}
          className="marquee inline-flex items-center gap-2 text-xs text-mute transition-colors hover:text-gold"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Réinitialiser les filtres
        </button>
      ) : null}
    </div>
  );
}
