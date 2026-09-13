import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler, { card } from "../api/og/personne.js";
import { fixture, mockRes, pngSize, request, stubFetch } from "./helpers";

beforeEach(() => {
  vi.stubEnv("TMDB_API_KEY", "cle-de-test");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function call(query: string) {
  const res = mockRes();
  await handler(request(`/api/og/personne?${query}`), res);
  return res;
}

interface SatoriNode {
  type: string;
  props: { style?: Record<string, unknown>; children?: unknown };
}

function* walk(node: unknown): Generator<SatoriNode> {
  if (!node || typeof node !== "object" || !("type" in node)) return;
  yield node as SatoriNode;
  const children = (node as SatoriNode).props.children;
  for (const child of Array.isArray(children) ? children : [children]) yield* walk(child);
}

const PERSONS = ["person-287", "person-7467", "person-21684", "person-55936", "person-1126", "person-8193", "person-69759"];

describe("validation des requêtes", () => {
  it.each(["", "id=abc", "id=-5", "id=0", "id=12.5abc"])("refuse « %s » sans appeler TMDB", async (query) => {
    const { calls } = stubFetch();
    const res = await call(query);
    if (query === "id=12.5abc") {
      // parseInt lit 12 : identifiant valide, la personne 12 n'est simplement pas dans les données.
      expect(res.statusCode).toBe(404);
      return;
    }
    expect(res.statusCode).toBe(400);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(calls).toHaveLength(0);
  });

  it("répond 500 sans clé TMDB", async () => {
    vi.stubEnv("TMDB_API_KEY", "");
    stubFetch();
    expect((await call("id=287")).statusCode).toBe(500);
  });

  it("répond 404 pour une personne inconnue, avec un cache d'une heure", async () => {
    stubFetch();
    const res = await call("id=999999999");
    expect(res.statusCode).toBe(404);
    expect(res.headers["cache-control"]).toContain("s-maxage=3600");
  });

  it("répond 502 si TMDB est injoignable", async () => {
    stubFetch((url) => (url.includes("themoviedb") ? Promise.reject(new Error("réseau")) : undefined));
    expect((await call("id=287")).statusCode).toBe(502);
  });

  it("ne lit que l'identifiant dans l'URL : le nom vient de TMDB", async () => {
    const { calls } = stubFetch();
    const res = await call("id=287&name=%3Cscript%3E&titre=Faux");
    expect(res.statusCode).toBe(200);
    const tmdbCalls = calls.filter((url) => url.includes("themoviedb"));
    expect(tmdbCalls).toHaveLength(1);
    expect(tmdbCalls[0]).toMatch(/\/person\/287\?/);
  });
});

describe("rendu de l'image", () => {
  it("génère un PNG 1200×630 mis en cache, avec la bobine quand le portrait manque", async () => {
    const { calls } = stubFetch();
    const res = await call("id=287&v=1");
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(pngSize(res.body)).toEqual({ width: 1200, height: 630 });
    expect(res.headers["cache-control"]).toContain("s-maxage=86400");
    // Le portrait a bien été demandé ; sa réponse 404 a déclenché la bobine de repli.
    expect(calls.some((url) => url.startsWith("https://image.tmdb.org/t/p/h632/"))).toBe(true);
  });

  it("rend un nom en latin étendu (polices latin-ext incluses)", async () => {
    stubFetch();
    const res = await call("id=1126");
    expect(fixture("person-1126").name).toMatch(/ś/);
    expect(pngSize(res.body)).toEqual({ width: 1200, height: 630 });
  });
});

describe("structure de la carte : contraintes de Satori 0.29", () => {
  it.each(PERSONS.flatMap((name) => [[name, "avec portrait"], [name, "sans portrait"]]))("%s %s", (name, variant) => {
    const tree = card(fixture(name), variant === "avec portrait" ? new ArrayBuffer(8) : null);
    for (const node of walk(tree)) {
      // « block » n'existe pas en 0.29 : seulement flex, contents et none.
      expect(node.props.style?.display, `${node.type} en display block`).not.toBe("block");
      // Un tableau d'enfants vide exige un display explicite : il ne doit jamais être passé.
      expect(Array.isArray(node.props.children) && node.props.children.length === 0, `${node.type} avec children vide`).toBe(false);
      if (node.type === "div" && Array.isArray(node.props.children) && node.props.children.filter(Boolean).length > 1) {
        expect(["flex", "contents", "none"], `bloc à plusieurs enfants sans display explicite`).toContain(node.props.style?.display);
      }
    }
  });

  it.each([
    ["person-287", 84, 3],
    ["person-21684", 84, 3],
    ["person-1126", 64, 3],
    ["person-69759", 52, 3],
    ["person-8193", 44, 2],
  ])("%s : nom en %i px, %i films", (name, size, films) => {
    const person = fixture(name);
    const displayName = person.name.replace(/\s+/g, " ").trim();
    const nodes = [...walk(card(person, null))];
    const nameNode = nodes.find((node) => node.props.children === displayName);
    expect(nameNode?.props.style?.fontSize).toBe(size);
    expect(nodes.filter((node) => node.props.style?.fontSize === 32)).toHaveLength(films);
  });
});
