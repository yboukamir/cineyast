import { useMemo } from "react";
import { MovieRow } from "@/components/movie/MovieRow";
import { useCollection } from "@/hooks/queries";
import { useInView } from "@/hooks/useInView";
import { filmsDeLaSaga, nomDeSaga } from "@/lib/saga";

/**
 * Tous les films de la saga, numérotés dans l'ordre de sortie (le film de la fiche compris, pour
 * situer l'épisode). Chargée à l'approche de la rangée ; masquée en cas d'erreur ou s'il y a
 * moins de deux films.
 */
export function SagaRow({ collection }: { collection: { id: number; name: string } }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const query = useCollection(collection.id, inView);
  const films = useMemo(() => (query.data ? filmsDeLaSaga(query.data) : []), [query.data]);

  if (query.isError || (query.isSuccess && films.length < 2)) return null;

  return (
    <div ref={ref}>
      <MovieRow
        eyebrow="La saga"
        title={nomDeSaga(collection.name)}
        query={{ data: { results: films }, isPending: !query.isSuccess, isError: false, error: null, refetch: () => void query.refetch() }}
        ranked
        rankLabel="Épisode"
      />
    </div>
  );
}
