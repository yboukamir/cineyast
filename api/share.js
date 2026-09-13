/**
 * Aperçus de partage : HTML enrichi des fiches films et des pages personnes.
 *
 * vercel.json réécrit /film/:slug et /personne/:slug vers cette fonction (paramètre
 * « type »). Elle récupère l'index.html statique du déploiement, y injecte les balises
 * de la page (<title>, description, canonical, Open Graph, Twitter), puis le renvoie.
 * Les visiteurs reçoivent la même application React ; les robots de partage (LinkedIn,
 * WhatsApp, Slack…), qui n'exécutent pas JavaScript, voient le bon film ou la bonne
 * personne au lieu de l'aperçu de l'accueil.
 *
 * En cas d'échec (identifiant inconnu, TMDB injoignable), la page d'origine est renvoyée
 * telle quelle : une page ne doit jamais casser à cause d'un aperçu.
 *
 * Volontairement sans import, comme api/tmdb.js.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const SITE = "Cineyast";
const CANONICAL_ORIGIN = "https://cineyast.com";
/** À incrémenter quand le dessin de la carte change : force LinkedIn et consorts à retélécharger l'image. */
const OG_VERSION = 2;

/** Seuls les domaines du projet peuvent servir de source pour index.html. */
const ALLOWED_HOST = /^(?:www\.)?cineyast\.com$|^[a-z0-9-]+\.vercel\.app$/i;

/** Réponse enrichie : cache CDN d'une heure, resservie périmée pendant une journée le temps de se rafraîchir. */
const CACHE_OK = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
/** TMDB en panne : cache court, pour retenter rapidement. */
const CACHE_DEGRADED = "public, max-age=0, s-maxage=60";

const isReadAccessToken = (key) => key.startsWith("eyJ") && key.split(".").length === 3;

/** Doivent rester identiques à backdropSrcSet() et posterSrcSet() dans src/lib/tmdb.ts. */
const backdropSrcSet = (p) => `${IMG}/w780${p} 780w, ${IMG}/w1280${p} 1280w, ${IMG}/original${p} 1920w`;
const posterSrcSet = (p) => `${IMG}/w185${p} 185w, ${IMG}/w342${p} 342w, ${IMG}/w500${p} 500w, ${IMG}/w780${p} 780w`;
/** Doit rester identique à l'attribut sizes de l'affiche dans src/pages/MoviePage.tsx. */
const POSTER_SIZES = "(min-width: 1024px) 336px, (min-width: 768px) 272px, 208px";

/** Doit rester cohérent avec DEPARTMENTS dans src/lib/filmography.ts. */
export const DEPARTMENTS = {
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

/** Mêmes règles que buildFilmography() dans src/lib/filmography.ts. */
export const SELF = /^(self|himself|herself|themselves|lui-même|elle-même|eux-mêmes)\b/i;
export const CREATIVE_JOBS = new Set(["Director", "Screenplay", "Writer", "Story", "Original Story", "Novel", "Characters", "Author", "Producer"]);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

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

/**
 * Ramène espaces et retours à la ligne à une espace (les biographies TMDB sont découpées en
 * paragraphes, qui apparaîtraient tels quels dans l'aperçu), puis coupe à la fin d'un mot,
 * sans dépasser `max` caractères, points de suspension compris.
 */
function truncate(raw, max) {
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** « A », « A et B », « A, B et C ». */
const listFr = (items) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`);

async function fetchTmdb(path, key, extraParams = {}) {
  const params = new URLSearchParams({ language: "fr-FR", ...extraParams });
  const headers = { accept: "application/json" };
  if (isReadAccessToken(key)) headers.authorization = `Bearer ${key}`;
  else params.set("api_key", key);

  const response = await fetch(`${TMDB_BASE}${path}?${params}`, {
    headers,
    signal: AbortSignal.timeout(4000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB : HTTP ${response.status}`);
  return response.json();
}

/** Retire les balises génériques de l'accueil, puis ajoute celles de la page. */
function withTags(html, tags) {
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");

  return cleaned.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);
}

export function injectMovieMeta(html, movie) {
  const year = movie.release_date?.slice(0, 4);
  const title = `${movie.title}${year ? ` (${year})` : ""}`;
  const description = truncate(
    movie.overview?.trim() ||
      `Fiche de ${movie.title} sur ${SITE} : synopsis, casting, note, bande-annonce et recommandations.`,
    200,
  );
  const slug = slugify(movie.title);
  const url = `${CANONICAL_ORIGIN}/film/${movie.id}${slug ? `-${slug}` : ""}`;

  // Paysage d'abord : LinkedIn et consorts affichent une grande carte en 1.91:1,
  // une affiche portrait n'y apparaîtrait qu'en vignette.
  const image = movie.backdrop_path
    ? { src: `${IMG}/w1280${movie.backdrop_path}`, width: 1280, height: 720 }
    : movie.poster_path
      ? { src: `${IMG}/w780${movie.poster_path}`, width: 780, height: 1170 }
      : null;

  return withTags(html, [
    `<title>${escapeHtml(title)} — ${SITE}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    // Précharge l'image du haut de fiche. Les attributs reproduisent exactement le srcset/sizes
    // de MoviePage, sinon l'image serait téléchargée deux fois.
    ...(movie.backdrop_path
      ? [`<link rel="preload" as="image" href="${escapeHtml(`${IMG}/w1280${movie.backdrop_path}`)}" imagesrcset="${escapeHtml(backdropSrcSet(movie.backdrop_path))}" imagesizes="100vw" fetchpriority="high" />`]
      : movie.poster_path
        ? [`<link rel="preload" as="image" href="${escapeHtml(`${IMG}/w342${movie.poster_path}`)}" imagesrcset="${escapeHtml(posterSrcSet(movie.poster_path))}" imagesizes="${POSTER_SIZES}" fetchpriority="high" />`]
        : []),
    `<meta property="og:type" content="video.movie" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    ...(image
      ? [
          `<meta property="og:image" content="${escapeHtml(image.src)}" />`,
          `<meta property="og:image:width" content="${image.width}" />`,
          `<meta property="og:image:height" content="${image.height}" />`,
          `<meta property="og:image:alt" content="${escapeHtml(`Image du film ${movie.title}`)}" />`,
        ]
      : []),
    `<meta name="twitter:card" content="${image && image.width > image.height ? "summary_large_image" : "summary"}" />`,
  ]);
}

/** Titres des films les plus votés, hors apparitions dans son propre rôle et postes non créatifs. */
export function knownForTitles(person, count) {
  const isSelf = (character) => {
    const role = character?.trim() ?? "";
    return SELF.test(role) || role.localeCompare(person.name, "fr", { sensitivity: "base" }) === 0;
  };
  const credits = [
    ...(person.movie_credits?.cast ?? []).filter((c) => !c.adult && !isSelf(c.character)),
    ...(person.movie_credits?.crew ?? []).filter((c) => !c.adult && CREATIVE_JOBS.has(c.job)),
  ];
  return [...new Map(credits.map((c) => [c.id, c])).values()]
    .filter((m) => m.title && m.vote_count > 0)
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, count)
    .map((m) => m.title);
}

export function injectPersonMeta(html, person) {
  const department = DEPARTMENTS[person.known_for_department] ?? "";
  const films = knownForTitles(person, 3);
  // Sans biographie française, on présente le métier et les films phares plutôt qu'un texte vide.
  const fallback = films.length
    ? `${department ? `${department} · ` : ""}Films les plus connus : ${listFr(films)}. Filmographie complète sur ${SITE}.`
    : `Filmographie de ${person.name} sur ${SITE} : rôles, réalisations et films les plus connus.`;
  const description = truncate(person.biography?.trim() || fallback, 200);
  const slug = slugify(person.name);
  const url = `${CANONICAL_ORIGIN}/personne/${person.id}${slug ? `-${slug}` : ""}`;

  // Carte 1200×630 générée par api/og/personne.js. Un portrait brut était recadré au centre
  // par LinkedIn en grande carte paysage, ce qui coupait le visage (constaté dans Post Inspector).
  const image = { src: `${CANONICAL_ORIGIN}/api/og/personne?id=${person.id}&v=${OG_VERSION}`, width: 1200, height: 630 };

  return withTags(html, [
    `<title>${escapeHtml(person.name)} — ${SITE}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${SITE}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:title" content="${escapeHtml(person.name)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    ...(image
      ? [
          `<meta property="og:image" content="${escapeHtml(image.src)}" />`,
          `<meta property="og:image:width" content="${image.width}" />`,
          `<meta property="og:image:height" content="${image.height}" />`,
          `<meta property="og:image:alt" content="${escapeHtml(`${person.name} sur ${SITE} : métier et films les plus connus`)}" />`,
        ]
      : []),
    `<meta name="twitter:card" content="summary_large_image" />`,
  ]);
}

/** Types de pages pris en charge : chargement des données, contrôle, injection. */
const PAGES = {
  film: {
    load: (id, key) => fetchTmdb(`/movie/${id}`, key),
    isValid: (data) => Boolean(data?.title),
    inject: injectMovieMeta,
  },
  personne: {
    load: (id, key) => fetchTmdb(`/person/${id}`, key, { append_to_response: "movie_credits" }),
    isValid: (data) => Boolean(data?.name),
    inject: injectPersonMeta,
  },
};

export default async function handler(req, res) {
  const requestHost = req.headers.host ?? "";
  const host = ALLOWED_HOST.test(requestHost) ? requestHost : "cineyast.com";
  const params = new URL(req.url, `https://${host}`).searchParams;
  const type = params.get("type") ?? "";
  // Object.hasOwn : un type « constructor » ou « __proto__ » ne doit pas atteindre le prototype.
  const page = Object.hasOwn(PAGES, type) ? PAGES[type] : null;
  const id = Number.parseInt(params.get("slug") ?? "", 10);

  const key = (process.env.TMDB_API_KEY ?? "").trim();
  const wanted = Boolean(page) && Number.isInteger(id) && id > 0 && Boolean(key);

  // En parallèle : sur un cache CDN froid, attendre index.html puis TMDB doublait la latence.
  const [shell, data] = await Promise.allSettled([
    fetch(`https://${host}/index.html`, { signal: AbortSignal.timeout(4000) }).then((response) => {
      if (!response.ok) throw new Error(`index.html : HTTP ${response.status}`);
      return response.text();
    }),
    wanted ? page.load(id, key) : Promise.resolve(null),
  ]);

  if (shell.status === "rejected") {
    // Sans le HTML de l'application, rien à servir : surtout ne pas mettre l'erreur en cache.
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).send("Cineyast est momentanément indisponible. Réessayez dans un instant.");
  }

  let body = shell.value;
  let cache = CACHE_OK;
  if (data.status === "rejected") cache = CACHE_DEGRADED;
  else if (page?.isValid(data.value)) body = page.inject(body, data.value);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  return res.status(200).send(body);
}
