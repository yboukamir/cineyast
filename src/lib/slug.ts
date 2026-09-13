// Après normalisation NFD, les accents deviennent des « marques » Unicode séparées.
const DIACRITICS = /\p{M}/gu;

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** /film/550-fight-club — l'id seul fait foi, le slug est là pour la lisibilité et le SEO. */
export const movieHref = (movie: { id: number; title: string }) => {
  const slug = slugify(movie.title);
  return slug ? `/film/${movie.id}-${slug}` : `/film/${movie.id}`;
};

/** /personne/287-brad-pitt — même principe que les fiches films. */
export const personHref = (person: { id: number; name: string }) => {
  const slug = slugify(person.name);
  return slug ? `/personne/${person.id}-${slug}` : `/personne/${person.id}`;
};

/** Identifiant en tête d'un paramètre d'URL « 550-fight-club » ; NaN s'il est absent ou invalide. */
export const parseId = (param: string | undefined) => {
  const id = Number.parseInt(param ?? "", 10);
  return Number.isInteger(id) && id > 0 ? id : NaN;
};
