/**
 * Concordance des règles recopiées à plusieurs endroits : navigateur (src/), fonctions
 * Vercel (api/), proxy de développement (server/) et proxy PHP (deploy/php/). Jusqu'ici,
 * seuls des commentaires « doit rester identique » les gardaient synchronisées.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as og from "../api/og/personne.js";
import * as share from "../api/share.js";
import { ALLOWED_PARAMS as VERCEL_PARAMS, ALLOWED_PATHS as VERCEL_PATHS } from "../api/tmdb.js";
import { ALLOWED_PARAMS as DEV_PARAMS, ALLOWED_PATHS as DEV_PATHS } from "../server/tmdb-dev-proxy";
import { buildFilmography, DEPARTMENTS } from "@/lib/filmography";
import { movieHref, personHref } from "@/lib/slug";
import { content, fixture, tags } from "./helpers";

const PERSONS = ["person-287", "person-7467", "person-21684", "person-55936", "person-1126", "person-8193", "person-69759"];
const page = "<html><head><title>x</title></head><body></body></html>";

describe("règles de filmographie", () => {
  it("traduction des métiers identique dans le navigateur, les aperçus et la carte", () => {
    expect(share.DEPARTMENTS).toEqual(DEPARTMENTS);
    expect(og.DEPARTMENTS).toEqual(DEPARTMENTS);
  });

  it("détection des apparitions et postes créatifs identiques entre aperçus et carte", () => {
    expect(og.SELF.source).toBe(share.SELF.source);
    expect(og.SELF.flags).toBe(share.SELF.flags);
    expect([...og.CREATIVE_JOBS].sort()).toEqual([...share.CREATIVE_JOBS].sort());
  });

  it.each(PERSONS)("%s : mêmes films crédités dans la page et dans les aperçus", (name) => {
    const p = fixture(name);
    const { sections } = buildFilmography(p);
    const page = new Set(sections.filter((s) => s.key !== "self").flatMap((s) => s.items.map((item) => item.id)));
    const isSelf = (character?: string) =>
      share.SELF.test(character?.trim() ?? "") || (character?.trim() ?? "").localeCompare(p.name, "fr", { sensitivity: "base" }) === 0;
    const server = new Set([
      ...p.movie_credits.cast.filter((c: { adult?: boolean; character?: string }) => !c.adult && !isSelf(c.character)).map((c: { id: number }) => c.id),
      ...p.movie_credits.crew.filter((c: { adult?: boolean; job: string }) => !c.adult && share.CREATIVE_JOBS.has(c.job)).map((c: { id: number }) => c.id),
    ]);
    expect([...page].sort()).toEqual([...server].sort());
  });

  it.each(PERSONS)("%s : mêmes films les plus connus dans les aperçus et sur la carte", (name) => {
    expect(og.knownForTitles(fixture(name), 3)).toEqual(share.knownForTitles(fixture(name), 3));
  });

  it.each(PERSONS)("%s : mêmes trois films les plus connus sur la page et dans l'aperçu partagé", (name) => {
    const p = fixture(name);
    const pageTitles = buildFilmography(p).knownFor.slice(0, 3).map((item) => item.title);
    expect(share.knownForTitles(p, 3)).toEqual(pageTitles);
  });
});

describe("URL canoniques", () => {
  it("fiche film : l'aperçu reprend exactement le lien de l'application", () => {
    const movie = fixture("movie-550");
    expect(content(tags(share.injectMovieMeta(page, movie)), "og:url")).toBe(`https://cineyast.com${movieHref(movie)}`);
  });

  it.each(PERSONS)("%s : l'aperçu reprend exactement le lien de l'application", (name) => {
    const person = fixture(name);
    expect(content(tags(share.injectPersonMeta(page, person)), "og:url")).toBe(`https://cineyast.com${personHref(person)}`);
  });
});

describe("listes blanches des trois proxys TMDB", () => {
  const php = readFileSync("deploy/php/api/tmdb.php", "utf8");
  const phpList = (constant: string) => {
    const block = php.match(new RegExp(`const ${constant} = \\[([\\s\\S]*?)\\];`));
    if (!block) throw new Error(`${constant} introuvable dans tmdb.php`);
    return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  };
  // Même expression, écrite /^\/movie$/ en JavaScript et #^/movie$# en PHP.
  const normalize = (sources: string[]) => sources.map((s) => s.replace(/\\\//g, "/")).sort();

  it("chemins autorisés identiques (Vercel, développement, PHP)", () => {
    const vercel = normalize(VERCEL_PATHS.map((re: RegExp) => re.source));
    expect(normalize(DEV_PATHS.map((re) => re.source))).toEqual(vercel);
    expect(normalize(phpList("ALLOWED_PATHS").map((p) => p.replace(/^#|#$/g, "")))).toEqual(vercel);
  });

  it("paramètres autorisés identiques (Vercel, développement, PHP)", () => {
    const vercel = [...VERCEL_PARAMS].sort();
    expect([...DEV_PARAMS].sort()).toEqual(vercel);
    expect(phpList("ALLOWED_PARAMS").sort()).toEqual(vercel);
  });

  it.each(["/trending/movie/week", "/movie/popular", "/movie/550", "/movie/550/images", "/genre/movie/list", "/search/movie", "/discover/movie", "/person/287"])(
    "le chemin utilisé par l'application %s est accepté partout",
    (path) => {
      expect(VERCEL_PATHS.some((re: RegExp) => re.test(path))).toBe(true);
      expect(DEV_PATHS.some((re) => re.test(path))).toBe(true);
    },
  );
});
