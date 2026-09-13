import { afterEach, describe, expect, it, vi } from "vitest";
import { count, releaseDateLong, releaseYear, runtime, score } from "@/lib/format";
import { movieHref, parseId, personHref, slugify } from "@/lib/slug";
import { api, directorsOf, frenchCertification, frenchWatchProviders, pickTrailer, type MovieDetail } from "@/lib/tmdb";
import { buildGroups } from "@/lib/watchProviders";
import { fixture } from "./helpers";

describe("slugs et identifiants", () => {
  it.each([
    ["Fight Club", "fight-club"],
    ["Krzysztof Kieślowski", "krzysztof-kieslowski"],
    ["Fast & Furious 4", "fast-furious-4"],
    ["Le Voyage de Chihiro", "le-voyage-de-chihiro"],
    ["Snowpiercer : Le Transperceneige", "snowpiercer-le-transperceneige"],
    ["지리멸렬", ""],
  ])("slugify(%s) = %s", (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });

  it("coupe à 60 caractères sans tiret final", () => {
    const slug = slugify("Oncle Boonmee (celui qui se souvient de ses vies antérieures) — version longue");
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("construit les liens des fiches, avec ou sans slug", () => {
    expect(movieHref({ id: 550, title: "Fight Club" })).toBe("/film/550-fight-club");
    expect(movieHref({ id: 1, title: "지리멸렬" })).toBe("/film/1");
    expect(personHref({ id: 287, name: "Brad Pitt" })).toBe("/personne/287-brad-pitt");
  });

  it.each([
    ["550-fight-club", 550],
    ["550", 550],
    ["abc", NaN],
    ["0", NaN],
    ["-5", NaN],
    [undefined, NaN],
  ])("parseId(%s) = %s", (param, id) => {
    expect(parseId(param)).toBe(id);
  });
});

describe("formatage français", () => {
  it("durées", () => {
    expect(runtime(139)).toBe("2 h 19");
    expect(runtime(120)).toBe("2 h");
    expect(runtime(45)).toBe("45 min");
    expect(runtime(null)).toBe("");
  });

  it("notes, années, dates et nombres", () => {
    expect(score(8.437)).toBe("8,4");
    expect(releaseYear("1999-10-15")).toBe("1999");
    expect(releaseYear(undefined)).toBe("");
    expect(releaseDateLong("1999-10-15")).toBe("15 octobre 1999");
    expect(releaseDateLong("pas-une-date")).toBe("");
    expect(count(32830)).toMatch(/^32\s830$/u);
  });
});

describe("extraction depuis une fiche TMDB (Fight Club)", () => {
  const movie = fixture("movie-550") as MovieDetail;

  it("choisit une bande-annonce YouTube, en privilégiant les vraies bandes-annonces", () => {
    const trailer = pickTrailer(movie.videos.results);
    expect(trailer?.site).toBe("YouTube");
    const hasTrailer = movie.videos.results.some((v) => v.site === "YouTube" && v.type === "Trailer");
    if (hasTrailer) expect(trailer?.type).toBe("Trailer");
  });

  it("traduit la classification française", () => {
    expect(frenchCertification(movie)).toBe("Interdit -16 ans");
  });

  it("liste les réalisateurs sans doublon", () => {
    expect(directorsOf(movie)).toEqual([{ id: 7467, name: "David Fincher" }]);
  });
});

describe("rangées de listes TMDB", () => {
  afterEach(() => vi.unstubAllGlobals());

  // Forme de la réponse /movie/upcoming?region=FR du 13/09/2026, réduite à trois films.
  const response = () =>
    new Response(
      JSON.stringify({
        dates: { minimum: "2026-09-16", maximum: "2026-10-07" },
        page: 1,
        total_pages: 4,
        total_results: 70,
        results: [
          { id: 299534, title: "Avengers : Endgame", release_date: "2019-04-24" },
          { id: 1, title: "Sortie du 16", release_date: "2026-09-16" },
          { id: 2, title: "Sortie du 7", release_date: "2026-10-07" },
        ],
      }),
      { status: 200 },
    );

  it("Prochainement : écarte les reprises datées d'avant la période annoncée", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response()));
    const page = await api.list("upcoming");
    expect(page.results.map((m) => m.id)).toEqual([1, 2]);
  });

  it("les autres listes ne sont pas filtrées : une reprise à l'affiche est bien à l'affiche", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response()));
    const page = await api.list("now_playing");
    expect(page.results.map((m) => m.id)).toEqual([299534, 1, 2]);
  });
});

describe("regroupement des offres de streaming en France", () => {
  const same = (a: { provider_id: number }[] = [], b: { provider_id: number }[] = []) =>
    a.length === b.length && a.every((p) => b.some((q) => q.provider_id === p.provider_id));

  it.each(["movie-550", "movie-496243"])("%s : location et achat fusionnés seulement s'ils sont identiques", (name) => {
    const fr = frenchWatchProviders(fixture(name) as MovieDetail);
    expect(fr).toBeDefined();
    const keys = buildGroups(fr!).map((g) => g.key);
    if (fr!.rent?.length && same(fr!.rent, fr!.buy)) {
      expect(keys).toContain("rent-buy");
      expect(keys).not.toContain("rent");
    } else {
      expect(keys).not.toContain("rent-buy");
    }
  });

  it("les données couvrent les deux cas (fusion et séparation)", () => {
    const merged = (name: string) => buildGroups(frenchWatchProviders(fixture(name) as MovieDetail)!).some((g) => g.key === "rent-buy");
    expect([merged("movie-550"), merged("movie-496243")].sort()).toEqual([false, true]);
  });

  it("trie les plateformes par priorité d'affichage TMDB", () => {
    for (const group of buildGroups(frenchWatchProviders(fixture("movie-550") as MovieDetail)!)) {
      const priorities = group.providers.map((p) => p.display_priority);
      expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
    }
  });
});
