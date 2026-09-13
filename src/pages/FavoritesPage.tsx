import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { Heart, Trash2 } from "lucide-react";
import { MovieGrid } from "@/components/movie/MovieGrid";
import { NativeSelect } from "@/components/ui/native-select";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavorites, type FavoriteMovie } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

const PAGE = "mx-auto max-w-page px-gouttiere md:px-gouttiere-lg";

type SortMode = "added" | "title" | "rating";

const SORTERS: Record<SortMode, (a: FavoriteMovie, b: FavoriteMovie) => number> = {
  added: (a, b) => b.addedAt - a.addedAt,
  title: (a, b) => a.title.localeCompare(b.title, "fr"),
  rating: (a, b) => b.vote_average - a.vote_average,
};

export default function FavoritesPage() {
  useDocumentTitle("Mes favoris");
  const { favorites, clear } = useFavorites();
  const [sort, setSort] = useState<SortMode>("added");
  const sortId = useId();

  const sorted = useMemo(() => [...favorites].sort(SORTERS[sort]), [favorites, sort]);
  const total = favorites.length;
  const plural = total > 1 ? "s" : "";

  return (
    <>
      <section aria-labelledby="favoris-titre" className="border-b-[3px] border-noir bg-outremer text-creme">
        <div className={cn(PAGE, "py-8 md:py-10")}>
          <h1 id="favoris-titre" className="hero-titre !text-[44px] md:!text-d-lg">
            Favoris
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[15px] md:text-lg">
            {total ? (
              <>
                <span className="tuiles tuiles-sm" aria-hidden>
                  {[...String(total)].map((digit, i) => (
                    <b key={i}>{digit}</b>
                  ))}
                </span>
                <span>
                  <span className="sr-only">{total} </span>
                  film{plural} gardé{plural} de côté.
                </span>
              </>
            ) : null}
            <span>Enregistrés dans ce navigateur, sans compte.</span>
          </p>
        </div>
      </section>

      {total ? (
        <div className={cn(PAGE, "pt-8")}>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="w-full max-w-56">
              <label htmlFor={sortId} className="surtitre mb-2 block">
                Trier
              </label>
              <NativeSelect id={sortId} value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
                <option value="added">Ajout récent</option>
                <option value="title">Titre (A → Z)</option>
                <option value="rating">Note</option>
              </NativeSelect>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                if (window.confirm("Retirer tous les films de vos favoris ?")) clear();
              }}
            >
              <Trash2 className="size-[18px]" strokeWidth={2.4} aria-hidden />
              Tout retirer
            </button>
          </div>
          <MovieGrid movies={sorted} />
        </div>
      ) : (
        <div className={cn(PAGE, "pt-10")}>
          {/* Seul état vide pleine page et centré du site. */}
          <div className="mx-auto flex max-w-xl flex-col items-center border-[3px] border-noir px-6 py-12 text-center md:py-16">
            <Heart className="size-12" strokeWidth={2.2} aria-hidden />
            <p className="mt-5 font-display text-d-md">Aucun favori pour le moment</p>
            <p className="mt-2 text-gris">Le cœur sur une affiche l'ajoute ici.</p>
            <Link to="/explorer" className="btn btn-primary mt-8">
              Explorer le catalogue
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
