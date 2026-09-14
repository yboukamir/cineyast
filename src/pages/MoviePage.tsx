import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ChevronLeft, Play } from "lucide-react";
import { LiensExternes } from "@/components/LiensExternes";
import { AffichesGalerie } from "@/components/movie/AffichesGalerie";
import { FavoriteButton } from "@/components/movie/FavoriteButton";
import { MovieRow } from "@/components/movie/MovieRow";
import { NoteTuiles } from "@/components/movie/NoteTuiles";
import { Poster } from "@/components/movie/Poster";
import { Trailer } from "@/components/movie/Trailer";
import { PaysSelect } from "@/components/movie/PaysSelect";
import { WatchProviders } from "@/components/movie/WatchProviders";
import { EmptyState, ErrorState } from "@/components/States";
import { heroTitleSize } from "@/components/ui/hero-carousel";
import { Rating } from "@/components/ui/rating";
import { useMovie } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePays } from "@/hooks/usePays";
import { count, releaseYear, runtime, score } from "@/lib/format";
import { infosPays } from "@/lib/pays";
import { movieHref, parseId, personHref } from "@/lib/slug";
import {
  backdropSrcSet,
  backdropUrl,
  directorsOf,
  frenchCertification,
  watchProviders,
  pickTrailer,
  profileSrcSet,
  profileUrl,
  TmdbError,
  type CastMember,
  type CrewMember,
  type MovieDetail,
} from "@/lib/tmdb";
import { cn } from "@/lib/utils";

const PAGE = "mx-auto max-w-page px-gouttiere md:px-gouttiere-lg";

export default function MoviePage() {
  const { id: param } = useParams();
  const id = parseId(param);
  const { data: movie, isPending, isError, error, refetch } = useMovie(id);

  const year = releaseYear(movie?.release_date);
  useDocumentTitle(movie ? `${movie.title}${year ? ` (${year})` : ""}` : undefined);

  if (Number.isNaN(id) || (error instanceof TmdbError && error.status === 404)) return <MovieNotFound />;
  if (isError) {
    return (
      <div className={cn(PAGE, "pt-8")}>
        <ErrorState
          error={error}
          title="cette fiche n'a pas pu être chargée."
          onRetry={() => void refetch()}
          action={
            <Link to="/" className="btn btn-sm">
              Retour à l'accueil
            </Link>
          }
        />
      </div>
    );
  }
  if (isPending) return <MovieSkeleton />;
  return <MovieView movie={movie} />;
}

/** Carré jaune qui sépare les faits (année, durée…). */
const Separateur = () => <span className="size-2 border-2 border-noir bg-jaune" aria-hidden />;

function MovieView({ movie }: { movie: MovieDetail }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const trailerRef = useRef<HTMLElement>(null);
  const [pays, choisirPays] = usePays();

  // URL canonique : /film/550 ou /film/550-ancien-slug → /film/550-fight-club
  const canonical = movieHref(movie);
  useEffect(() => {
    if (pathname !== canonical) navigate(canonical, { replace: true });
  }, [pathname, canonical, navigate]);

  const trailer = pickTrailer(movie.videos?.results ?? []);
  const directorList = directorsOf(movie);
  const cast = movie.credits?.cast.slice(0, 15) ?? [];
  const certification = frenchCertification(movie);
  const facts = [releaseYear(movie.release_date), runtime(movie.runtime)].filter(Boolean);
  const hasScore = movie.vote_count > 0 && movie.vote_average > 0;
  const hasRecommendations = (movie.recommendations?.results.length ?? 0) > 0;

  return (
    <article>
      {/* Héros de fiche : l'image sans bleu derrière, le bandeau outremer pour le texte. */}
      <section aria-labelledby="film-titre">
        <div className="mx-auto max-w-page md:px-gouttiere-lg md:pt-8">
          <div className="zone aspect-[16/9] max-h-[520px] w-full border-y-[3px] border-noir md:border-[3px] md:shadow-dure-bleue">
            {movie.backdrop_path ? (
              <img
                src={backdropUrl(movie.backdrop_path)}
                srcSet={backdropSrcSet(movie.backdrop_path)}
                sizes="(min-width: 1440px) 1344px, (min-width: 768px) calc(100vw - 96px), 100vw"
                alt=""
                fetchPriority="high"
                className="absolute inset-0 size-full object-cover"
              />
            ) : null}
            <nav aria-label="Fil d'Ariane" className="absolute top-3 left-3 md:top-6 md:left-6">
              <Link to="/" className="btn btn-sm bg-creme">
                <ChevronLeft className="size-[18px]" strokeWidth={2.6} aria-hidden />
                Accueil
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-b-[3px] border-noir bg-outremer text-creme">
          <div className="mx-auto grid max-w-page grid-cols-[112px_1fr] items-start gap-x-4 px-gouttiere pb-8 md:grid-cols-[240px_1fr] md:gap-x-12 md:px-gouttiere-lg md:pb-12">
            <div className="zone -mt-20 aspect-[2/3] border-[3px] border-noir shadow-dure-jaune md:-mt-56">
              <Poster path={movie.poster_path} title={movie.title} sizes="(min-width: 768px) 240px, 112px" eager />
            </div>

            <div className="min-w-0 pt-4 md:pt-8">
              {facts.length || certification ? (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-semibold md:text-lg">
                  {facts.map((fact, i) => (
                    <Fragment key={fact}>
                      {i > 0 ? <Separateur /> : null}
                      <span>{fact}</span>
                    </Fragment>
                  ))}
                  {certification ? (
                    <span className="inline-flex h-7 items-center border-2 border-creme px-2 text-sm font-bold tracking-wide">
                      {certification}
                    </span>
                  ) : null}
                </p>
              ) : null}
              <h1 id="film-titre" className={cn("hero-titre mt-3 md:mt-4", heroTitleSize(movie.title))}>
                {movie.title}
              </h1>
              {movie.tagline ? (
                <p className="mt-3 max-w-[38ch] text-lg font-semibold italic md:mt-4 md:text-2xl">« {movie.tagline} »</p>
              ) : null}
            </div>

            <div className="col-span-2 mt-6 flex flex-col gap-5 md:col-start-2 md:mt-7">
              {movie.genres.length ? (
                <ul aria-label="Genres" className="m-0 flex list-none flex-wrap gap-3 p-0">
                  {movie.genres.map((genre) => (
                    <li key={genre.id}>
                      <Link to={`/explorer?genres=${genre.id}`} className="plaque">
                        {genre.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {hasScore ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <NoteTuiles value={movie.vote_average} size="lg" />
                  <span className="inline-flex items-center gap-2">
                    <Rating value={movie.vote_average} size="lg" decorative />
                    {/* Valeur déjà annoncée par les tuiles : masquée aux lecteurs d'écran pour ne pas la répéter. */}
                    <span className="text-lg font-bold" aria-hidden>
                      {score(movie.vote_average)}
                      <span className="text-sm font-semibold">/10</span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold">{count(movie.vote_count)} votes sur TMDB</span>
                </div>
              ) : (
                <p className="text-[15px] font-semibold">Pas encore assez de votes pour une note.</p>
              )}

              {directorList.length ? (
                <p className="text-[15px] md:text-base">
                  Réalisation :{" "}
                  <PeopleLinks
                    people={directorList}
                    className="font-bold underline decoration-2 underline-offset-4 hover:bg-jaune hover:text-noir hover:no-underline"
                  />
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-3 md:flex md:gap-3.5">
                {trailer ? (
                  <a
                    href="#bande-annonce"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                      trailerRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
                    }}
                  >
                    <Play className="size-5 fill-current" aria-hidden />
                    Bande-annonce
                  </a>
                ) : null}
                <FavoriteButton
                  movie={movie}
                  variant="bouton"
                  className={trailer ? undefined : "col-span-2"}
                  label={
                    <>
                      <span className="md:hidden">Favori</span>
                      <span className="hidden md:inline">Ajouter aux favoris</span>
                    </>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={cn(PAGE, "md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-16")}>
        <div className="min-w-0">
          <section className="pt-10 md:pt-14" aria-labelledby="synopsis">
            <SectionHead id="synopsis" eyebrow="L'histoire">
              Synopsis
            </SectionHead>
            {movie.overview ? (
              <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed">{movie.overview}</p>
            ) : (
              <p className="mt-4 text-gris italic">Aucun synopsis n'est disponible en français pour ce film.</p>
            )}
          </section>

          <section className="pt-12 md:pt-16" aria-labelledby="ou-regarder">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <SectionHead id="ou-regarder" eyebrow="Séances à domicile">
                  Où regarder {infosPays(pays).dans}
                </SectionHead>
              </div>
              <PaysSelect value={pays} onChange={choisirPays} />
            </div>
            <WatchProviders availability={watchProviders(movie, pays)} releaseDate={movie.release_date} pays={pays} />
          </section>

          {cast.length ? (
            <section className="pt-12 md:pt-16" aria-labelledby="casting">
              <SectionHead id="casting" eyebrow="Devant la caméra">
                Casting principal
              </SectionHead>
              <CastRow cast={cast} />
            </section>
          ) : null}

          {trailer ? (
            <section
              ref={trailerRef}
              id="bande-annonce"
              className="scroll-mt-36 pt-12 md:scroll-mt-24 md:pt-16"
              aria-labelledby="bande-annonce-titre"
            >
              <SectionHead id="bande-annonce-titre" eyebrow="Vidéo">
                Bande-annonce
              </SectionHead>
              <Trailer video={trailer} title={movie.title} className="mt-5 max-w-[880px]" />
              <p className="mt-3 text-sm text-gris">Bandes-annonces hébergées par YouTube.</p>
            </section>
          ) : null}
        </div>

        <aside className="pt-12 md:pt-14" aria-labelledby="fiche-technique">
          <SectionHead id="fiche-technique" eyebrow="Détails">
            Fiche technique
          </SectionHead>
          <TechnicalSheet movie={movie} directors={directorList} certification={certification} />
          {/* Même bloc que sur la page personne de la maquette : validé par Yassine pour la fiche film. */}
          <LiensExternes
            titreId="liens-film"
            className="pt-10"
            liens={[
              ...(movie.imdb_id ? [{ href: `https://www.imdb.com/title/${encodeURIComponent(movie.imdb_id)}/`, label: "Fiche IMDb" }] : []),
              { href: `https://www.themoviedb.org/movie/${movie.id}`, label: "Fiche TMDB" },
            ]}
          />
        </aside>
      </div>

      <AffichesGalerie movieId={movie.id} title={movie.title} affichePrincipale={movie.poster_path} />

      {hasRecommendations ? (
        <MovieRow
          eyebrow="Si vous avez aimé"
          title="Recommandations"
          query={{ data: movie.recommendations, isPending: false, isError: false, error: null, refetch: () => undefined }}
        />
      ) : null}
    </article>
  );
}

function SectionHead({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <>
      <p className="surtitre mb-1">{eyebrow}</p>
      <h2 id={id} className="titre-section">
        {children}
      </h2>
    </>
  );
}

const initiales = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

function CastRow({ cast }: { cast: CastMember[] }) {
  return (
    <ul className="rangee-scroll m-0 list-none p-0" tabIndex={0} aria-label="Casting principal, rangée défilante">
      {cast.map((person) => {
        const href = personHref(person);
        return (
          <li key={`${person.id}-${person.order}`} className="carte">
            <Link to={href} className="portrait carte-media" tabIndex={-1} aria-hidden>
              {person.profile_path ? (
                <img
                  src={profileUrl(person.profile_path)}
                  srcSet={profileSrcSet(person.profile_path)}
                  sizes="(min-width: 768px) 176px, 140px"
                  alt=""
                  width={185}
                  height={278}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
              ) : (
                <div className="affiche-absente content-center">
                  <b className="!text-[30px]">{initiales(person.name)}</b>
                  <small>Portrait indisponible</small>
                </div>
              )}
            </Link>
            <p className="carte-titre">
              <Link to={href} className="decoration-2 underline-offset-2 hover:underline">
                {person.name}
              </Link>
            </p>
            {person.character ? <p className="mt-0.5 line-clamp-2 text-sm text-gris">{person.character}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

const displayNames = (type: "language" | "region") => {
  try {
    return new Intl.DisplayNames(["fr"], { type });
  } catch {
    return null;
  }
};

const languageNames = displayNames("language");
// TMDB renvoie les pays de production en anglais, même avec language=fr-FR :
// on retraduit à partir du code ISO 3166-1.
const regionNames = displayNames("region");

/** Noms séparés par des virgules, chacun lié à sa page. */
function PeopleLinks({ people, className }: { people: Pick<CrewMember, "id" | "name">[]; className?: string }) {
  return people.map((person, i) => (
    <span key={person.id}>
      {i > 0 ? ", " : null}
      <Link to={personHref(person)} className={className}>
        {person.name}
      </Link>
    </span>
  ));
}

function TechnicalSheet({
  movie,
  directors,
  certification,
}: {
  movie: MovieDetail;
  directors: Pick<CrewMember, "id" | "name">[];
  certification?: string;
}) {
  const language = movie.original_language ? (languageNames?.of(movie.original_language) ?? movie.original_language) : "";
  const rows: [string, ReactNode][] = [
    ["Titre original", movie.original_title],
    ["Réalisation", directors.length ? <PeopleLinks people={directors} className="lien" /> : ""],
    ["Année", releaseYear(movie.release_date)],
    ["Durée", runtime(movie.runtime)],
    ["Classification", certification],
    ["Pays", movie.production_countries.map((c) => regionNames?.of(c.iso_3166_1) ?? c.name).join(", ")],
    ["Langue originale", language ? language.charAt(0).toUpperCase() + language.slice(1) : ""],
    ["Genres", movie.genres.map((g) => g.name).join(", ")],
    ["Note TMDB", movie.vote_count > 0 ? `${score(movie.vote_average)} / 10 (${count(movie.vote_count)} votes)` : ""],
  ];

  return (
    <dl className="mt-5 border-t-[3px] border-noir">
      {rows
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-4 border-b-2 border-filet py-3">
            <dt className="pt-0.5 text-sm font-bold tracking-[.08em] text-gris uppercase">{label}</dt>
            <dd className="m-0 font-semibold">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function MovieSkeleton() {
  return (
    <div className={cn(PAGE, "pt-8")} aria-busy="true" aria-label="Chargement de la fiche">
      <div className="grid grid-cols-[112px_1fr] items-start gap-x-4 border-[3px] border-noir p-4 md:grid-cols-[240px_1fr] md:gap-x-12 md:p-8">
        <div className="squelette aspect-[2/3] border-[3px] border-filet" />
        <div className="grid gap-3 pt-2">
          <div className="squelette h-4 w-2/5" />
          <div className="squelette h-14 w-4/5 md:h-24" />
          <div className="squelette h-5 w-3/5" />
          <div className="mt-2 flex gap-3">
            <div className="squelette h-11 w-24" />
            <div className="squelette h-11 w-24" />
          </div>
          <div className="squelette mt-2 h-11 w-40" />
        </div>
      </div>
    </div>
  );
}

function MovieNotFound() {
  useDocumentTitle("Film introuvable");
  return (
    <div className={cn(PAGE, "pt-8")}>
      <EmptyState
        title="Ce film n'est pas au programme."
        action={
          <Link to="/explorer" className="btn btn-sm">
            Explorer le catalogue
          </Link>
        }
      >
        Il n'existe pas dans la base TMDB ou le lien est erroné.
      </EmptyState>
    </div>
  );
}
