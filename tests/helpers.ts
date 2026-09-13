import { readFileSync } from "node:fs";
import { join } from "node:path";
import { vi } from "vitest";

const FIXTURES = join(import.meta.dirname, "fixtures");

/** index.html de production, tel qu'enregistré par `npm run fixtures`. */
export const shell = () => readFileSync(join(FIXTURES, "index.html"), "utf8");

/** Réponse TMDB réelle enregistrée (voir tests/fixtures/README.md). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fixture = (name: string): any => JSON.parse(readFileSync(join(FIXTURES, "tmdb", `${name}.json`), "utf8"));

export interface MockRes {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  setHeader(name: string, value: string): void;
  status(code: number): MockRes;
  send(body: unknown): MockRes;
  json(body: unknown): MockRes;
}

/** Réponse au format des fonctions Vercel Node.js (req, res). */
export function mockRes(): MockRes {
  const res: MockRes = {
    statusCode: 0,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    send(body) {
      res.body = body;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
  };
  return res;
}

export const request = (url: string, extra: Record<string, unknown> = {}) => ({
  url,
  method: "GET",
  headers: { host: "cineyast.vercel.app" },
  ...extra,
});

type Override = (url: string) => Response | Promise<Response> | undefined;

/**
 * Remplace fetch : index.html et les réponses TMDB viennent des données enregistrées,
 * un identifiant absent des données répond 404 comme TMDB, et aucun portrait n'est
 * versionné (les images TMDB répondent 404). Tout autre appel réseau fait échouer le test.
 */
export function stubFetch(override?: Override) {
  const calls: string[] = [];
  const fn = vi.fn(async (input: string | URL) => {
    const url = String(input);
    calls.push(url);
    const custom = await override?.(url);
    if (custom) return custom;

    if (url.endsWith("/index.html")) return new Response(shell(), { status: 200 });
    const tmdb = url.match(/^https:\/\/api\.themoviedb\.org\/3\/(movie|person)\/(\d+)\?/);
    if (tmdb) {
      try {
        return new Response(JSON.stringify(fixture(`${tmdb[1]}-${tmdb[2]}`)), { status: 200 });
      } catch {
        return new Response(JSON.stringify({ status_code: 34, status_message: "The resource you requested could not be found." }), { status: 404 });
      }
    }
    if (url.startsWith("https://image.tmdb.org/")) return new Response("", { status: 404 });
    throw new Error(`appel réseau non prévu dans les tests : ${url}`);
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

/** Balises de partage et de référencement présentes dans un document HTML. */
export const tags = (html: string) =>
  html.match(/<title>[^<]*<\/title>|<meta (?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>|<link rel="(?:canonical|preload)"[^>]*>/g) ?? [];

/** Valeur brute (échappée) de l'attribut content d'une balise. */
export const content = (lines: string[], property: string) =>
  lines.find((line) => line.includes(`"${property}"`))?.match(/content="([^"]*)"/)?.[1];

export const decode = (value = "") =>
  value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Dimensions lues dans l'en-tête IHDR d'un PNG, ou null si ce n'est pas un PNG. */
export const pngSize = (body: unknown) =>
  Buffer.isBuffer(body) && body.subarray(1, 4).toString() === "PNG" ? { width: body.readUInt32BE(16), height: body.readUInt32BE(20) } : null;
