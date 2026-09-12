import { useId, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { EmptyState } from "@/components/States";
import { NativeSelect } from "@/components/ui/native-select";
import { TicketButton, TicketLink } from "@/components/ui/ticket-button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavorites, type FavoriteMovie } from "@/hooks/useFavorites";

type SortMode = "added" | "title" | "rating" | "year";

const SORTERS: Record<SortMode, (a: FavoriteMovie, b: FavoriteMovie) => number> = {
  added: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title, "fr"),
  rating: (a, b) => b.vote_average - a.vote_average,
  year: (a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""),
};

export default function FavoritesPage() {
  useDocumentTitle("Mes favoris");
  const { favorites, clear } = useFavorites();
  const [sort, setSort] = useState<SortMode>("added");
  const sortId = useId();

  const sorted = useMemo(() => [...favorites].sort(SORTERS[sort]), [favorites, sort]);
  const plural = favorites.length > 1 ? "s" : "";

  return (
    <div className="px-page pt-24 md:pt-28">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="marquee text-xs text-gold">Favoris</p>
          <h1 className="mt-1 font-display text-4xl md:text-6xl">Ma cinémathèque</h1>
          <p className="mt-3 text-sm text-mute">
            {favorites.length ? `${favorites.length} film${plural} gardé${plural} de côté. ` : ""}
            Enregistrés dans ce navigateur, sans compte.
          </p>
        </div>

        {favorites.length ? (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor={sortId} className="marquee text-xs text-mute">
                Trier
              </label>
              <NativeSelect
                id={sortId}
                className="mt-2 w-48"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
              >
                <option value="added">Ajout récent</option>
                <option value="title">Titre (A → Z)</option>
                <option value="rating">Note</option>
                <option value="year">Année de sortie</option>
              </NativeSelect>
            </div>
            <TicketButton
              variant="ghost"
              onClick={() => {
                if (window.confirm("Retirer tous les films de vos favoris ?")) clear();
              }}
            >
              <Trash2 /> Tout retirer
            </TicketButton>
          </div>
        ) : null}
      </header>

      {favorites.length ? (
        <div className="mt-10">
          <MovieGrid movies={sorted} />
        </div>
      ) : (
        <EmptyState title="Votre cinémathèque est vide." className="mt-6">
          Touchez le cœur sur une affiche pour garder un film de côté.
          <div className="mt-6 flex justify-center">
            <TicketLink to="/explorer">Explorer le catalogue</TicketLink>
          </div>
        </EmptyState>
      )}
    </div>
  );
}
