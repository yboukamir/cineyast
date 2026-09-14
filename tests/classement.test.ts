import { afterEach, describe, expect, it, vi } from "vitest";
import { CLASSEMENTS, classementDuMois, sortiAvant, surtitreClassement, TAILLE_CLASSEMENT, titreClassement } from "@/lib/classement";
import { api } from "@/lib/tmdb";

/** Date locale à midi : aucun fuseau ne peut faire glisser le jour. */
const on = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);

/** Identifiants des genres films de TMDB (/genre/movie/list). */
const GENRES_TMDB = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];

describe("classement du mois", () => {
  it("un classement par mois, douze genres différents, tous connus de TMDB", () => {
    expect(CLASSEMENTS).toHaveLength(12);
    expect(new Set(CLASSEMENTS.map((c) => c.genre)).size).toBe(12);
    for (const classement of CLASSEMENTS) {
      expect(GENRES_TMDB).toContain(classement.genre);
      expect(classement.minVotes).toBeGreaterThanOrEqual(1000);
    }
  });

  it("thème, surtitre (avec élision) et titre", () => {
    expect(classementDuMois(on(2026, 10, 1)).genre).toBe(27);
    expect(surtitreClassement(on(2026, 10, 31))).toBe("Classement d'octobre · Halloween");
    expect(surtitreClassement(on(2026, 9, 14))).toBe("Classement de septembre");
    expect(surtitreClassement(on(2027, 8, 1))).toBe("Classement d'août");
    expect(surtitreClassement(on(2027, 4, 10))).toBe("Classement d'avril · vacances de printemps");
    expect(titreClassement(classementDuMois(on(2026, 9, 14)))).toBe(`Drame : les ${TAILLE_CLASSEMENT} films les mieux notés`);
  });

  it("films sortis depuis au moins un an, 29 février compris", () => {
    expect(sortiAvant(on(2026, 9, 14))).toBe("2025-09-14");
    expect(sortiAvant(on(2027, 1, 1))).toBe("2026-01-01");
    expect(sortiAvant(on(2028, 2, 29))).toBe("2027-03-01");
  });
});

describe("requête du classement", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("discover trié par note, seuil de votes du thème, cinq films gardés", async () => {
    const calls: URLSearchParams[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(new URL(url, "http://localhost").searchParams);
        const results = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, title: `Film ${i + 1}` }));
        return new Response(JSON.stringify({ page: 1, total_pages: 1, total_results: 8, results }), { status: 200 });
      }),
    );

    const page = await api.monthlyTop(on(2026, 11, 5));

    expect(calls).toHaveLength(1);
    expect(Object.fromEntries(calls[0])).toMatchObject({
      path: "/discover/movie",
      sort_by: "vote_average.desc",
      with_genres: "99",
      "vote_count.gte": "1000",
      "primary_release_date.lte": "2025-11-05",
    });
    expect(page.results.map((m) => m.id)).toEqual([1, 2, 3, 4, 5]);
  });
});
