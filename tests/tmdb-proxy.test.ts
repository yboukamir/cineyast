import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../api/tmdb.js";
import { mockRes, request } from "./helpers";

interface Captured {
  url: URL;
  headers: Record<string, string>;
}

/** fetch simulé qui mémorise l'appel sortant vers TMDB. */
function stubTmdb(response: () => Response | Promise<Response> = () => new Response('{"ok":true}', { status: 200 })) {
  const captured: Captured[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: { headers?: Record<string, string> }) => {
      captured.push({ url: new URL(input), headers: init?.headers ?? {} });
      return response();
    }),
  );
  return captured;
}

async function call(query: string, method = "GET") {
  const res = mockRes();
  await handler(request(`/api/tmdb.php?${query}`, { method }), res);
  return res;
}

beforeEach(() => {
  vi.stubEnv("TMDB_API_KEY", "cle-de-test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("relais vers TMDB", () => {
  it("ajoute la clé côté serveur et ne transmet que les paramètres autorisés", async () => {
    const captured = stubTmdb();
    const res = await call("path=%2Fmovie%2F550&language=fr-FR&vote_average.gte=7&foo=bar&api_key=cle-du-client&include_adult=true");
    expect(res.statusCode).toBe(200);
    expect(captured).toHaveLength(1);
    const { url } = captured[0];
    expect(url.origin + url.pathname).toBe("https://api.themoviedb.org/3/movie/550");
    expect(url.searchParams.getAll("api_key")).toEqual(["cle-de-test"]);
    expect(url.searchParams.get("language")).toBe("fr-FR");
    // Paramètre à point conservé (piège de PHP, qui le transforme en vote_average_gte).
    expect(url.searchParams.get("vote_average.gte")).toBe("7");
    expect(url.searchParams.has("foo")).toBe(false);
    expect(url.searchParams.getAll("include_adult")).toEqual(["false"]);
  });

  it("transmet les filtres des rangées Flashback et Cinéma belge", async () => {
    const captured = stubTmdb();
    await call("path=%2Fdiscover%2Fmovie&release_date.gte=2001-09-12&release_date.lte=2001-09-18&with_release_type=2%7C3&with_origin_country=BE");
    const { searchParams } = captured[0].url;
    expect(searchParams.get("release_date.gte")).toBe("2001-09-12");
    expect(searchParams.get("release_date.lte")).toBe("2001-09-18");
    expect(searchParams.get("with_release_type")).toBe("2|3");
    expect(searchParams.get("with_origin_country")).toBe("BE");
  });

  it("utilise l'en-tête Authorization avec un jeton d'accès v4", async () => {
    vi.stubEnv("TMDB_API_KEY", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature");
    const captured = stubTmdb();
    await call("path=%2Fmovie%2F550");
    expect(captured[0].headers.authorization).toBe("Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.signature");
    expect(captured[0].url.searchParams.has("api_key")).toBe(false);
  });

  it("ignore les valeurs de plus de 200 caractères", async () => {
    const captured = stubTmdb();
    await call(`path=%2Fsearch%2Fmovie&query=${"a".repeat(201)}`);
    expect(captured[0].url.searchParams.has("query")).toBe(false);
  });

  it("met en cache les réponses réussies, et seulement elles", async () => {
    stubTmdb();
    expect((await call("path=%2Fmovie%2F550")).headers["cache-control"]).toContain("s-maxage=900");
    stubTmdb(() => new Response('{"status_code":34}', { status: 404 }));
    const notFound = await call("path=%2Fmovie%2F999999999");
    expect(notFound.statusCode).toBe(404);
    expect(notFound.headers["cache-control"]).toBe("no-store");
  });
});

describe("refus", () => {
  it.each(["/account", "/person/287/images", "/movie/550/account_states", "/person/abc", "/movie/550?x=1", ""])(
    "refuse le chemin « %s » sans appeler TMDB",
    async (path) => {
      const captured = stubTmdb();
      const res = await call(`path=${encodeURIComponent(path)}`);
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ error: "path_not_allowed" });
      expect(captured).toHaveLength(0);
    },
  );

  it("refuse les méthodes autres que GET et HEAD", async () => {
    const captured = stubTmdb();
    const res = await call("path=%2Fmovie%2F550", "POST");
    expect(res.statusCode).toBe(405);
    expect(res.headers.allow).toBe("GET, HEAD");
    expect(captured).toHaveLength(0);
  });

  it("répond 500 sans clé configurée", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    stubTmdb();
    const res = await call("path=%2Fmovie%2F550");
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ error: "missing_api_key" });
  });

  it("répond 502 si TMDB est injoignable", async () => {
    stubTmdb(() => Promise.reject(new Error("réseau")));
    const res = await call("path=%2Fmovie%2F550");
    expect(res.statusCode).toBe(502);
    expect(res.body).toMatchObject({ error: "upstream_unreachable" });
  });
});
