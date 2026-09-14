import { describe, expect, it } from "vitest";
import { autresFilms, MAX_FILMS_REALISATION, MIN_VOTES_REALISATION, nomsRealisation, titreMemeRealisation } from "@/lib/memeRealisateur";
import type { PersonCrewCredit, PersonDetail } from "@/lib/tmdb";
import { fixture } from "./helpers";

const credit = (id: number, extra: Partial<PersonCrewCredit> = {}) =>
  ({ id, title: `Film ${id}`, job: "Director", department: "Directing", credit_id: `c${id}`, release_date: "2000-01-01", vote_count: 100, genre_ids: [18], ...extra }) as PersonCrewCredit;
const personne = (crew: PersonCrewCredit[]) => ({ movie_credits: { cast: [], crew } }) as Pick<PersonDetail, "movie_credits">;

describe("autres films du réalisateur", () => {
  it("David Fincher depuis Fight Club : réalisations seules, sans Fight Club, les plus connues d'abord", () => {
    const films = autresFilms([fixture("person-7467")], 550);
    expect(films.length).toBeGreaterThanOrEqual(5);
    expect(films.length).toBeLessThanOrEqual(MAX_FILMS_REALISATION);
    expect(films.map((f) => f.id)).not.toContain(550);
    expect(films.every((f) => f.job === "Director" && f.vote_count >= MIN_VOTES_REALISATION && !f.genre_ids?.includes(10770))).toBe(true);
    const votes = films.map((f) => f.vote_count);
    expect(votes).toEqual([...votes].sort((a, b) => b - a));
    // Seven, son film le plus voté après Fight Club, ouvre la rangée.
    expect(films[0].id).toBe(807);
  });

  it("écarte téléfilms, films trop peu votés, sans date, pour adultes et postes autres que la réalisation", () => {
    const films = autresFilms(
      [
        personne([
          credit(1),
          credit(2, { genre_ids: [10770] }),
          credit(3, { vote_count: MIN_VOTES_REALISATION - 1 }),
          credit(4, { release_date: "" }),
          credit(5, { adult: true }),
          credit(6, { job: "Producer" }),
          credit(99),
        ]),
      ],
      99,
    );
    expect(films.map((f) => f.id)).toEqual([1]);
  });

  it("deux réalisateurs : films communs une seule fois", () => {
    const films = autresFilms([personne([credit(1, { vote_count: 50 }), credit(2)]), personne([credit(2), credit(3, { vote_count: 500 })])], 42);
    expect(films.map((f) => f.id)).toEqual([3, 2, 1]);
  });
});

describe("intitulés de la rangée", () => {
  it("accord selon le genre TMDB (1 = femme), masculin si inconnu ou mixte", () => {
    expect(titreMemeRealisation([{ gender: 2 }])).toBe("Du même réalisateur");
    expect(titreMemeRealisation([{ gender: 1 }])).toBe("De la même réalisatrice");
    expect(titreMemeRealisation([{ gender: 0 }])).toBe("Du même réalisateur");
    expect(titreMemeRealisation([{ gender: 1 }, { gender: 1 }])).toBe("Des mêmes réalisatrices");
    expect(titreMemeRealisation([{ gender: 1 }, { gender: 2 }])).toBe("Des mêmes réalisateurs");
  });

  it("noms des réalisateurs", () => {
    expect(nomsRealisation(["David Fincher"])).toBe("David Fincher");
    expect(nomsRealisation(["Daniel Kwan", "Daniel Scheinert"])).toBe("Daniel Kwan et Daniel Scheinert");
    expect(nomsRealisation(["A", "B", "C"])).toBe("A, B et C");
  });
});
