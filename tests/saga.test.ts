import { afterEach, describe, expect, it, vi } from "vitest";
import { CINEASTES_BELGES, cineasteDuMois, naissance } from "@/lib/cineasteBelge";
import { filmsDeLaSaga, nomDeSaga } from "@/lib/saga";
import { api, type Collection } from "@/lib/tmdb";

const film = (id: number, release_date: string, adult = false) => ({ id, title: `Film ${id}`, release_date, adult }) as Collection["parts"][number];

describe("la saga", () => {
  it("nom sans le suffixe ajouté par TMDB", () => {
    expect(nomDeSaga("Le Seigneur des anneaux - Saga")).toBe("Le Seigneur des anneaux");
    expect(nomDeSaga("Matrix – Collection")).toBe("Matrix");
    expect(nomDeSaga("Kung Fu Panda (Saga)")).toBe("Kung Fu Panda");
    expect(nomDeSaga("Saga Twilight")).toBe("Saga Twilight");
  });

  it("ordre de sortie, épisodes annoncés sans date à la fin, films pour adultes écartés", () => {
    const parts = [film(5, ""), film(2, "2003-12-17"), film(1, "2001-12-19"), film(9, "2002-01-01", true), film(3, "2002-12-18")];
    expect(filmsDeLaSaga({ parts }).map((f) => f.id)).toEqual([1, 3, 2, 5]);
  });

  describe("requête", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("endpoint collection", async () => {
      const calls: URLSearchParams[] = [];
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => {
          calls.push(new URL(url, "http://localhost").searchParams);
          return new Response(JSON.stringify({ id: 119, name: "Le Seigneur des anneaux - Saga", overview: "", parts: [] }), { status: 200 });
        }),
      );
      await api.collection(119);
      expect(calls[0].get("path")).toBe("/collection/119");
    });
  });
});

describe("cinéaste belge du mois", () => {
  it("douze entrées, une par mois, identifiants uniques, duos à deux identifiants", () => {
    expect(CINEASTES_BELGES).toHaveLength(12);
    const ids = CINEASTES_BELGES.flatMap((c) => c.ids);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cineaste of CINEASTES_BELGES) {
      expect(cineaste.ids.length).toBeGreaterThanOrEqual(1);
      expect(cineaste.ids.length).toBeLessThanOrEqual(2);
      if (cineaste.ids.length === 2) expect(cineaste.nom).toMatch(/ et /);
    }
    expect(cineasteDuMois(new Date(2026, 0, 15)).nom).toBe("Chantal Akerman");
    expect(cineasteDuMois(new Date(2026, 1, 15)).ids).toEqual([56209, 45138]);
  });

  it("naissance accordée selon le genre TMDB", () => {
    expect(naissance({ birthday: "1950-06-06", gender: 1 })).toBe("Née en 1950");
    expect(naissance({ birthday: "1965-05-20", gender: 2 })).toBe("Né en 1965");
    expect(naissance({ birthday: null, gender: 2 })).toBe("");
  });
});
