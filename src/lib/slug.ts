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

export const parseMovieId = (param: string | undefined) => {
  const id = Number.parseInt(param ?? "", 10);
  return Number.isInteger(id) && id > 0 ? id : NaN;
};
