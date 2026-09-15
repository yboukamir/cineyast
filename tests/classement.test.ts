import { afterEach, describe, expect, it, vi } from "vitest";
import { CLASSEMENTS, classementDuMois, lienClassement, sortiAvant, surtitreClassement, tailleClassement, titreClassement } from "@/lib/classement";
import { api } from "@/lib/tmdb";

/** Date locale à midi : aucun fuseau ne peut faire glisser le jour. */
const on = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);

/** Identifiants des genres films de TMDB (/genre/movie/list). */
const GENRES_TMDB = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];

describe("classement du mois", () => {
  it("onze genres différents connus de TMDB, puis le bilan de l'année en décembre", () => {
    expect(CLASSEMENTS).toHaveLength(12);
    const genres = CLASSEMENTS.flatMap((c) => (c.type === "genre" ? [c.genre] : []));
    expect(genres).toHaveLength(11);
    expect(new Set(genres).size).toBe(11);
    for (const genre of genres) expect(GENRES_TMDB).toContain(genre);
    expect(CLASSEMENTS[11].type).toBe("annee");
    for (const classement of CLASSEMENTS) expect(classement.minVotes).toBeGreaterThanOrEqual(1000);
  });

  it("thème, surtitre (avec élision), titre et lien « Tout voir »", () => {
    expect(classementDuMois(on(2026, 10, 1))).toMatchObject({ type: "genre", genre: 27 });
    expect(surtitreClassement(on(2026, 10, 31))).toBe("Classement d'octobre · Halloween");
    expect(surtitreClassement(on(2026, 9, 14))).toBe("Classement de septembre");
    expect(surtitreClassement(on(2027, 8, 1))).toBe("Classement d'août");
    expect(surtitreClassement(on(2027, 4, 10))).toBe("Classement d'avril · vacances de printemps");
    expect(surtitreClassement(on(2026, 12, 3))).toBe("Classement de décembre · bilan de l'année");

    const septembre = on(2026, 9, 14);
    expect(titreClassement(classementDuMois(septembre), septembre)).toBe("Drame : les 5 films les mieux notés");
    expect(lienClassement(classementDuMois(septembre), septembre)).toBe("/explorer?genres=18&tri=note");

    const decembre = on(2026, 12, 3);
    expect(tailleClassement(classementDuMois(decembre))).toBe(10);
    expect(titreClassement(classementDuMois(decembre), decembre)).toBe("Le meilleur de 2026 : les 10 films les mieux notés");
    expect(lienClassement(classementDuMois(decembre), decembre)).toBe("/explorer?annee=2026&tri=note");
  });

  it("films sortis depuis au moins un an, 29 février compris", () => {
    expect(sortiAvant(on(2026, 9, 14))).toBe("2025-09-14");
    expect(sortiAvant(on(2027, 1, 1))).toBe("2026-01-01");
    expect(sortiAvant(on(2028, 2, 29))).toBe("2027-03-01");
  });
});

describe("requêtes du classement", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stub(pages: { id: number; release_date: string }[][]) {
    const calls: URLSearchParams[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const params = new URL(url, "http://localhost").searchParams;
        calls.push(params);
        const results = (pages[Number(params.get("page") ?? 1) - 1] ?? []).map((m) => ({ ...m, title: `Film ${m.id}` }));
        return new Response(JSON.stringify({ page: 1, total_pages: 2, total_results: results.length, results }), { status: 200 });
      }),
    );
    return calls;
  }

  it("genre : discover trié par note, seuil de votes du thème, cinq films gardés", async () => {
    const calls = stub([Array.from({ length: 8 }, (_, i) => ({ id: i + 1, release_date: "2010-01-01" }))]);
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

  it("décembre : sorties de l'année en France sur deux pages, ressorties écartées, dix films gardés", async () => {
    const annee = (id: number) => ({ id, release_date: "2026-06-01" });
    const calls = stub([
      [annee(1), { id: 2, release_date: "1954-04-26" }, annee(3), annee(4), annee(5), annee(6)],
      [annee(7), annee(8), { id: 9, release_date: "" }, annee(10), annee(11), annee(12), annee(13)],
    ]);
    const page = await api.monthlyTop(on(2026, 12, 3));

    expect(calls).toHaveLength(2);
    expect(Object.fromEntries(calls[0])).toMatchObject({
      path: "/discover/movie",
      sort_by: "vote_average.desc",
      region: "FR",
      "release_date.gte": "2026-01-01",
      "release_date.lte": "2026-12-31",
      with_release_type: "2|3",
      "vote_count.gte": "1000",
    });
    expect(page.results.map((m) => m.id)).toEqual([1, 3, 4, 5, 6, 7, 8, 10, 11, 12]);
  });
});
