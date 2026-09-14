import { describe, expect, it } from "vitest";
import handler from "../api/pays.js";
import { infosPays, justWatchUrl, PAYS, PAYS_PAR_DEFAUT, paysConnu, paysDesLangues } from "@/lib/pays";
import { watchProviders, type MovieDetail } from "@/lib/tmdb";
import { fixture, mockRes, request } from "./helpers";

describe("pays des offres de streaming", () => {
  it("chaque pays a un code unique, un complément de lieu français et sa page JustWatch", () => {
    expect(new Set(PAYS.map((p) => p.code)).size).toBe(PAYS.length);
    for (const pays of PAYS) {
      expect(pays.code).toMatch(/^[A-Z]{2}$/);
      expect(pays.dans).toMatch(/^(en|au|à) \S/);
      expect(justWatchUrl(pays.code)).toBe(`https://www.justwatch.com/${pays.code.toLowerCase()}`);
    }
    expect(paysConnu(PAYS_PAR_DEFAUT)).toBe(true);
  });

  it("langues du navigateur : première région de la liste", () => {
    expect(paysDesLangues(["fr-BE", "fr"])).toBe("BE");
    expect(paysDesLangues(["fr", "en-US", "fr-CA"])).toBe("CA");
    expect(paysDesLangues(["fr_ch"])).toBe("CH");
    expect(paysDesLangues(["en-US", "fr"])).toBeUndefined();
    expect(paysDesLangues([])).toBeUndefined();
  });

  it("code inconnu : repli sur la France, sans atteindre le prototype", () => {
    expect(infosPays("US").code).toBe(PAYS_PAR_DEFAUT);
    expect(paysConnu("__proto__")).toBe(false);
    expect(paysConnu(null)).toBe(false);
    expect(infosPays("CA").dans).toBe("au Canada");
  });

  it("Fight Club : les offres suivent le pays demandé", () => {
    const movie = fixture("movie-550") as MovieDetail;
    const results = movie["watch/providers"]!.results;
    expect(watchProviders(movie, "BE")).toEqual(results.BE);
    expect(watchProviders(movie, "FR")).toEqual(results.FR);
    expect(watchProviders(movie, "FR")!.flatrate!.length).not.toBe(watchProviders(movie, "BE")!.flatrate!.length);
    expect(watchProviders(movie, "HT")).toBeUndefined();
  });
});

describe("api/pays", () => {
  const call = (headers: Record<string, string>, method = "GET") => {
    const res = mockRes();
    handler(request("/api/pays", { headers, method }), res);
    return res;
  };

  it("renvoie le pays détecté par Vercel, jamais dans un cache partagé", () => {
    const res = call({ "x-vercel-ip-country": "be" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ pays: "BE" });
    expect(res.headers["cache-control"]).toBe("private, no-store");
  });

  it.each([{}, { "x-vercel-ip-country": "" }, { "x-vercel-ip-country": "B3" }, { "x-vercel-ip-country": "BEL" }])("en-tête absent ou invalide %o : null", (headers) => {
    expect(call(headers).body).toEqual({ pays: null });
  });

  it("refuse les autres méthodes que GET et HEAD", () => {
    expect(call({ "x-vercel-ip-country": "BE" }, "POST").statusCode).toBe(405);
  });
});
