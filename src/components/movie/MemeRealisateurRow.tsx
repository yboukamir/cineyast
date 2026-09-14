import { useMemo } from "react";
import { MovieRow } from "@/components/movie/MovieRow";
import { useDirectorsFilms } from "@/hooks/queries";
import { useInView } from "@/hooks/useInView";
import { autresFilms, nomsRealisation, titreMemeRealisation } from "@/lib/memeRealisateur";
import { personHref } from "@/lib/slug";

/** Deux réalisateurs au plus : au-delà (films à sketches), la rangée perdrait son sens. */
const MAX_REALISATEURS = 2;

/**
 * Autres films du ou des réalisateurs de la fiche. Les filmographies ne sont demandées qu'à
 * l'approche de la rangée, avec la même clé de cache que les pages personnes. Si la requête
 * échoue ou s'il reste moins de deux films, la rangée disparaît.
 */
export function MemeRealisateurRow({ movieId, directors }: { movieId: number; directors: { id: number; name: string; gender?: number }[] }) {
  const retenus = directors.slice(0, MAX_REALISATEURS);
  const [ref, inView] = useInView<HTMLDivElement>();
  const { persons, isPending, isError, refetch } = useDirectorsFilms(
    retenus.map((d) => d.id),
    inView,
  );
  const films = useMemo(() => autresFilms(persons, movieId), [persons, movieId]);

  if (!retenus.length || isError || (!isPending && films.length < 2)) return null;

  return (
    <div ref={ref}>
      <MovieRow
        eyebrow={`Réalisation · ${nomsRealisation(retenus.map((d) => d.name))}`}
        title={titreMemeRealisation(retenus)}
        query={{ data: { results: films }, isPending, isError: false, error: null, refetch }}
        moreHref={retenus.length === 1 ? personHref(retenus[0]) : undefined}
      />
    </div>
  );
}
