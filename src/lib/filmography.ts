import type { MovieSummary, PersonDetail } from "@/lib/tmdb";

export interface FilmographyItem extends MovieSummary {
  /** Rôle ou nature du crédit, affiché sous le titre. */
  subtitle?: string;
}

export interface FilmographySection {
  key: "directing" | "acting" | "writing" | "production" | "self";
  label: string;
  items: FilmographyItem[];
}

export const DEPARTMENTS: Record<string, string> = {
  Acting: "Interprétation",
  Directing: "Réalisation",
  Writing: "Scénario",
  Production: "Production",
  Editing: "Montage",
  Camera: "Image",
  Sound: "Son",
  Art: "Direction artistique",
  "Costume & Make-Up": "Costumes et maquillage",
  "Visual Effects": "Effets visuels",
  Lighting: "Lumière",
  Crew: "Équipe technique",
};

/**
 * Apparitions dans son propre rôle (documentaires, making-of, archives). Elles représentent
 * jusqu'aux deux tiers des crédits de certains réalisateurs : on les sépare des vrais rôles.
 */
const SELF = /^(self|himself|herself|themselves|lui-même|elle-même|eux-mêmes)\b/i;

const WRITING_LABELS: Record<string, string> = {
  Screenplay: "Scénario",
  Writer: "Scénario",
  Story: "Histoire originale",
  "Original Story": "Histoire originale",
  Novel: "Roman",
  Characters: "Personnages",
  Author: "Œuvre originale",
};

const PRIMARY: Record<string, FilmographySection["key"]> = {
  Acting: "acting",
  Directing: "directing",
  Writing: "writing",
  Production: "production",
};

/**
 * Plus récent d'abord : les sorties annoncées (date future) restent en tête. Les films sans date
 * vont à la fin : ce sont surtout des courts métrages et des projets sans titre, qui masquaient
 * sinon les films majeurs (la section « Réalisation » de Bong Joon-ho s'ouvrait sur l'un d'eux).
 */
function byDateDesc(a: MovieSummary, b: MovieSummary) {
  if (!a.release_date || !b.release_date) return Number(Boolean(b.release_date)) - Number(Boolean(a.release_date));
  return b.release_date.localeCompare(a.release_date);
}

/** Un même film peut être crédité plusieurs fois (deux rôles, scénario et histoire) : un seul exemplaire, intitulés fusionnés. */
function merge(credits: { movie: MovieSummary; label?: string }[]): FilmographyItem[] {
  const byId = new Map<number, FilmographyItem>();
  for (const { movie, label } of credits) {
    const existing = byId.get(movie.id);
    if (!existing) {
      byId.set(movie.id, { ...movie, subtitle: label || undefined });
    } else if (label && !existing.subtitle?.split(" / ").includes(label)) {
      existing.subtitle = existing.subtitle ? `${existing.subtitle} / ${label}` : label;
    }
  }
  return [...byId.values()].sort(byDateDesc);
}

export function buildFilmography(person: PersonDetail) {
  const cast = person.movie_credits.cast.filter((c) => !c.adult);
  const crew = person.movie_credits.crew.filter((c) => !c.adult);
  // « Self » et ses variantes, ou le propre nom de la personne comme personnage (Brad Pitt dans The Trainer).
  const isSelf = (character?: string) => {
    const role = character?.trim() ?? "";
    return SELF.test(role) || role.localeCompare(person.name, "fr", { sensitivity: "base" }) === 0;
  };

  // Seuls les postes créatifs : « Thanks », production exécutive et postes techniques noieraient la liste.
  const main: FilmographySection[] = [
    {
      key: "directing",
      label: "Réalisation",
      items: merge(crew.filter((c) => c.job === "Director").map((movie) => ({ movie }))),
    },
    {
      key: "acting",
      label: "Interprétation",
      items: merge(cast.filter((c) => !isSelf(c.character)).map((c) => ({ movie: c, label: c.character?.trim() }))),
    },
    {
      key: "writing",
      label: "Scénario",
      items: merge(crew.filter((c) => c.job in WRITING_LABELS).map((c) => ({ movie: c, label: WRITING_LABELS[c.job] }))),
    },
    {
      key: "production",
      label: "Production",
      items: merge(crew.filter((c) => c.job === "Producer").map((movie) => ({ movie }))),
    },
  ].filter((section) => section.items.length > 0) as FilmographySection[];

  // Le métier principal ouvre la page (tri stable : l'ordre des autres sections est conservé).
  const primary = PRIMARY[person.known_for_department];
  main.sort((a, b) => Number(b.key === primary) - Number(a.key === primary));

  const self = merge(cast.filter((c) => isSelf(c.character)).map((movie) => ({ movie })));
  const sections = self.length
    ? [...main, { key: "self" as const, label: "Dans son propre rôle", items: self }]
    : main;

  // Films phares : les plus votés parmi les vrais crédits, pas les apparitions ni les remerciements.
  const knownFor = [...new Map(main.flatMap((s) => s.items).map((m) => [m.id, m])).values()]
    .filter((m) => m.poster_path && m.vote_count > 0)
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 10);

  return { sections, knownFor };
}
