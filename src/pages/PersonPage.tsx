import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ExternalLink, UserRound } from "lucide-react";
import { GridSkeleton, MovieGrid } from "@/components/movie/MovieGrid";
import { MovieRow } from "@/components/movie/MovieRow";
import { EmptyState, ErrorState } from "@/components/States";
import { TicketButton, TicketLink } from "@/components/ui/ticket-button";
import { usePerson } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { buildFilmography, DEPARTMENTS, type FilmographySection } from "@/lib/filmography";
import { releaseDateLong } from "@/lib/format";
import { parseId, personHref } from "@/lib/slug";
import { profileSrcSet, profileUrl, TmdbError, type PersonDetail } from "@/lib/tmdb";

/** Films affichés avant « Afficher tout » : deux rangées sur grand écran. */
const PREVIEW = 12;
/** Au-delà, la biographie est repliée. */
const BIO_PREVIEW = 600;

export default function PersonPage() {
  const { id: param } = useParams();
  const id = parseId(param);
  const { data: person, isPending, isError, error, refetch } = usePerson(id);
  useDocumentTitle(person?.name);

  if (Number.isNaN(id) || (error instanceof TmdbError && error.status === 404)) return <PersonNotFound />;
  if (isError) {
    return (
      <div className="px-page pt-28">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (isPending) return <PersonSkeleton />;
  return <PersonView person={person} />;
}

function ageAt(birthday: string, until?: string | null) {
  const start = new Date(`${birthday}T00:00:00`);
  const end = until ? new Date(`${until}T00:00:00`) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  let years = end.getFullYear() - start.getFullYear();
  if (end.getMonth() < start.getMonth() || (end.getMonth() === start.getMonth() && end.getDate() < start.getDate())) {
    years--;
  }
  return years;
}

function PersonView({ person }: { person: PersonDetail }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // URL canonique : /personne/287 ou un ancien slug → /personne/287-brad-pitt
  const canonical = personHref(person);
  useEffect(() => {
    if (pathname !== canonical) navigate(canonical, { replace: true });
  }, [pathname, canonical, navigate]);

  const { sections, knownFor } = useMemo(() => buildFilmography(person), [person]);
  const department = DEPARTMENTS[person.known_for_department] ?? person.known_for_department;
  const tmdbUrl = `https://www.themoviedb.org/person/${person.id}`;

  const birthAge = person.birthday && !person.deathday ? ageAt(person.birthday) : null;
  const deathAge = person.birthday && person.deathday ? ageAt(person.birthday, person.deathday) : null;
  const facts = [
    ["Naissance", person.birthday ? `${releaseDateLong(person.birthday)}${birthAge !== null ? ` (${birthAge} ans)` : ""}` : ""],
    ["Lieu de naissance", person.place_of_birth ?? ""],
    ["Décès", person.deathday ? `${releaseDateLong(person.deathday)}${deathAge !== null ? ` (à ${deathAge} ans)` : ""}` : ""],
  ].filter(([, value]) => value);

  return (
    <article>
      <header className="px-page pt-24 md:pt-32">
        <div className="grid gap-8 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-12">
          <div className="mx-auto w-40 sm:w-48 md:w-full">
            <div className="aspect-[2/3] overflow-hidden bg-ink-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)] ring-1 ring-gold/40">
              {person.profile_path ? (
                <img
                  src={profileUrl(person.profile_path)}
                  srcSet={profileSrcSet(person.profile_path)}
                  sizes="(min-width: 768px) 272px, (min-width: 640px) 192px, 160px"
                  alt={`Portrait de ${person.name}`}
                  width={421}
                  height={632}
                  fetchPriority="high"
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-bone/20">
                  <UserRound className="size-16" strokeWidth={1} aria-hidden />
                </div>
              )}
            </div>
          </div>

          <div className="text-center md:pt-6 md:text-left">
            {department ? <p className="marquee text-xs text-gold">{department}</p> : null}
            <h1 className="mt-2 font-display text-4xl leading-[1.02] font-medium md:text-6xl">{person.name}</h1>

            {facts.length ? (
              <dl className="mx-auto mt-6 grid max-w-xl gap-x-8 gap-y-3 text-left text-sm sm:grid-cols-2 md:mx-0">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <dt className="marquee text-[11px] text-mute">{label}</dt>
                    <dd className="mt-0.5 text-bone/90">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <Biography text={person.biography} tmdbUrl={tmdbUrl} />

            <div className="marquee mt-6 flex flex-wrap justify-center gap-5 text-xs text-mute md:justify-start">
              {person.external_ids?.imdb_id ? (
                <a
                  href={`https://www.imdb.com/name/${encodeURIComponent(person.external_ids.imdb_id)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-gold"
                >
                  IMDb <ExternalLink className="size-3.5" aria-hidden />
                </a>
              ) : null}
              <a
                href={tmdbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-gold"
              >
                TMDB <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </header>

      {knownFor.length >= 3 ? (
        <div className="mt-10">
          <MovieRow
            eyebrow="Filmographie"
            title="Les plus connus"
            query={{
              data: { page: 1, results: knownFor, total_pages: 1, total_results: knownFor.length },
              isPending: false,
              isError: false,
              error: null,
              refetch: () => undefined,
            }}
          />
        </div>
      ) : null}

      <div className="px-page">
        {sections.length ? (
          sections.map((section) => <FilmographyBlock key={section.key} section={section} />)
        ) : (
          <EmptyState title="Aucun film référencé." className="mt-6">
            TMDB ne recense pas encore de film pour cette personne.
          </EmptyState>
        )}
      </div>
    </article>
  );
}

function Biography({ text, tmdbUrl }: { text: string; tmdbUrl: string }) {
  const [open, setOpen] = useState(false);
  const bio = text.trim();

  if (!bio) {
    return (
      <p className="mt-6 text-sm text-mute italic">
        Aucune biographie n'est disponible en français.{" "}
        <a
          href={tmdbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-bone not-italic underline decoration-gold/50 underline-offset-4 hover:text-gold"
        >
          Voir la fiche sur TMDB
        </a>
      </p>
    );
  }

  const long = bio.length > BIO_PREVIEW;
  // Coupe à la fin d'un mot pour ne pas tronquer au milieu.
  const shown = open || !long ? bio : `${bio.slice(0, BIO_PREVIEW).replace(/\s+\S*$/, "")}…`;

  return (
    <div className="mx-auto mt-6 max-w-2xl text-left md:mx-0">
      <div id="biographie" className="space-y-3 leading-relaxed text-bone/85">
        {shown.split(/\n+/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="biographie"
          className="marquee mt-3 text-xs text-gold transition-colors hover:text-gold-bright"
        >
          {open ? "Réduire" : "Lire la suite"}
        </button>
      ) : null}
    </div>
  );
}

function FilmographyBlock({ section }: { section: FilmographySection }) {
  const [all, setAll] = useState(false);
  const shown = all ? section.items : section.items.slice(0, PREVIEW);
  const headingId = `filmographie-${section.key}`;

  return (
    <section aria-labelledby={headingId} className="pt-14">
      <h2 id={headingId} className="flex items-baseline gap-3 border-b border-line pb-4 font-display text-2xl md:text-3xl">
        {/* L'espace explicite évite un nom accessible collé : « Interprétation81 films ». */}
        {section.label}{" "}
        <span className="marquee text-xs text-mute">
          {section.items.length} film{section.items.length > 1 ? "s" : ""}
        </span>
      </h2>
      <div id={`${headingId}-liste`} className="mt-8">
        <MovieGrid movies={shown} />
      </div>
      {section.items.length > PREVIEW ? (
        <div className="mt-10 flex justify-center">
          <TicketButton
            variant="ghost"
            onClick={() => setAll((value) => !value)}
            aria-expanded={all}
            aria-controls={`${headingId}-liste`}
          >
            {all ? "Réduire" : `Afficher les ${section.items.length} films`}
          </TicketButton>
        </div>
      ) : null}
    </section>
  );
}

function PersonSkeleton() {
  return (
    <div aria-label="Chargement de la fiche" aria-busy>
      <div className="px-page grid gap-8 pt-24 md:grid-cols-[17rem_1fr] md:gap-12 md:pt-32">
        <div className="skeleton mx-auto aspect-[2/3] w-40 sm:w-48 md:w-full" />
        <div className="space-y-4 md:pt-6">
          <div className="skeleton mx-auto h-4 w-32 md:mx-0" />
          <div className="skeleton mx-auto h-14 w-2/3 md:mx-0" />
          <div className="skeleton mx-auto h-24 w-full max-w-2xl md:mx-0" />
        </div>
      </div>
      <div className="px-page mt-14">
        <GridSkeleton count={6} />
      </div>
    </div>
  );
}

function PersonNotFound() {
  useDocumentTitle("Personne introuvable");
  return (
    <div className="px-page pt-28">
      <EmptyState title="Cette personne n'est pas au générique.">
        Elle n'existe pas dans la base TMDB ou le lien est erroné.
        <div className="mt-6 flex justify-center">
          <TicketLink to="/explorer">Explorer le catalogue</TicketLink>
        </div>
      </EmptyState>
    </div>
  );
}
