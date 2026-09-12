import { useMemo } from "react";
import { Link } from "react-router";
import { Heart } from "lucide-react";
import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel";
import { TicketButton, TicketLink } from "@/components/ui/ticket-button";
import { MovieRow, type MovieRowProps } from "@/components/movie/MovieRow";
import { ErrorState } from "@/components/States";
import { useGenres, useMovieList, useTrending, type ListKind } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavorites } from "@/hooks/useFavorites";
import { useInView } from "@/hooks/useInView";
import { releaseYear, score } from "@/lib/format";
import { movieHref } from "@/lib/slug";
import { backdropSrcSet, backdropUrl, posterUrl, type MovieSummary } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

const HERO_HEIGHT = "h-[82svh] min-h-[34rem] max-h-[58rem]";

export default function HomePage() {
  useDocumentTitle();
  const trendingWeek = useTrending("week");
  const trendingDay = useTrending("day");
  const genres = useGenres();

  const genreNames = useMemo(() => new Map(genres.data?.map((g) => [g.id, g.name])), [genres.data]);

  const featured = useMemo(
    () => (trendingWeek.data?.results ?? []).filter((m) => m.backdrop_path && m.poster_path).slice(0, 10),
    [trendingWeek.data],
  );

  const heroItems: HeroCarouselItem[] = featured.map((movie, i) => ({
    id: movie.id,
    title: movie.title,
    backdrop: backdropUrl(movie.backdrop_path)!,
    backdropSrcSet: backdropSrcSet(movie.backdrop_path),
    image: posterUrl(movie.poster_path, "w342")!,
    href: movieHref(movie),
    credit: `N°${i + 1} des tendances de la semaine`,
    meta: [
      releaseYear(movie.release_date),
      ...(movie.genre_ids ?? []).slice(0, 2).map((id) => genreNames.get(id) ?? ""),
      movie.vote_average > 0 ? `★ ${score(movie.vote_average)}` : "",
    ].filter(Boolean),
  }));
  const featuredById = new Map(featured.map((m) => [m.id, m]));

  return (
    <>
      <h1 className="sr-only">Cineyast — films tendance, recherche et recommandations pour cinéphiles</h1>

      {trendingWeek.isError ? (
        <div className="px-page pt-28 pb-6">
          <ErrorState error={trendingWeek.error} onRetry={() => void trendingWeek.refetch()} />
        </div>
      ) : trendingWeek.isPending ? (
        <div className={cn(HERO_HEIGHT, "skeleton")} aria-label="Chargement des tendances" />
      ) : heroItems.length ? (
        <HeroCarousel
          items={heroItems}
          autoplay
          label="Tendances de la semaine"
          className={HERO_HEIGHT}
          renderActions={(item) => {
            const movie = featuredById.get(Number(item.id));
            return movie ? <HeroActions movie={movie} /> : null;
          }}
        />
      ) : null}

      <div className="pt-4">
        <MovieRow eyebrow="En ce moment" title="Tendances du jour" query={trendingDay} ranked />
        <GenreBand />
        <LazyRow kind="now_playing" eyebrow="Au cinéma" title="À l'affiche en France" />
        <LazyRow kind="popular" eyebrow="Le public en parle" title="Les plus populaires" moreHref="/explorer" />
        <LazyRow kind="top_rated" eyebrow="Panthéon" title="Les mieux notés" moreHref="/explorer?tri=note" />
        <LazyRow kind="upcoming" eyebrow="Bientôt en salle" title="Prochainement" />
      </div>
    </>
  );
}

function HeroActions({ movie }: { movie: MovieSummary }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(movie.id);
  return (
    <>
      <TicketLink to={movieHref(movie)} variant="gold">
        Voir la fiche
      </TicketLink>
      <TicketButton variant="ghost" aria-pressed={active} onClick={() => toggle(movie)}>
        <Heart className={cn(active && "fill-velvet-bright text-velvet-bright")} />
        {active ? "Dans vos favoris" : "Favori"}
      </TicketButton>
    </>
  );
}

/** Rangée dont la requête ne part que lorsqu'elle approche de l'écran. */
function LazyRow({ kind, ...props }: { kind: ListKind } & Omit<MovieRowProps, "query">) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useMovieList(kind, inView);
  return (
    <div ref={ref}>
      {/* Hors de portée : une simple réserve de hauteur plutôt que huit squelettes animés par rangée. */}
      {inView ? <MovieRow query={query} {...props} /> : <div aria-hidden className="h-[27rem] md:h-[30rem]" />}
    </div>
  );
}

function GenreBand() {
  const genres = useGenres();
  if (!genres.data?.length) return null;

  return (
    <section aria-labelledby="genres-title" className="px-page py-10">
      <div className="border-y border-line py-10 md:grid md:grid-cols-[minmax(0,17rem)_1fr] md:gap-12">
        <div>
          <p className="marquee text-xs text-gold">Programmation</p>
          <h2 id="genres-title" className="mt-1 font-display text-3xl italic">
            Choisissez votre salle
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-mute">
            Parcourez le catalogue par genre, puis affinez par année et par note.
          </p>
        </div>
        <ul className="mt-6 flex flex-wrap gap-2 md:mt-0 md:content-start">
          {genres.data.map((genre) => (
            <li key={genre.id}>
              <Link
                to={`/explorer?genres=${genre.id}`}
                className="flex h-10 items-center border border-line-strong px-4 text-sm text-bone/85 transition-colors hover:border-gold hover:text-gold"
              >
                {genre.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
