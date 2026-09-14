/**
 * Proxy TMDB — fonction serverless Vercel.
 *
 * Équivalent exact de deploy/php/api/tmdb.php (hébergement PHP) et de
 * server/tmdb-dev-proxy.ts (développement). Le client appelle toujours
 * /api/tmdb.php ; vercel.json réécrit cette URL vers cette fonction.
 *
 * Volontairement sans import : une fonction autonome évite toute surprise
 * d'empaquetage au déploiement. Les trois listes blanches doivent rester
 * synchronisées.
 *
 * La clé se configure dans Vercel > Settings > Environment Variables (TMDB_API_KEY).
 */

const TMDB_BASE = "https://api.themoviedb.org/3";

export const ALLOWED_PATHS = [
  /^\/trending\/movie\/(day|week)$/,
  /^\/movie\/(popular|top_rated|now_playing|upcoming)$/,
  /^\/movie\/\d{1,9}$/,
  /^\/movie\/\d{1,9}\/(recommendations|similar|videos|credits|images)$/,
  /^\/search\/movie$/,
  /^\/discover\/movie$/,
  /^\/genre\/movie\/list$/,
  /^\/person\/\d{1,9}$/,
];

export const ALLOWED_PARAMS = new Set([
  "language",
  "region",
  "page",
  "query",
  "year",
  "primary_release_year",
  "primary_release_date.gte",
  "primary_release_date.lte",
  "release_date.gte",
  "release_date.lte",
  "with_release_type",
  "with_origin_country",
  "with_genres",
  "vote_average.gte",
  "vote_count.gte",
  "sort_by",
  "append_to_response",
  "include_video_language",
  "include_image_language",
]);

/** Jeton d'accès en lecture (v4) = JWT ; clé API (v3) = hash hexadécimal. */
const isReadAccessToken = (key) => key.startsWith("eyJ") && key.split(".").length === 3;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "method_not_allowed", message: "Seules les requêtes GET sont acceptées." });
  }

  const incoming = new URL(req.url, `https://${req.headers.host}`).searchParams;
  const path = incoming.get("path") ?? "";
  if (!ALLOWED_PATHS.some((re) => re.test(path))) {
    return res.status(400).json({ error: "path_not_allowed", message: "Endpoint TMDB non autorisé." });
  }

  const key = (process.env.TMDB_API_KEY ?? "").trim();
  if (!key) {
    return res.status(500).json({
      error: "missing_api_key",
      message: "TMDB_API_KEY n'est pas définie dans les variables d'environnement du projet.",
    });
  }

  const outgoing = new URLSearchParams();
  for (const [name, value] of incoming) {
    if (ALLOWED_PARAMS.has(name) && value.length <= 200) outgoing.set(name, value);
  }
  outgoing.set("include_adult", "false");

  const headers = { accept: "application/json" };
  if (isReadAccessToken(key)) headers.authorization = `Bearer ${key}`;
  else outgoing.set("api_key", key);

  try {
    const response = await fetch(`${TMDB_BASE}${path}?${outgoing}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    const body = await response.text();
    // s-maxage : mis en cache par le CDN Vercel, pas seulement par le navigateur.
    res.setHeader(
      "Cache-Control",
      response.status === 200 ? "public, max-age=300, s-maxage=900, stale-while-revalidate=86400" : "no-store",
    );
    return res.status(response.status).send(body);
  } catch (err) {
    return res.status(502).json({
      error: "upstream_unreachable",
      message: `TMDB injoignable : ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
