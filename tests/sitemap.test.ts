import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler, { MOVIE_LISTS, PERSON_LISTS } from "../api/sitemap.js";
import { movieHref, personHref } from "@/lib/slug";
import { fixture, mockRes, request, stubFetch } from "./helpers";

beforeEach(() => {
  vi.stubEnv("TMDB_API_KEY", "cle-de-test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const LIST = /^https:\/\/api\.themoviedb\.org\/3\/(trending\/movie\/week|movie\/(?:popular|top_rated|now_playing)|person\/popular)\?/;
const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

/** Listes TMDB construites à partir des fiches enregistrées, avec doublons et entrées à écarter. */
function stubLists() {
  return stubFetch((url) => {
    const match = url.match(LIST);
    if (!match) return undefined;
    if (match[1] === "person/popular") {
      return json({ results: [fixture("person-287"), fixture("person-1126"), { id: 9, name: "Réservé aux adultes", adult: true }] });
    }
    return json({ results: [fixture("movie-550"), fixture("movie-496243"), { id: 7, title: "X", adult: true }, { id: 8, title: "" }] });
  });
}

async function call() {
  const res = mockRes();
  await handler(request("/api/sitemap"), res);
  return res;
}

const locs = (body: unknown) => [...String(body).matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

describe("sitemap.xml", () => {
  it("liste les pages fixes puis les fiches, avec les URL exactes de l'application", async () => {
    stubLists();
    const res = await call();
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/xml; charset=utf-8");
    expect(res.headers["cache-control"]).toContain("s-maxage=86400");
    expect(locs(res.body)).toEqual([
      "https://cineyast.com/",
      "https://cineyast.com/explorer",
      `https://cineyast.com${movieHref(fixture("movie-550"))}`,
      `https://cineyast.com${movieHref(fixture("movie-496243"))}`,
      `https://cineyast.com${personHref(fixture("person-287"))}`,
      `https://cineyast.com${personHref(fixture("person-1126"))}`,
    ]);
  });

  it("document XML conforme au protocole : en-tête, espace de noms, une <loc> par <url>", async () => {
    stubLists();
    const body = String((await call()).body);
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(body.trimEnd().endsWith("</urlset>")).toBe(true);
    expect(body.match(/<url>/g)).toHaveLength(locs(body).length);
    expect(body).not.toContain("/favoris");
  });

  it("interroge chaque page de chaque liste en français, À l'affiche sur la France", async () => {
    const { calls } = stubLists();
    await call();
    const tmdb = calls.filter((url) => LIST.test(url));
    const expected = [...MOVIE_LISTS, ...PERSON_LISTS].reduce((sum, [, , pages]) => sum + pages, 0);
    expect(tmdb).toHaveLength(expected);
    expect(tmdb.every((url) => new URL(url).searchParams.get("language") === "fr-FR")).toBe(true);
    expect(tmdb.filter((url) => url.includes("/movie/now_playing?")).every((url) => new URL(url).searchParams.get("region") === "FR")).toBe(true);
  });

  it("TMDB injoignable : sitemap valide avec les pages fixes, en cache court", async () => {
    stubFetch((url) => (LIST.test(url) ? Promise.reject(new Error("réseau")) : undefined));
    const res = await call();
    expect(res.statusCode).toBe(200);
    expect(locs(res.body)).toEqual(["https://cineyast.com/", "https://cineyast.com/explorer"]);
    expect(res.headers["cache-control"]).toContain("s-maxage=600");
  });

  it("sans clé TMDB : aucun appel réseau, pages fixes seulement", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    const { calls } = stubFetch();
    const res = await call();
    expect(calls).toHaveLength(0);
    expect(locs(res.body)).toEqual(["https://cineyast.com/", "https://cineyast.com/explorer"]);
  });
});
