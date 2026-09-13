import type { Connect, Plugin } from "vite";

/**
 * Proxy TMDB pour `npm run dev` / `npm run preview`.
 *
 * Réplique en Node le comportement de public/api/tmdb.php (utilisé en
 * production sur LWS) : le client appelle toujours `/api/tmdb.php?path=...`,
 * et la clé n'est ajoutée que côté serveur. Garder les deux listes blanches
 * synchronisées.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";

export const ALLOWED_PATHS = [
  /^\/trending\/movie\/(day|week)$/,
  /^\/movie\/(popular|top_rated|now_playing|upcoming)$/,
  /^\/movie\/\d{1,9}$/,
  /^\/movie\/\d{1,9}\/(recommendations|similar|videos|credits)$/,
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
]);

/** Le "jeton d'accès en lecture" (v4) est un JWT ; la "clé API" (v3) est un hash hexadécimal. */
const isReadAccessToken = (key: string) => key.startsWith("eyJ") && key.split(".").length === 3;

interface ProxyResult {
  status: number;
  body: string;
}

const jsonError = (status: number, error: string, message: string): ProxyResult => ({
  status,
  body: JSON.stringify({ error, message }),
});

async function forward(rawUrl: string, apiKey: string | undefined): Promise<ProxyResult> {
  const incoming = new URL(rawUrl, "http://localhost").searchParams;
  const path = incoming.get("path") ?? "";

  if (!ALLOWED_PATHS.some((re) => re.test(path))) {
    return jsonError(400, "path_not_allowed", `Endpoint TMDB non autorisé : ${path || "(vide)"}`);
  }

  const key = apiKey?.trim();
  if (!key) {
    return jsonError(
      500,
      "missing_api_key",
      "TMDB_API_KEY est absente : copiez .env.example en .env, renseignez votre clé TMDB puis relancez `npm run dev`.",
    );
  }

  const outgoing = new URLSearchParams();
  for (const [name, value] of incoming) {
    if (ALLOWED_PARAMS.has(name) && value.length <= 200) outgoing.set(name, value);
  }
  outgoing.set("include_adult", "false");

  const headers: Record<string, string> = { accept: "application/json" };
  if (isReadAccessToken(key)) headers.authorization = `Bearer ${key}`;
  else outgoing.set("api_key", key);

  try {
    const response = await fetch(`${TMDB_BASE}${path}?${outgoing}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
    return { status: response.status, body: await response.text() };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return jsonError(502, "upstream_unreachable", `TMDB injoignable : ${reason}`);
  }
}

export function tmdbDevProxy(apiKey: string | undefined): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith("/api/tmdb.php")) return next();

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.statusCode = 405;
      res.end();
      return;
    }

    void forward(req.url, apiKey).then(({ status, body }) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", status === 200 ? "public, max-age=600" : "no-store");
      res.end(body);
    });
  };

  return {
    name: "cineyast-tmdb-dev-proxy",
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
}
