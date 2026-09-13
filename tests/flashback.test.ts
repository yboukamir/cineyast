import { afterEach, describe, expect, it, vi } from "vitest";
import { firstReleasesIn, flashbackMonth, flashbackTitle, flashbackWeek } from "@/lib/flashback";
import { api } from "@/lib/tmdb";

/** Date locale à midi : aucun fuseau ne peut faire glisser le jour. */
const on = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);

describe("période du flashback", () => {
  it("semaine de sortie du mercredi au mardi, 25 ans plus tôt", () => {
    // Le jeudi 13 septembre 2001 appartient à la semaine du mercredi 12.
    expect(flashbackWeek(on(2026, 9, 13))).toEqual({ kind: "week", from: "2001-09-12", to: "2001-09-18", year: 2001, month: 8 });
  });

  it("un mercredi ouvre sa semaine, un mardi la ferme", () => {
    expect(flashbackWeek(on(2026, 9, 12)).from).toBe("2001-09-12");
    expect(flashbackWeek(on(2026, 9, 18))).toMatchObject({ from: "2001-09-12", to: "2001-09-18" });
    expect(flashbackWeek(on(2026, 9, 19)).from).toBe("2001-09-19");
  });

  it("semaine à cheval sur deux années", () => {
    expect(flashbackWeek(on(2026, 12, 31))).toMatchObject({ from: "2001-12-26", to: "2002-01-01", year: 2001 });
  });

  it("29 février : dernier jour du même mois, 25 ans plus tôt", () => {
    expect(flashbackWeek(on(2028, 2, 29))).toMatchObject({ from: "2003-02-26", to: "2003-03-04" });
    expect(flashbackMonth(on(2028, 2, 29))).toMatchObject({ kind: "month", from: "2003-02-01", to: "2003-02-28", year: 2003 });
  });

  it("titres de la rangée", () => {
    expect(flashbackTitle(flashbackWeek(on(2026, 9, 13)))).toBe("Cette semaine, en 2001");
    expect(flashbackTitle(flashbackMonth(on(2026, 9, 13)))).toBe("En septembre 2001");
    expect(flashbackTitle(flashbackMonth(on(2028, 2, 29)))).toBe("En février 2003");
  });

  it("écarte les reprises, qui reviennent avec leur date d'origine", () => {
    const week = flashbackWeek(on(2026, 8, 1));
    const movies = [{ release_date: "2001-08-01" }, { release_date: "1938-12-19" }, { release_date: "" }, {}];
    expect(firstReleasesIn(movies, week)).toEqual([{ release_date: "2001-08-01" }]);
  });
});

describe("requêtes des nouvelles rangées", () => {
  afterEach(() => vi.unstubAllGlobals());

  /** Réponse /discover/movie minimale : seules les dates de sortie comptent ici. */
  const page = (dates: string[]) =>
    new Response(
      JSON.stringify({ page: 1, total_pages: 1, total_results: dates.length, results: dates.map((release_date, i) => ({ id: i + 1, title: `Film ${i + 1}`, release_date })) }),
      { status: 200 },
    );

  function stub(...responses: string[][]) {
    const calls: URLSearchParams[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(new URL(url, "http://localhost").searchParams);
        return page(responses[calls.length - 1] ?? []);
      }),
    );
    return calls;
  }

  it("flashback : une semaine assez fournie suffit, avec les filtres de sortie en France", async () => {
    const calls = stub(Array(6).fill("2001-09-12"));
    const result = await api.flashback(on(2026, 9, 13));

    expect(calls).toHaveLength(1);
    expect(Object.fromEntries(calls[0])).toMatchObject({
      path: "/discover/movie",
      region: "FR",
      sort_by: "vote_count.desc",
      "release_date.gte": "2001-09-12",
      "release_date.lte": "2001-09-18",
      with_release_type: "2|3",
    });
    expect(result.period.kind).toBe("week");
    expect(result.results).toHaveLength(6);
  });

  it("flashback : moins de 6 premières sorties dans la semaine, on passe au mois", async () => {
    // 5 sorties de la semaine + 3 reprises : la semaine ne compte que 5 films.
    const calls = stub([...Array(5).fill("2001-09-12"), "1938-12-19", "1974-04-19", "1960-01-01"], ["2001-09-05", "2001-09-26", "1999-01-01"]);
    const result = await api.flashback(on(2026, 9, 13));

    expect(calls).toHaveLength(2);
    expect(calls[1].get("release_date.gte")).toBe("2001-09-01");
    expect(calls[1].get("release_date.lte")).toBe("2001-09-30");
    expect(result.period.kind).toBe("month");
    expect(result.results.map((m) => m.release_date)).toEqual(["2001-09-05", "2001-09-26"]);
  });

  it("cinéma belge : pays d'origine, seuil de votes et films déjà sortis", async () => {
    const calls = stub(["2022-11-01"]);
    await api.belgianCinema();

    const params = calls[0];
    expect(params.get("path")).toBe("/discover/movie");
    expect(params.get("with_origin_country")).toBe("BE");
    expect(params.get("vote_count.gte")).toBe("50");
    expect(params.get("primary_release_date.lte")).toBe(new Date().toISOString().slice(0, 10));
  });
});
