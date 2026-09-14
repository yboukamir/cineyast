import { afterEach, describe, expect, it, vi } from "vitest";
import { choisirAffiches, libelleAffiche, MAX_AFFICHES } from "@/lib/affiches";
import { api, type MovieImage } from "@/lib/tmdb";

const affiche = (file_path: string, iso_639_1: string | null, vote_average = 5, vote_count = 1): MovieImage => ({
  file_path,
  iso_639_1,
  vote_average,
  vote_count,
  width: 1000,
  height: 1500,
});

describe("choix des affiches", () => {
  it("françaises d'abord, puis sans texte, chacune par note ; ni anglaises, ni affiche principale", () => {
    const posters = [
      affiche("/en.jpg", "en", 9),
      affiche("/sans-texte-bien-note.jpg", null, 8),
      affiche("/fr-moyenne.jpg", "fr", 5.2),
      affiche("/principale.jpg", "fr", 9.5),
      affiche("/fr-top.jpg", "fr", 6),
      affiche("/sans-texte.jpg", null, 5, 10),
      affiche("/sans-texte-ex-aequo.jpg", null, 5, 2),
    ];
    expect(choisirAffiches(posters, "/principale.jpg").map((p) => p.file_path)).toEqual([
      "/fr-top.jpg",
      "/fr-moyenne.jpg",
      "/sans-texte-bien-note.jpg",
      "/sans-texte.jpg",
      "/sans-texte-ex-aequo.jpg",
    ]);
  });

  it("sans doublon et limitée à 12", () => {
    const posters = [affiche("/a.jpg", "fr"), affiche("/a.jpg", "fr"), ...Array.from({ length: 20 }, (_, i) => affiche(`/${i}.jpg`, null))];
    const choix = choisirAffiches(posters, null);
    expect(choix).toHaveLength(MAX_AFFICHES);
    expect(choix.filter((p) => p.file_path === "/a.jpg")).toHaveLength(1);
  });

  it("libellés affichés sous chaque vignette", () => {
    expect(libelleAffiche(affiche("/x.jpg", "fr"))).toBe("Version française");
    expect(libelleAffiche(affiche("/x.jpg", null))).toBe("Sans texte");
  });
});

describe("requête des affiches", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("endpoint images du film, langues française et sans texte", async () => {
    const calls: URLSearchParams[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(new URL(url, "http://localhost").searchParams);
        return new Response(JSON.stringify({ id: 550, posters: [affiche("/a.jpg", "fr")] }), { status: 200 });
      }),
    );
    const images = await api.movieImages(550);
    expect(calls[0].get("path")).toBe("/movie/550/images");
    expect(calls[0].get("include_image_language")).toBe("fr,null");
    expect(images.posters).toHaveLength(1);
  });
});
