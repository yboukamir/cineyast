/**
 * Sitemap XML : pages fixes et fiches les plus susceptibles d'être cherchées.
 *
 * vercel.json réécrit /sitemap.xml vers cette fonction. Elle liste l'accueil, Explorer, puis
 * les fiches films et personnes tirées des listes TMDB (tendances de la semaine, populaires,
 * mieux notés, à l'affiche, personnalités populaires), avec exactement les URL canoniques de
 * l'application. Une liste en échec est ignorée : le sitemap reste valide, en cache court.
 *
 * Volontairement sans import, comme api/share.js.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const ORIGIN = "https://cineyast.com";

/** Favoris exclus : la page dépend du navigateur du visiteur, un robot la verrait vide. */
export const STATIC_PATHS = ["/", "/explorer"];

/** [chemin TMDB, paramètres, nombre de pages de 20 résultats]. */
export const MOVIE_LISTS = [
  ["/trending/movie/week", {}, 3],
  ["/movie/popular", {}, 5],
  ["/movie/top_rated", {}, 5],
  // Même région que la rangée « À l'affiche » de l'accueil (REGION dans src/lib/tmdb.ts).
  ["/movie/now_playing", { region: "FR" }, 2],
];
export const PERSON_LISTS = [["/person/popular", {}, 3]];

/** Sitemap complet : une journée en cache CDN, resservi périmé une semaine le temps de se rafraîchir. */
const CACHE_OK = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";
/** Une liste manquante (TMDB en panne, clé absente) : cache de dix minutes, pour retenter vite. */
const CACHE_DEGRADED = "public, max-age=0, s-maxage=600";

const isReadAccessToken = (key) => key.startsWith("eyJ") && key.split(".").length === 3;

/** Doit rester identique à slugify() dans src/lib/slug.ts. */
function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** Mêmes URL que movieHref() et personHref() dans src/lib/slug.ts. */
export const movieUrl = (movie) => {
  const slug = slugify(movie.title);
  return `${ORIGIN}/film/${movie.id}${slug ? `-${slug}` : ""}`;
};
export const personUrl = (person) => {
  const slug = slugify(person.name);
  return `${ORIGIN}/personne/${person.id}${slug ? `-${slug}` : ""}`;
};

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

export function buildSitemap(urls) {
  const entries = [...new Set(urls)].map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

async function fetchPage(path, params, page, key) {
  // fr-FR : les slugs viennent des titres français, comme dans l'application.
  const query = new URLSearchParams({ language: "fr-FR", ...params, page: String(page) });
  const headers = { accept: "application/json" };
  if (isReadAccessToken(key)) headers.authorization = `Bearer ${key}`;
  else query.set("api_key", key);

  const response = await fetch(`${TMDB_BASE}${path}?${query}`, { headers, signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error(`TMDB : HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

/** Toutes les pages de toutes les listes, en parallèle ; renvoie les résultats et le nombre d'échecs. */
async function collect(lists, key) {
  const requests = lists.flatMap(([path, params, pages]) =>
    Array.from({ length: pages }, (_, i) => fetchPage(path, params, i + 1, key)),
  );
  const settled = await Promise.allSettled(requests);
  return {
    results: settled.flatMap((s) => (s.status === "fulfilled" ? s.value : [])),
    failures: settled.filter((s) => s.status === "rejected").length,
  };
}

export default async function handler(req, res) {
  const key = (process.env.TMDB_API_KEY ?? "").trim();
  let urls = STATIC_PATHS.map((path) => `${ORIGIN}${path}`);
  let complete = false;

  if (key) {
    const [movies, persons] = await Promise.all([collect(MOVIE_LISTS, key), collect(PERSON_LISTS, key)]);
    urls = urls.concat(
      movies.results.filter((m) => m && !m.adult && m.id > 0 && m.title).map(movieUrl),
      persons.results.filter((p) => p && !p.adult && p.id > 0 && p.name).map(personUrl),
    );
    complete = movies.failures === 0 && persons.failures === 0;
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", complete ? CACHE_OK : CACHE_DEGRADED);
  return res.status(200).send(buildSitemap(urls));
}
