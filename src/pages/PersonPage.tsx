import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ExternalLink } from "lucide-react";
import { MovieRow } from "@/components/movie/MovieRow";
import { EmptyState, ErrorState } from "@/components/States";
import { usePerson, usePersonBiography } from "@/hooks/queries";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { buildFilmography, DEPARTMENTS, type FilmographySection } from "@/lib/filmography";
import { releaseDateLong, releaseYear } from "@/lib/format";
import { movieHref, parseId, personHref } from "@/lib/slug";
import { profileSrcSet, profileUrl, TmdbError, type PersonDetail } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

const PAGE = "mx-auto max-w-page px-gouttiere md:px-gouttiere-lg";
/** Films affichés avant « Afficher les N films ». */
const PREVIEW = 10;
/** Intitulés des blocs de filmographie, tels que la maquette les nomme. */
const TITRES: Record<FilmographySection["key"], string> = {
  directing: "Réalisation",
  acting: "Rôles",
  writing: "Scénario",
  production: "Production",
  self: "Apparitions",
};

export default function PersonPage() {
  const { id: param } = useParams();
  const id = parseId(param);
  const { data: person, isPending, isError, error, refetch } = usePerson(id);
  useDocumentTitle(person?.name);

  if (Number.isNaN(id) || (error instanceof TmdbError && error.status === 404)) return <PersonNotFound />;
  if (isError) {
    return (
      <div className={cn(PAGE, "pt-8")}>
        <ErrorState error={error} title="cette page n'a pas pu être chargée." onRetry={() => void refetch()} />
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

const initiales = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

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

  // Blocs répartis en deux colonnes indépendantes : déplier un bloc n'allonge que sa colonne.
  const colonnes = [sections.filter((_, i) => i % 2 === 0), sections.filter((_, i) => i % 2 === 1)];

  return (
    <article>
      <section aria-labelledby="personne-titre" className="border-b-[3px] border-noir bg-outremer text-creme">
        <div className="mx-auto grid max-w-page grid-cols-[128px_1fr] items-start gap-x-5 px-gouttiere pt-6 pb-8 md:grid-cols-[240px_1fr] md:gap-x-14 md:px-gouttiere-lg md:pt-12 md:pb-14">
          <div className="zone aspect-[2/3] border-[3px] border-noir shadow-dure-jaune">
            {person.profile_path ? (
              <img
                src={profileUrl(person.profile_path)}
                srcSet={profileSrcSet(person.profile_path)}
                sizes="(min-width: 768px) 240px, 128px"
                alt={`Portrait de ${person.name}`}
                width={421}
                height={632}
                fetchPriority="high"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="affiche-absente content-center">
                <b className="!text-[44px] md:!text-[64px]">{initiales(person.name)}</b>
                <small>Portrait indisponible</small>
              </div>
            )}
          </div>

          <div className="min-w-0">
            {department ? <p className="etiquette">{department}</p> : null}
            {/* Taille de la maquette (44 / 80 px), réduite pour les noms longs qui déborderaient sur mobile. */}
            <h1
              id="personne-titre"
              className={cn(
                "hero-titre mt-4 [overflow-wrap:anywhere] md:mt-5",
                person.name.length > 18 ? "!text-[34px] md:!text-d-lg" : "!text-[44px] md:!text-d-xl",
              )}
            >
              {person.name}
            </h1>
            {facts.length ? (
              <dl className="mt-4 grid gap-1.5 text-[15px] md:mt-6 md:text-lg">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex flex-wrap gap-x-2">
                    <dt className="font-bold">{label} :</dt>
                    <dd className="m-0">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </section>

      <div className={cn(PAGE, "md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-16")}>
        <section className="pt-10 md:pt-14" aria-labelledby="biographie-titre">
          <p className="surtitre mb-1">Parcours</p>
          <h2 id="biographie-titre" className="titre-section">
            Biographie
          </h2>
          <Biography text={person.biography} personId={person.id} tmdbUrl={tmdbUrl} />
        </section>

        <aside className="pt-10 md:pt-14" aria-labelledby="liens-titre">
          <p className="surtitre mb-1">Ailleurs</p>
          <h2 id="liens-titre" className="titre-section">
            Liens
          </h2>
          <ul className="m-0 mt-4 list-none border-t-[3px] border-noir p-0">
            {person.external_ids?.imdb_id ? (
              <LienExterne href={`https://www.imdb.com/name/${encodeURIComponent(person.external_ids.imdb_id)}/`}>
                Fiche IMDb
              </LienExterne>
            ) : null}
            <LienExterne href={tmdbUrl}>Fiche TMDB</LienExterne>
          </ul>
        </aside>
      </div>

      {knownFor.length >= 3 ? (
        <MovieRow
          eyebrow="Ses films"
          title="Les plus connus"
          query={{ data: { results: knownFor }, isPending: false, isError: false, error: null, refetch: () => undefined }}
        />
      ) : null}

      {sections.length ? (
        <section className={cn(PAGE, "pt-14 md:pt-20")} aria-labelledby="filmographie-titre">
          <p className="surtitre mb-1">Par métier</p>
          <h2 id="filmographie-titre" className="titre-section mb-8">
            Filmographie
          </h2>
          <div className="md:grid md:grid-cols-2 md:items-start md:gap-x-16">
            {colonnes.map((blocs, i) =>
              blocs.length ? (
                <div key={i} className={i === 1 ? "mt-8 md:mt-0" : undefined}>
                  {blocs.map((section) => (
                    <FilmographyBlock key={section.key} section={section} />
                  ))}
                </div>
              ) : null,
            )}
          </div>
        </section>
      ) : (
        <div className={cn(PAGE, "pt-10")}>
          <EmptyState title="Aucun film référencé.">TMDB ne recense pas encore de film pour cette personne.</EmptyState>
        </div>
      )}
    </article>
  );
}

function LienExterne({ href, children }: { href: string; children: string }) {
  return (
    <li className="border-b-2 border-filet">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="-mx-2 flex h-14 items-center justify-between px-2 font-semibold hover:bg-jaune"
      >
        <span>
          {children}
          <span className="sr-only"> (nouvel onglet)</span>
        </span>
        <ExternalLink className="size-4" strokeWidth={2.4} aria-hidden />
      </a>
    </li>
  );
}

/** Repliée à 4 lignes sur mobile, 3 sur ordinateur ; le bouton n'apparaît que si le texte dépasse. */
function Biography({ text, personId, tmdbUrl }: { text: string; personId: number; tmdbUrl: string }) {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const [english, setEnglish] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const englishBio = usePersonBiography(personId, "en-US", english);

  const french = text.trim();
  const shownText = french || (english ? (englishBio.data?.biography.trim() ?? "") : "");
  const lang = french ? undefined : "en";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const measure = () => setClamped(el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, shownText]);

  if (!shownText) {
    const englishMissing = english && englishBio.isSuccess;
    return (
      <EmptyState
        mark="VO"
        title="Biographie indisponible en français."
        className="mt-4"
        action={
          <>
            {!englishMissing ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setEnglish(true)}
                disabled={english && englishBio.isFetching}
              >
                {english && englishBio.isFetching ? "Chargement…" : "Lire en anglais"}
              </button>
            ) : null}
            <a href={tmdbUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
              Contribuer sur TMDB
              <ExternalLink className="size-4" strokeWidth={2.4} aria-hidden />
              <span className="sr-only"> (nouvel onglet)</span>
            </a>
          </>
        }
      >
        {englishMissing
          ? "TMDB n'a pas non plus de version anglaise pour cette personne."
          : englishBio.isError
            ? "La version anglaise n'a pas pu être chargée. Réessayez dans un instant."
            : "TMDB n'a pas encore de version française pour cette personne. La version originale existe peut-être."}
      </EmptyState>
    );
  }

  return (
    <div className="mt-4 max-w-[68ch]">
      {lang ? <p className="mb-2 text-sm font-semibold text-gris">Version anglaise fournie par TMDB :</p> : null}
      <div
        id="biographie"
        ref={ref}
        lang={lang}
        className={cn("space-y-3 text-[17px] leading-relaxed", !open && "line-clamp-4 md:line-clamp-3")}
      >
        {shownText.split(/\n+/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      {clamped || open ? (
        <button
          type="button"
          className="btn btn-sm mt-4"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="biographie"
        >
          {open ? "Réduire" : "Lire la suite"}
        </button>
      ) : null}
    </div>
  );
}

function FilmographyBlock({ section }: { section: FilmographySection }) {
  const [all, setAll] = useState(false);
  const total = section.items.length;
  const shown = all ? section.items : section.items.slice(0, PREVIEW);
  const headingId = `filmographie-${section.key}`;

  return (
    <section aria-labelledby={headingId} className="mt-8 border-t-[3px] border-noir pt-6 first:mt-0">
      <div className="flex items-end justify-between gap-4">
        <h3 id={headingId} className="font-display text-d-md text-noir">
          {TITRES[section.key]}
        </h3>
        <span className="text-sm font-bold tracking-[.08em] text-gris uppercase">
          {total} film{total > 1 ? "s" : ""}
        </span>
      </div>
      <ul id={`${headingId}-liste`} className="m-0 mt-2 list-none p-0">
        {shown.map((item) => {
          const year = releaseYear(item.release_date);
          return (
            <li
              key={item.id}
              className="grid grid-cols-[3.5rem_1fr] items-baseline gap-x-4 border-b-2 border-filet py-3 md:grid-cols-[4.5rem_1fr_1fr]"
            >
              <span className={cn("pt-0.5 font-display text-d-xs", year ? "text-outremer" : "text-gris")}>{year || "—"}</span>
              <span className="min-w-0">
                <Link to={movieHref(item)} className="font-semibold decoration-2 underline-offset-2 hover:underline">
                  {item.title}
                </Link>
                {item.subtitle ? <span className="block text-sm text-gris md:hidden">{item.subtitle}</span> : null}
              </span>
              <span className="hidden text-sm text-gris md:block">{item.subtitle}</span>
            </li>
          );
        })}
      </ul>
      {total > PREVIEW ? (
        <button
          type="button"
          className="btn btn-sm mt-4"
          onClick={() => setAll((value) => !value)}
          aria-expanded={all}
          aria-controls={`${headingId}-liste`}
        >
          {all ? "Réduire" : `Afficher les ${total} films`}
        </button>
      ) : null}
    </section>
  );
}

function PersonSkeleton() {
  return (
    <div className={cn(PAGE, "pt-8")} aria-busy="true" aria-label="Chargement de la page">
      <div className="grid grid-cols-[128px_1fr] items-start gap-x-5 border-[3px] border-noir p-4 md:grid-cols-[280px_1fr] md:gap-x-14 md:p-8">
        <div className="squelette aspect-[2/3] border-[3px] border-filet" />
        <div className="grid gap-3 pt-2">
          <div className="squelette h-8 w-32" />
          <div className="squelette h-12 w-3/5 md:h-20" />
          <div className="squelette h-5 w-2/5" />
          <div className="squelette h-5 w-1/2" />
        </div>
      </div>
    </div>
  );
}

function PersonNotFound() {
  useDocumentTitle("Personne introuvable");
  return (
    <div className={cn(PAGE, "pt-8")}>
      <EmptyState
        title="Cette personne n'est pas au générique."
        action={
          <Link to="/explorer" className="btn btn-sm">
            Explorer le catalogue
          </Link>
        }
      >
        Elle n'existe pas dans la base TMDB ou le lien est erroné.
      </EmptyState>
    </div>
  );
}
