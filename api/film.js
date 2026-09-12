/**
 * Fiches films : HTML enrichi pour les aperçus de partage et le référencement.
 *
 * vercel.json réécrit /film/:slug vers cette fonction. Elle récupère le
 * index.html statique du déploiement, y injecte le titre, le synopsis et
 * l'image du film (<title>, description, canonical, Open Graph, Twitter),
 * puis le renvoie. Les visiteurs reçoivent la même application React ; les
 * robots de partage (LinkedIn, WhatsApp, Slack…), qui n'exécutent pas
 * JavaScript, voient enfin le bon film au lieu de l'aperçu de l'accueil.
 *
 * En cas d'échec (film inconnu, TMDB injoignable), la page d'origine est
 * renvoyée telle quelle : une fiche ne doit jamais casser à cause d'un aperçu.
 *
 * Volontairement sans import, comme api/tmdb.js.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const SITE = "Cineyast";
const CANONICAL_ORIGIN = "https://cineyast.com";

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

/** Coupe à la fin d'un mot, sans dépasser `max` caractères, points de suspension compris. */
function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

async function fetchMovie(id, key) {
  const params = new URLSearchParams({ language: "fr-FR" });
  const headers = { accept: "application/json" };
  if (isReadAccessToken(key)) headers.authorization = `Bearer ${key}`;
  else params.set("api_key", key);

  const response = await fetch(`${TMDB_BASE}/movie/${id}?${params}`, {
    headers,
    signal: AbortSignal.timeout(4000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB : HTTP ${response.status}`);
  return response.json();
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

  const tags = [
    `<title>${escapeHtml(title)} — ${SITE}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    // Précharge l'image du haut de fiche, élément LCP : sans cela le navigateur ne la découvre
    // qu'après le JavaScript, le code de la page et l'appel à TMDB. Les attributs reproduisent
    // exactement le srcset/sizes de MoviePage, sinon l'image serait téléchargée deux fois.
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
  ];

  // On retire les balises génériques de l'accueil avant d'ajouter celles du film.
  const cleaned = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");

  return cleaned.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);
}

export default async function handler(req, res) {
  const requestHost = req.headers.host ?? "";
  const host = ALLOWED_HOST.test(requestHost) ? requestHost : "cineyast.com";
  const slug = new URL(req.url, `https://${host}`).searchParams.get("slug") ?? "";
  const id = Number.parseInt(slug, 10);

  const key = (process.env.TMDB_API_KEY ?? "").trim();
  const wantsMovie = Number.isInteger(id) && id > 0 && Boolean(key);

  // En parallèle : sur un cache CDN froid, attendre index.html puis TMDB doublait la latence.
  const [shell, movie] = await Promise.allSettled([
    fetch(`https://${host}/index.html`, { signal: AbortSignal.timeout(4000) }).then((response) => {
      if (!response.ok) throw new Error(`index.html : HTTP ${response.status}`);
      return response.text();
    }),
    wantsMovie ? fetchMovie(id, key) : Promise.resolve(null),
  ]);

  if (shell.status === "rejected") {
    // Sans le HTML de l'application, rien à servir : surtout ne pas mettre l'erreur en cache.
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).send("Cineyast est momentanément indisponible. Réessayez dans un instant.");
  }

  let body = shell.value;
  let cache = CACHE_OK;
  if (movie.status === "rejected") cache = CACHE_DEGRADED;
  else if (movie.value?.title) body = injectMovieMeta(body, movie.value);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  return res.status(200).send(body);
}
