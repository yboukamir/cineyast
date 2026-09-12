import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ExternalLink, Heart, Play, UserRound } from "lucide-react";
import { MovieRow } from "@/components/movie/MovieRow";
import { Poster } from "@/components/movie/Poster";
import { Trailer } from "@/components/movie/Trailer";
import { EmptyState, ErrorState } from "@/components/States";
import { Rating } from "@/components/ui/rating";
import { Scroller } from "@/components/ui/scroller";
import { TicketButton, TicketLink } from "@/components/ui/ticket-button";
import { useMovie } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFavorites } from "@/hooks/useFavorites";
import { count, releaseDateLong, releaseYear, runtime, score } from "@/lib/format";
import { movieHref, parseMovieId } from "@/lib/slug";
import {
  backdropSrcSet,
  backdropUrl,
  directors,
  frenchCertification,
  pickTrailer,
  profileUrl,
  TmdbError,
  type MovieDetail,
} from "@/lib/tmdb";
import { cn } from "@/lib/utils";

const BACKDROP_HEIGHT = "h-[46svh] min-h-72 md:h-[72svh] md:max-h-[46rem]";

export default function MoviePage() {
  const { id: param } = useParams();
  const id = parseMovieId(param);
  const { data: movie, isPending, isError, error, refetch } = useMovie(id);

  const year = releaseYear(movie?.release_date);
  useDocumentTitle(movie ? `${movie.title}${year ? ` (${year})` : ""}` : undefined);

  if (Number.isNaN(id) || (error instanceof TmdbError && error.status === 404)) return <MovieNotFound />;
  if (isError) {
    return (
      <div className="px-page pt-28">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (isPending) return <MovieSkeleton />;
  return <MovieView movie={movie} />;
}

function MovieView({ movie }: { movie: MovieDetail }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isFavorite, toggle } = useFavorites();
  const trailerRef = useRef<HTMLElement>(null);

  // URL canonique : /film/550 ou /film/550-ancien-slug → /film/550-fight-club
  const canonical = movieHref(movie);
  useEffect(() => {
    if (pathname !== canonical) navigate(canonical, { replace: true });
  }, [pathname, canonical, navigate]);

  const favorite = isFavorite(movie.id);
  const trailer = pickTrailer(movie.videos?.results ?? []);
  const directorNames = directors(movie);
  const cast = movie.credits?.cast.slice(0, 15) ?? [];
  const certification = frenchCertification(movie);
  const facts = [releaseYear(movie.release_date), runtime(movie.runtime), certification].filter(Boolean);
  const hasScore = movie.vote_count > 0;
  const hasRecommendations = (movie.recommendations?.results.length ?? 0) > 0;

  return (
    <article>
      <div className={cn("relative", BACKDROP_HEIGHT)}>
        {movie.backdrop_path ? (
          <img
            src={backdropUrl(movie.backdrop_path)}
            srcSet={backdropSrcSet(movie.backdrop_path)}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-[50%_25%]"
          />
        ) : (
          <div className="absolute inset-0 bg-ink-2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/40" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(12_10_9/0.75),transparent_65%)] md:block" />
      </div>

      <div className="px-page relative -mt-44 md:-mt-80">
        <div className="grid gap-8 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-12 lg:grid-cols-[minmax(0,21rem)_1fr]">
          <div className="mx-auto w-44 sm:w-52 md:w-full">
            <div className="relative aspect-[2/3] overflow-hidden shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] ring-1 ring-gold/40">
              <Poster
                path={movie.poster_path}
                title={movie.title}
                sizes="(min-width: 1024px) 336px, (min-width: 768px) 272px, 208px"
                eager
              />
            </div>
          </div>

          <div className="text-center md:pt-28 md:text-left lg:pt-36">
            {facts.length ? (
              <p className="marquee flex flex-wrap justify-center gap-x-3 text-xs text-gold md:justify-start">
                {facts.map((fact, i) => (
                  <span key={fact}>
                    {i > 0 ? (
                      <span aria-hidden className="mr-3 text-line-strong">
                        /
                      </span>
                    ) : null}
                    {fact}
                  </span>
                ))}
              </p>
            ) : null}

            <h1 className="mt-3 font-display text-4xl leading-[1.02] font-medium md:text-6xl lg:text-7xl">{movie.title}</h1>
            {movie.original_title !== movie.title ? (
              <p className="mt-2 font-display text-lg text-mute italic">{movie.original_title}</p>
            ) : null}
            {movie.tagline ? <p className="mt-4 font-display text-xl text-gold-bright italic">« {movie.tagline} »</p> : null}

            {movie.genres.length ? (
              <ul className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {movie.genres.map((genre) => (
                  <li key={genre.id}>
                    <Link
                      to={`/explorer?genres=${genre.id}`}
                      className="marquee flex h-8 items-center border border-line-strong px-3 text-[11px] text-bone/80 transition-colors hover:border-gold hover:text-gold"
                    >
                      {genre.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 md:justify-start">
              {hasScore ? (
                <div className="flex items-center gap-3 text-left">
                  <span className="font-display text-5xl leading-none">{score(movie.vote_average)}</span>
                  <div>
                    <Rating value={movie.vote_average} />
                    <p className="mt-1 text-xs text-mute">{count(movie.vote_count)} votes sur TMDB</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-mute">Pas encore assez de votes pour une note.</p>
              )}
              {directorNames.length ? (
                <div className="text-left sm:border-l sm:border-line sm:pl-8">
                  <p className="marquee text-[11px] text-mute">Réalisation</p>
                  <p className="font-display text-lg">{directorNames.join(", ")}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
              {trailer ? (
                <TicketButton
                  variant="velvet"
                  onClick={() => trailerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                >
                  <Play className="fill-current" /> Bande-annonce
                </TicketButton>
              ) : null}
              <TicketButton variant={favorite ? "gold" : "ghost"} aria-pressed={favorite} onClick={() => toggle(movie)}>
                <Heart className={cn(favorite && "fill-current")} />
                {favorite ? "Dans vos favoris" : "Ajouter aux favoris"}
              </TicketButton>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="min-w-0 space-y-14">
            <section aria-labelledby="synopsis">
              <SectionTitle id="synopsis" eyebrow="L'histoire">
                Synopsis
              </SectionTitle>
              {movie.overview ? (
                <p className="mt-5 max-w-3xl text-lg leading-relaxed text-bone/90 first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-gold">
                  {movie.overview}
                </p>
              ) : (
                <p className="mt-5 text-mute italic">Aucun synopsis n'est disponible en français pour ce film.</p>
              )}
            </section>

            {trailer ? (
              <section ref={trailerRef} aria-labelledby="bande-annonce" className="scroll-mt-24">
                <SectionTitle id="bande-annonce" eyebrow="En projection">
                  Bande-annonce
                </SectionTitle>
                <Trailer video={trailer} title={movie.title} className="mt-5" />
                <a
                  href={`https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marquee mt-3 inline-flex items-center gap-1.5 text-xs text-mute hover:text-gold"
                >
                  Voir sur YouTube <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </section>
            ) : null}

            {cast.length ? (
              <section aria-labelledby="casting">
                <SectionTitle id="casting" eyebrow="Distribution">
                  Casting principal
                </SectionTitle>
                <Scroller label="Casting principal" className="mt-5 snap-x">
                  <ul className="flex w-max gap-4 pb-2">
                    {cast.map((person) => (
                      <li key={`${person.id}-${person.order}`} className="w-28 shrink-0 snap-start sm:w-32">
                        <div className="aspect-[3/4] overflow-hidden bg-ink-2 ring-1 ring-line ring-inset">
                          {person.profile_path ? (
                            <img
                              src={profileUrl(person.profile_path)}
                              alt=""
                              width={185}
                              height={278}
                              loading="lazy"
                              decoding="async"
                              className="size-full object-cover transition duration-500 hover:grayscale-0 [@media(hover:hover)]:grayscale"
                            />
                          ) : (
                            <div className="grid size-full place-items-center text-bone/20">
                              <UserRound className="size-10" strokeWidth={1} aria-hidden />
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-tight font-semibold">{person.name}</p>
                        {person.character ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-mute">{person.character}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Scroller>
              </section>
            ) : null}
          </div>

          <aside aria-labelledby="fiche-technique">
            <SectionTitle id="fiche-technique" eyebrow="Générique">
              Fiche technique
            </SectionTitle>
            <TechnicalSheet movie={movie} directorNames={directorNames} certification={certification} />
          </aside>
        </div>
      </div>

      {hasRecommendations ? (
        <div className="mt-12">
          <MovieRow
            eyebrow="Si vous avez aimé"
            title="Recommandations"
            query={{ data: movie.recommendations, isPending: false, isError: false, error: null, refetch: () => undefined }}
          />
        </div>
      ) : null}
    </article>
  );
}

function SectionTitle({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <div>
      <p className="marquee text-[11px] text-gold">{eyebrow}</p>
      <h2 id={id} className="mt-1 font-display text-2xl md:text-3xl">
        {children}
      </h2>
    </div>
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

function TechnicalSheet({
  movie,
  directorNames,
  certification,
}: {
  movie: MovieDetail;
  directorNames: string[];
  certification?: string;
}) {
  const language = movie.original_language ? (languageNames?.of(movie.original_language) ?? movie.original_language) : "";
  const rows: [string, ReactNode][] = [
    ["Titre original", movie.original_title],
    ["Réalisation", directorNames.join(", ")],
    ["Sortie", releaseDateLong(movie.release_date)],
    ["Durée", runtime(movie.runtime)],
    ["Pays", movie.production_countries.map((c) => regionNames?.of(c.iso_3166_1) ?? c.name).join(", ")],
    ["Langue originale", language ? language.charAt(0).toUpperCase() + language.slice(1) : ""],
    ["Classification", certification],
  ];

  return (
    <>
      <dl className="mt-5 divide-y divide-line border-y border-line text-sm">
        {rows
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => (
            <div key={label} className="grid grid-cols-[8.5rem_1fr] gap-3 py-3">
              <dt className="marquee text-[11px] leading-5 text-mute">{label}</dt>
              <dd className="text-bone/90">{value}</dd>
            </div>
          ))}
      </dl>
      <div className="marquee mt-5 flex flex-wrap gap-5 text-xs text-mute">
        {movie.imdb_id ? (
          <a
            href={`https://www.imdb.com/title/${encodeURIComponent(movie.imdb_id)}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-gold"
          >
            IMDb <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
        <a
          href={`https://www.themoviedb.org/movie/${movie.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-gold"
        >
          TMDB <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </>
  );
}

function MovieSkeleton() {
  return (
    <div aria-label="Chargement de la fiche" aria-busy>
      <div className={cn("skeleton", BACKDROP_HEIGHT)} />
      <div className="px-page relative -mt-44 grid gap-8 md:-mt-80 md:grid-cols-[17rem_1fr] md:gap-12 lg:grid-cols-[21rem_1fr]">
        <div className="skeleton mx-auto aspect-[2/3] w-44 sm:w-52 md:w-full" />
        <div className="space-y-4 md:pt-28 lg:pt-36">
          <div className="skeleton mx-auto h-4 w-40 md:mx-0" />
          <div className="skeleton mx-auto h-14 w-3/4 md:mx-0" />
          <div className="skeleton mx-auto h-4 w-1/2 md:mx-0" />
        </div>
      </div>
    </div>
  );
}

function MovieNotFound() {
  useDocumentTitle("Film introuvable");
  return (
    <div className="px-page pt-28">
      <EmptyState title="Ce film n'est pas au programme.">
        Il n'existe pas dans la base TMDB ou le lien est erroné.
        <div className="mt-6 flex justify-center">
          <TicketLink to="/explorer">Explorer le catalogue</TicketLink>
        </div>
      </EmptyState>
    </div>
  );
}
