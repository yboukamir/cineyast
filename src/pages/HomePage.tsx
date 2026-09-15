import { useMemo, type ReactNode, type Ref } from "react";
import { Link } from "react-router";
import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel";
import { CineasteBelge } from "@/components/movie/CineasteBelge";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { MovieRow, type MovieRowProps } from "@/components/movie/MovieRow";
import { ErrorState } from "@/components/States";
import { useBelgianCinema, useFlashback, useGenres, useMonthlyTop, useMovieList, useTrending, type ListKind } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useInView } from "@/hooks/useInView";
import { classementDuMois, lienClassement, surtitreClassement, titreClassement } from "@/lib/classement";
import { FLASHBACK_YEARS, flashbackTitle, flashbackWeek } from "@/lib/flashback";
import { releaseYear } from "@/lib/format";
import { movieHref } from "@/lib/slug";
import { backdropSrcSet, backdropUrl, posterSrcSet, posterUrl, type MovieSummary } from "@/lib/tmdb";

/** Sommaire de l'accueil, à la manière du sommaire d'une revue : un lien par rubrique. */
const SOMMAIRE = [
  { ancre: "tendances", libelle: "Tendances du jour" },
  { ancre: "genres", libelle: "Genres" },
  { ancre: "a-l-affiche", libelle: "À l'affiche" },
  { ancre: "populaires", libelle: "Les plus populaires" },
  { ancre: "mieux-notes", libelle: "Les mieux notés" },
  { ancre: "classement", libelle: "Classement du mois" },
  { ancre: "flashback", libelle: "Flashback" },
  { ancre: "prochainement", libelle: "Prochainement" },
  { ancre: "films-belges", libelle: "Films belges" },
  { ancre: "cineaste-belge", libelle: "Cinéaste belge du mois" },
];

/** Cible d'un lien du sommaire : laisse la place de l'en-tête collant (plus haut sur mobile, avec la recherche). */
const ANCRE = "scroll-mt-36 md:scroll-mt-24";

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

      <Sommaire />
      <div id="tendances" className={ANCRE}>
        <MovieRow eyebrow="Aujourd'hui" title="Tendances du jour" query={trendingDay} ranked rubrique="actualite" />
      </div>
      <GenresBand />
      <LazyRow ancre="a-l-affiche" kind="now_playing" eyebrow="Au cinéma" title="À l'affiche" rubrique="actualite" />
      <LazyRow ancre="populaires" kind="popular" eyebrow="Le public en parle" title="Les plus populaires" moreHref="/explorer" rubrique="palmares" />
      <LazyRow ancre="mieux-notes" kind="top_rated" eyebrow="Panthéon" title="Les mieux notés" moreHref="/explorer?tri=note" rubrique="palmares" />
      <MonthlyTopRow />
      <FlashbackRow />
      <LazyRow ancre="prochainement" kind="upcoming" eyebrow="Bientôt en salle" title="Prochainement" rubrique="actualite" />
      <BelgianRow />
      <CineasteBelge />
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

/** Liens vers chaque rangée ; défilement horizontal sur mobile plutôt que quatre lignes de liens. */
function Sommaire() {
  return (
    <nav aria-labelledby="sommaire-titre" className="mx-auto max-w-page px-gouttiere pt-8 md:px-gouttiere-lg md:pt-10">
      <p id="sommaire-titre" className="surtitre mb-3">
        Au sommaire
      </p>
      <ul className="scrollbar-none -mx-gouttiere my-0 flex list-none gap-2 overflow-x-auto px-gouttiere pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {SOMMAIRE.map((entree) => (
          <li key={entree.ancre} className="shrink-0">
            <a href={`#${entree.ancre}`} className="plaque h-9 px-3 text-sm">
              {entree.libelle}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Rangée dont la requête ne part que lorsqu'elle approche de l'écran. */
function LazyRow({ kind, ancre, ...props }: { kind: ListKind; ancre: string } & Omit<MovieRowProps, "query">) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useMovieList(kind, inView);
  return (
    <RowSlot slotRef={ref} inView={inView} ancre={ancre}>
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
    <RowSlot slotRef={ref} inView={inView} ancre="flashback">
      <MovieRow eyebrow={`Flashback · il y a ${FLASHBACK_YEARS} ans`} title={flashbackTitle(period)} query={query} rubrique="memoire" />
    </RowSlot>
  );
}

/** Classement du mois : un genre et ses 5 films les mieux notés, ou le bilan de l'année en décembre. */
function MonthlyTopRow() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useMonthlyTop(inView);
  const now = new Date();
  const classement = classementDuMois(now);
  return (
    <RowSlot slotRef={ref} inView={inView} ancre="classement">
      <MovieRow
        eyebrow={surtitreClassement(now)}
        title={titreClassement(classement, now)}
        query={query}
        ranked
        moreHref={lienClassement(classement, now)}
        rubrique="palmares"
      />
    </RowSlot>
  );
}

function BelgianRow() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useBelgianCinema(inView);
  return (
    <RowSlot slotRef={ref} inView={inView} ancre="films-belges">
      {/* « et coproductions » : le filtre de TMDB retient tout film dont la Belgique est un des pays d'origine. */}
      <MovieRow eyebrow="Plat pays" title="Films belges et coproductions" query={query} rubrique="belgique" />
    </RowSlot>
  );
}

/** Hors de portée : une simple réserve de hauteur plutôt que huit squelettes animés par rangée. */
function RowSlot({ slotRef, inView, ancre, children }: { slotRef: Ref<HTMLDivElement>; inView: boolean; ancre: string; children: ReactNode }) {
  return (
    <div ref={slotRef} id={ancre} className={ANCRE}>
      {inView ? children : <div aria-hidden className="h-[392px] md:h-[486px]" />}
    </div>
  );
}

/** Accès direct à l'exploration, un genre à la fois. */
function GenresBand() {
  const genres = useGenres();
  if (!genres.data?.length) return null;

  return (
    <section
      id="genres"
      aria-labelledby="genres-titre"
      className={`mx-auto max-w-page px-gouttiere pt-14 md:px-gouttiere-lg md:pt-20 ${ANCRE}`}
    >
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
