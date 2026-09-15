import { useMemo } from "react";
import { Link } from "react-router";
import { MovieRow } from "@/components/movie/MovieRow";
import { RubriqueTab } from "@/components/movie/Rubrique";
import { useDirectorsFilms } from "@/hooks/queries";
import { useInView } from "@/hooks/useInView";
import { cineasteDuMois, naissance } from "@/lib/cineasteBelge";
import { nomDuMois } from "@/lib/classement";
import { autresFilms } from "@/lib/memeRealisateur";
import { personHref } from "@/lib/slug";
import { profileSrcSet, profileUrl } from "@/lib/tmdb";

/**
 * Portrait du cinéaste belge du mois (src/lib/cineasteBelge.ts) : photo, naissance, biographie
 * TMDB et films réalisés. Chargé à l'approche de la section ; masqué si TMDB ne répond pas.
 */
export function CineasteBelge() {
  const now = new Date();
  const cineaste = cineasteDuMois(now);
  const [ref, inView] = useInView<HTMLElement>();
  const { persons, isPending, isError, refetch } = useDirectorsFilms(cineaste.ids, inView);
  const films = useMemo(() => autresFilms(persons, 0), [persons]);

  if (isError) return null;

  const duo = cineaste.ids.length > 1;
  const principal = persons[0];

  return (
    <>
      <section
        ref={ref}
        id="cineaste-belge"
        aria-labelledby="cineaste-titre"
        className="mx-auto max-w-page scroll-mt-36 px-gouttiere pt-14 md:scroll-mt-24 md:px-gouttiere-lg md:pt-20"
      >
        <div className="border-t-[3px] border-noir pt-8 md:pt-10">
          <p className="surtitre mb-1 flex items-center gap-2">
            <RubriqueTab rubrique="belgique" />
            Cinéaste belge du mois · {nomDuMois(now)}
          </p>
          <h2 id="cineaste-titre" className="titre-section">
            {cineaste.nom}
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-10">
            <div className={duo ? "grid grid-cols-2 gap-3" : "max-w-[260px]"}>
              {cineaste.ids.map((id) => {
                const person = persons.find((p) => p.id === id);
                return (
                  <div key={id} className="zone aspect-[2/3] border-[3px] border-noir shadow-dure-sm">
                    {person?.profile_path ? (
                      <img
                        src={profileUrl(person.profile_path)}
                        srcSet={profileSrcSet(person.profile_path)}
                        sizes={duo ? "(min-width: 768px) 125px, 45vw" : "(min-width: 768px) 260px, 60vw"}
                        alt={`Portrait de ${person.name}`}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="min-w-0">
              {isPending ? (
                <div className="grid gap-3" aria-busy="true">
                  <div className="squelette h-5 w-40" />
                  <div className="squelette h-24 w-full max-w-[68ch]" />
                </div>
              ) : (
                <>
                  {!duo && principal && naissance(principal) ? <p className="text-[15px] font-semibold text-gris">{naissance(principal)}</p> : null}
                  {principal?.biography ? (
                    <p className="mt-3 line-clamp-6 max-w-[68ch] text-[17px] leading-relaxed">{principal.biography}</p>
                  ) : (
                    <p className="mt-3 max-w-[68ch] text-gris italic">Pas encore de biographie en français sur TMDB.</p>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {persons.map((person) => (
                      <Link key={person.id} to={personHref(person)} className="btn btn-sm">
                        {duo ? `Page de ${person.name}` : "Voir sa page"}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {isPending || films.length ? (
        <MovieRow
          eyebrow="Réalisation"
          title={duo ? "Leurs films" : "Ses films"}
          query={{ data: { results: films }, isPending, isError: false, error: null, refetch }}
          rubrique="belgique"
        />
      ) : null}
    </>
  );
}
