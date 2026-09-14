import { useMemo, type ReactNode, type Ref } from "react";
import { Link } from "react-router";
import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { MovieRow, type MovieRowProps } from "@/components/movie/MovieRow";
import { ErrorState } from "@/components/States";
import { useBelgianCinema, useFlashback, useGenres, useMovieList, useTrending, type ListKind } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useInView } from "@/hooks/useInView";
import { FLASHBACK_YEARS, flashbackTitle, flashbackWeek } from "@/lib/flashback";
import { releaseYear } from "@/lib/format";
import { movieHref } from "@/lib/slug";
import { backdropSrcSet, backdropUrl, posterSrcSet, posterUrl, type MovieSummary } from "@/lib/tmdb";

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
    backdrop: backdropUrl(movie.backdrop_path),
    backdropSrcSet: backdropSrcSet(movie.backdrop_path),
    poster: posterUrl(movie.poster_path, "w342"),
    posterSrcSet: posterSrcSet(movie.poster_path),
    href: movieHref(movie),
    credit: `N°${i + 1} des tendances de la semaine`,
    meta: [
      releaseYear(movie.release_date),
      (movie.genre_ids ?? [])
        .slice(0, 2)
        .map((id) => genreNames.get(id))
        .filter(Boolean)
        .join(", "),
    ].filter(Boolean),
    note: movie.vote_average > 0 ? movie.vote_average : undefined,
  }));
  const featuredById = new Map(featured.map((m) => [m.id, m]));

  return (
    <>
      <h1 className="sr-only">Cinéyast — films tendance, recherche et recommandations pour cinéphiles</h1>

      {trendingWeek.isError ? (
        <div className="mx-auto max-w-page px-gouttiere pt-8 md:px-gouttiere-lg">
          <ErrorState error={trendingWeek.error} what="les tendances" onRetry={() => void trendingWeek.refetch()} />
        </div>
      ) : trendingWeek.isPending ? (
        <HeroSkeleton />
      ) : heroItems.length ? (
        <HeroCarousel
          items={heroItems}
          autoplay
          label="Tendances de la semaine"
          renderActions={(item) => {
            const movie = featuredById.get(Number(item.id));
            return movie ? <HeroActions movie={movie} /> : null;
          }}
        />
      ) : null}

      <MovieRow eyebrow="Aujourd'hui" title="Tendances du jour" query={trendingDay} ranked />
      <GenresBand />
      <LazyRow kind="now_playing" eyebrow="Au cinéma" title="À l'affiche" />
      <LazyRow kind="popular" eyebrow="Le public en parle" title="Les plus populaires" moreHref="/explorer" />
      <LazyRow kind="top_rated" eyebrow="Panthéon" title="Les mieux notés" moreHref="/explorer?tri=note" />
      <FlashbackRow />
      <LazyRow kind="upcoming" eyebrow="Bientôt en salle" title="Prochainement" />
      <BelgianRow />
    </>
  );
}

function HeroActions({ movie }: { movie: MovieSummary }) {
  return (
    <>
      <Link to={movieHref(movie)} className="btn btn-primary">
        Voir la fiche
      </Link>
      <FavoriteButton movie={movie} variant="bouton" label="Favori" />
    </>
  );
}

/** Mêmes proportions que le héros chargé : image 16:9 puis bandeau outremer. */
function HeroSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement des tendances">
      <div className="mx-auto max-w-page md:px-gouttiere-lg md:pt-8">
        <div className="squelette aspect-[16/9] max-h-[560px] w-full border-y-[3px] border-filet md:border-[3px]" />
      </div>
      {/* Hauteurs mesurées du bandeau réel quand le titre le plus long occupe deux lignes (412 et 1440 px). */}
      <div className="h-[262px] border-b-[3px] border-noir bg-outremer md:h-[291px]" />
    </div>
  );
}

/** Rangée dont la requête ne part que lorsqu'elle approche de l'écran. */
function LazyRow({ kind, ...props }: { kind: ListKind } & Omit<MovieRowProps, "query">) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useMovieList(kind, inView);
  return (
    <RowSlot slotRef={ref} inView={inView}>
      <MovieRow query={query} {...props} />
    </RowSlot>
  );
}

/** Films sortis en salle en France il y a 25 ans, cette semaine-là (ou ce mois-là si la semaine est maigre). */
function FlashbackRow() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useFlashback(inView);
  if (query.data && !query.data.results.length) return null;

  const period = query.data?.period ?? flashbackWeek(new Date());
  return (
    <RowSlot slotRef={ref} inView={inView}>
      <MovieRow eyebrow={`Flashback · il y a ${FLASHBACK_YEARS} ans`} title={flashbackTitle(period)} query={query} />
    </RowSlot>
  );
}

function BelgianRow() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useBelgianCinema(inView);
  return (
    <RowSlot slotRef={ref} inView={inView}>
      {/* « et coproductions » : le filtre de TMDB retient tout film dont la Belgique est un des pays d'origine. */}
      <MovieRow eyebrow="Plat pays" title="Films belges et coproductions" query={query} />
    </RowSlot>
  );
}

/** Hors de portée : une simple réserve de hauteur plutôt que huit squelettes animés par rangée. */
function RowSlot({ slotRef, inView, children }: { slotRef: Ref<HTMLDivElement>; inView: boolean; children: ReactNode }) {
  return <div ref={slotRef}>{inView ? children : <div aria-hidden className="h-[392px] md:h-[486px]" />}</div>;
}

/** Accès direct à l'exploration, un genre à la fois. */
function GenresBand() {
  const genres = useGenres();
  if (!genres.data?.length) return null;

  return (
    <section aria-labelledby="genres-titre" className="mx-auto max-w-page px-gouttiere pt-14 md:px-gouttiere-lg md:pt-20">
      <div className="border-t-[3px] border-noir pt-8 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 md:pt-10">
        <div>
          <p className="surtitre mb-1">Explorer</p>
          <h2 id="genres-titre" className="titre-section">
            Choisissez un genre
          </h2>
          <p className="mt-3 max-w-[40ch] text-gris">Parcourez le catalogue par genre, puis affinez par année et par note.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
          {genres.data.map((genre) => (
            <Link key={genre.id} to={`/explorer?genres=${genre.id}`} className="plaque">
              {genre.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
