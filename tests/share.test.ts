import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler, { injectMovieMeta, injectPersonMeta } from "../api/share.js";
import { backdropSrcSet } from "@/lib/tmdb";
import { content, decode, fixture, mockRes, request, shell, stubFetch, tags } from "./helpers";

beforeEach(() => {
  vi.stubEnv("TMDB_API_KEY", "cle-de-test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function call(query: string, headers: Record<string, string> = { host: "cineyast.vercel.app" }) {
  const res = mockRes();
  await handler(request(`/api/share?${query}`, { headers }), res);
  return res;
}

describe("aperçu d'une fiche film", () => {
  it("produit les balises attendues pour Fight Club (non-régression)", async () => {
    stubFetch();
    const res = await call("type=film&slug=550-fight-club");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(tags(String(res.body))).toMatchSnapshot();
  });

  it("remplace les balises génériques de l'accueil au lieu de les dupliquer", async () => {
    stubFetch();
    const body = String((await call("type=film&slug=550-fight-club")).body);
    const lines = tags(body);
    expect(lines.filter((l) => l.startsWith("<title>"))).toEqual(["<title>Fight Club (1999) — Cineyast</title>"]);
    expect(lines.filter((l) => l.includes('"og:title"'))).toHaveLength(1);
    expect(body).not.toContain("films à découvrir, pour cinéphiles</title>");
    // L'application React reste servie.
    expect(body).toContain('id="root"');
    expect(body).toMatch(/<script type="module"/);
  });

  it("garde les lettres « s » et ramène la description sur une ligne (régression /s+/)", async () => {
    stubFetch();
    const lines = tags(String((await call("type=film&slug=550-fight-club")).body));
    const description = decode(content(lines, "og:description"));
    const overview: string = fixture("movie-550").overview.replace(/\s+/g, " ").trim();
    expect(description.startsWith(overview.slice(0, 60))).toBe(true);
    expect(description).toContain("sans");
    expect(description).not.toMatch(/[\r\n]/);
    expect(description.length).toBeLessThanOrEqual(200);
  });

  it("précharge l'image du haut de fiche avec exactement le srcset de la page", async () => {
    stubFetch();
    const lines = tags(String((await call("type=film&slug=550-fight-club")).body));
    const preload = lines.find((l) => l.startsWith('<link rel="preload"'));
    expect(preload).toBeDefined();
    expect(decode(preload)).toContain(`imagesrcset="${backdropSrcSet(fixture("movie-550").backdrop_path)}"`);
    expect(preload).toContain('imagesizes="100vw"');
  });
});

describe("aperçu d'une page personne", () => {
  it("pointe vers la carte générée 1200×630 et non vers le portrait brut", async () => {
    stubFetch();
    const lines = tags(String((await call("type=personne&slug=287-brad-pitt")).body));
    expect(content(lines, "og:title")).toBe("Brad Pitt");
    expect(content(lines, "og:type")).toBe("profile");
    expect(decode(content(lines, "og:image"))).toBe("https://cineyast.com/api/og/personne?id=287&v=2");
    expect(content(lines, "og:image:width")).toBe("1200");
    expect(content(lines, "og:image:height")).toBe("630");
    expect(content(lines, "twitter:card")).toBe("summary_large_image");
    expect(lines).toContain('<link rel="canonical" href="https://cineyast.com/personne/287-brad-pitt" />');
    expect(lines.some((l) => l.includes('rel="preload"'))).toBe(false);
  });

  it("résume la biographie sur une ligne de 200 caractères au plus", async () => {
    stubFetch();
    const description = decode(content(tags(String((await call("type=personne&slug=287-brad-pitt")).body)), "og:description"));
    expect(description.length).toBeGreaterThanOrEqual(100);
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).not.toMatch(/[\r\n]/);
  });

  it("sans biographie française, présente le métier et les films les plus connus", async () => {
    stubFetch();
    expect(fixture("person-55936").biography.trim()).toBe("");
    const lines = tags(String((await call("type=personne&slug=55936")).body));
    expect(decode(content(lines, "og:description"))).toMatch(/^Interprétation · Films les plus connus : .+\. Filmographie complète sur Cineyast\.$/);
    expect(content(lines, "og:url")).toBe("https://cineyast.com/personne/55936-jemaine-clement");
  });
});

describe("replis : la page d'origine est servie telle quelle", () => {
  it.each([
    ["personne inexistante", "type=personne&slug=999999999-inconnu"],
    ["film inexistant", "type=film&slug=999999999"],
    ["slug non numérique", "type=personne&slug=brad-pitt"],
  ])("%s", async (_, query) => {
    stubFetch();
    const res = await call(query);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(shell());
  });

  it.each(["inconnu", "constructor", "__proto__", "toString", ""])("type de page « %s » : aucun appel à TMDB", async (type) => {
    const { calls } = stubFetch();
    const res = await call(`type=${type}&slug=287`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(shell());
    expect(calls.some((url) => url.includes("themoviedb"))).toBe(false);
  });

  it("sans clé TMDB : aucun appel à TMDB", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    const { calls } = stubFetch();
    expect((await call("type=film&slug=550")).body).toBe(shell());
    expect(calls.some((url) => url.includes("themoviedb"))).toBe(false);
  });

  it("TMDB injoignable : page d'origine avec un cache court", async () => {
    stubFetch((url) => (url.includes("themoviedb") ? Promise.reject(new Error("réseau")) : undefined));
    const res = await call("type=film&slug=550");
    expect(res.body).toBe(shell());
    expect(res.headers["cache-control"]).toBe("public, max-age=0, s-maxage=60");
  });

  it("index.html indisponible : 502 jamais mis en cache", async () => {
    stubFetch((url) => (url.endsWith("/index.html") ? new Response("", { status: 500 }) : undefined));
    const res = await call("type=film&slug=550");
    expect(res.statusCode).toBe(502);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("n'utilise jamais un domaine inconnu comme source de index.html", async () => {
    const { calls } = stubFetch();
    await call("type=film&slug=550", { host: "site-malveillant.example" });
    expect(calls).toContain("https://cineyast.com/index.html");
    expect(calls.some((url) => url.includes("malveillant"))).toBe(false);
  });
});

describe("échappement HTML des données TMDB", () => {
  const head = (html: string) => html.split("</head>")[0];
  const page = "<html><head><title>x</title></head><body></body></html>";

  it("neutralise un nom et une biographie piégés", () => {
    const html = injectPersonMeta(page, {
      id: 1,
      name: 'A"><script>alert(1)</script>',
      biography: "</title>\n<script>alert(2)</script>",
      known_for_department: "Acting",
      profile_path: "/p.jpg",
      movie_credits: { cast: [], crew: [] },
    });
    expect(head(html)).not.toMatch(/<script/i);
    expect(head(html)).toContain("&lt;script&gt;");
    expect(head(html)).toContain("&quot;&gt;");
  });

  it("neutralise un titre et un synopsis piégés", () => {
    const html = injectMovieMeta(page, {
      id: 1,
      title: '"><img src=x onerror=alert(1)>',
      overview: "Ligne 1\n\n<script>alert(3)</script>",
      release_date: "2020-01-01",
      backdrop_path: null,
      poster_path: null,
    });
    expect(head(html)).not.toMatch(/<script|<img/i);
    expect(decode(content(tags(html), "og:description"))).not.toMatch(/[\r\n]/);
  });
});
