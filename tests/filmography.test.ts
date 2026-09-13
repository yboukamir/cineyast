import { describe, expect, it } from "vitest";
import { CREATIVE_JOBS, SELF } from "../api/share.js";
import { buildFilmography, type FilmographySection } from "@/lib/filmography";
import type { PersonDetail } from "@/lib/tmdb";
import { fixture } from "./helpers";

const PERSONS = ["person-287", "person-7467", "person-21684", "person-55936", "person-1126", "person-8193", "person-69759"];

const person = (name: string) => fixture(name) as PersonDetail;
const ids = (section?: FilmographySection) => new Set(section?.items.map((item) => item.id));
const section = (sections: FilmographySection[], key: FilmographySection["key"]) => sections.find((s) => s.key === key);

describe("regroupement des crédits", () => {
  it("Brad Pitt : un rôle à son propre nom est une apparition, pas un rôle", () => {
    const p = person("person-287");
    const { sections } = buildFilmography(p);
    const ownName = p.movie_credits.cast.filter((c) => c.character?.trim().toLowerCase() === p.name.toLowerCase());
    expect(ownName.length, "les données doivent contenir ce cas (The Trainer)").toBeGreaterThan(0);
    for (const credit of ownName) {
      expect(ids(section(sections, "self")).has(credit.id)).toBe(true);
      const stillActing = p.movie_credits.cast.some((c) => c.id === credit.id && c.character !== credit.character && !SELF.test(c.character ?? ""));
      if (!stillActing) expect(ids(section(sections, "acting")).has(credit.id)).toBe(false);
    }
  });

  it("Brad Pitt : le personnage est affiché sous le titre", () => {
    const acting = section(buildFilmography(person("person-287")).sections, "acting");
    const fightClub = acting?.items.find((item) => item.id === 550);
    expect(fightClub?.subtitle).toContain("Tyler Durden");
  });

  it.each(PERSONS)("%s : aucun film uniquement crédité en poste non créatif (remerciements, production exécutive…)", (name) => {
    const p = person(name);
    const { sections } = buildFilmography(p);
    const listed = new Set(sections.flatMap((s) => s.items.map((item) => item.id)));
    const creative = new Set([
      ...p.movie_credits.cast.map((c) => c.id),
      ...p.movie_credits.crew.filter((c) => CREATIVE_JOBS.has(c.job)).map((c) => c.id),
    ]);
    const nonCreativeOnly = p.movie_credits.crew.filter((c) => !creative.has(c.id)).map((c) => c.id);
    for (const id of nonCreativeOnly) expect(listed.has(id), `film ${id} affiché alors qu'il n'a qu'un crédit non créatif`).toBe(false);
  });

  it("David Fincher : « Les plus connus » exclut les films où il n'est que remercié ou technicien", () => {
    const p = person("person-7467");
    const { knownFor } = buildFilmography(p);
    const creative = new Set([
      ...p.movie_credits.cast.filter((c) => !SELF.test(c.character ?? "")).map((c) => c.id),
      ...p.movie_credits.crew.filter((c) => CREATIVE_JOBS.has(c.job)).map((c) => c.id),
    ]);
    const noise = p.movie_credits.crew.filter((c) => !creative.has(c.id));
    expect(noise.length, "les données doivent contenir des crédits non créatifs").toBeGreaterThan(0);
    for (const item of knownFor) expect(creative.has(item.id)).toBe(true);
  });

  it.each(PERSONS)("%s : un film n'apparaît qu'une fois par section", (name) => {
    for (const s of buildFilmography(person(name)).sections) {
      expect(new Set(s.items.map((item) => item.id)).size).toBe(s.items.length);
    }
  });
});

describe("ordre", () => {
  it.each([
    ["person-287", "acting"],
    ["person-7467", "directing"],
    ["person-21684", "directing"],
  ] as const)("%s : le métier principal ouvre la page (%s)", (name, key) => {
    expect(buildFilmography(person(name)).sections[0].key).toBe(key);
  });

  it.each(PERSONS)("%s : récent d'abord, films sans date en fin de liste", (name) => {
    for (const s of buildFilmography(person(name)).sections) {
      const dates = s.items.map((item) => item.release_date || "");
      const firstUndated = dates.findIndex((d) => !d);
      if (firstUndated !== -1) expect(dates.slice(firstUndated).every((d) => !d), `${s.key} : film daté après un film sans date`).toBe(true);
      const dated = dates.filter(Boolean);
      expect(dated, `${s.key} : dates non décroissantes`).toEqual([...dated].sort().reverse());
    }
  });

  it("la section des apparitions vient toujours en dernier", () => {
    for (const name of PERSONS) {
      const keys = buildFilmography(person(name)).sections.map((s) => s.key);
      if (keys.includes("self")) expect(keys.at(-1)).toBe("self");
    }
  });
});

describe("films les plus connus", () => {
  it.each(PERSONS)("%s : triés par nombre de votes, avec affiche, 10 au plus", (name) => {
    const { knownFor } = buildFilmography(person(name));
    expect(knownFor.length).toBeLessThanOrEqual(10);
    for (const item of knownFor) {
      expect(item.poster_path).toBeTruthy();
      expect(item.vote_count).toBeGreaterThan(0);
    }
    const votes = knownFor.map((item) => item.vote_count);
    expect(votes).toEqual([...votes].sort((a, b) => b - a));
  });
});
