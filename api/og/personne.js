/**
 * Image de partage 1200×630 d'une page personne (Open Graph).
 *
 * LinkedIn affiche l'og:image en grande carte paysage recadrée au centre : un portrait
 * TMDB brut y perdait le haut du visage. Cette fonction compose une carte au format
 * attendu : portrait entier à gauche, métier, nom et films les plus connus à droite, aux
 * couleurs de Cineyast.
 *
 * Appelée depuis les balises générées par api/share.js : /api/og/personne?id=287&v=1
 * Seul l'identifiant est lu dans l'URL. Le nom et les films viennent de TMDB (clé côté
 * serveur), pour qu'on ne puisse pas fabriquer de fausse carte au nom du site.
 *
 * Moteur Node.js (pas Edge) : une fonction Edge est limitée à 1 Mo compressé sur le plan
 * Hobby, polices comprises. Les polices sont incluses via vercel.json (includeFiles).
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "@vercel/og";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p";
const WIDTH = 1200;
const HEIGHT = 630;
const PORTRAIT_WIDTH = 420;

/** Mêmes teintes que @theme dans src/index.css. */
const C = {
  ink: "#0c0a09",
  ink2: "#15110f",
  ink3: "#211b17",
  bone: "#efe6d4",
  mute: "#a69d8c",
  gold: "#c8a45a",
  velvet: "#b52a25",
};

/** Doit rester cohérent avec DEPARTMENTS dans src/lib/filmography.ts. */
export const DEPARTMENTS = {
  Acting: "Interprétation",
  Directing: "Réalisation",
  Writing: "Scénario",
  Production: "Production",
  Editing: "Montage",
  Camera: "Image",
  Sound: "Son",
  Art: "Direction artistique",
  "Costume & Make-Up": "Costumes et maquillage",
  "Visual Effects": "Effets visuels",
  Lighting: "Lumière",
  Crew: "Équipe technique",
};

/** Mêmes règles que buildFilmography() dans src/lib/filmography.ts. */
export const SELF = /^(self|himself|herself|themselves|lui-même|elle-même|eux-mêmes)\b/i;
export const CREATIVE_JOBS = new Set(["Director", "Screenplay", "Writer", "Story", "Original Story", "Novel", "Characters", "Author", "Producer"]);

/**
 * Polices statiques en woff : Satori ne lit ni le woff2 ni les polices variables du site.
 * Chaque famille a deux sous-ensembles, latin et latin étendu (Kieślowski, Dvořák…).
 */
const FONT_DIR = join(process.cwd(), "api", "og", "_fonts");
const FONT_FILES = [
  ["Bodoni Moda", 500, "normal", "bodoni-moda-latin-500-normal.woff"],
  ["Bodoni Moda", 500, "normal", "bodoni-moda-latin-ext-500-normal.woff"],
  ["Bodoni Moda", 500, "italic", "bodoni-moda-latin-500-italic.woff"],
  ["Big Shoulders Display", 600, "normal", "big-shoulders-display-latin-600-normal.woff"],
  ["Big Shoulders Display", 600, "normal", "big-shoulders-display-latin-ext-600-normal.woff"],
  ["Hanken Grotesk", 400, "normal", "hanken-grotesk-latin-400-normal.woff"],
  ["Hanken Grotesk", 400, "normal", "hanken-grotesk-latin-ext-400-normal.woff"],
];
let fontsPromise;
const loadFonts = () =>
  (fontsPromise ??= Promise.all(
    FONT_FILES.map(async ([name, weight, style, file]) => ({ name, weight, style, data: await readFile(join(FONT_DIR, file)) })),
  ));

const isReadAccessToken = (key) => key.startsWith("eyJ") && key.split(".").length === 3;

async function fetchPerson(id, key) {
  const params = new URLSearchParams({ language: "fr-FR", append_to_response: "movie_credits" });
  const headers = { accept: "application/json" };
  if (isReadAccessToken(key)) headers.authorization = `Bearer ${key}`;
  else params.set("api_key", key);

  const response = await fetch(`${TMDB_BASE}/person/${id}?${params}`, { headers, signal: AbortSignal.timeout(4000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB : HTTP ${response.status}`);
  return response.json();
}

async function fetchPortrait(path) {
  const response = await fetch(`${IMG}/h632${path}`, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error(`portrait : HTTP ${response.status}`);
  return response.arrayBuffer();
}

/** Titres des films les plus votés, hors apparitions dans son propre rôle et postes non créatifs. */
export function knownForTitles(person, count) {
  const isSelf = (character) => {
    const role = character?.trim() ?? "";
    return SELF.test(role) || role.localeCompare(person.name, "fr", { sensitivity: "base" }) === 0;
  };
  const credits = [
    ...(person.movie_credits?.cast ?? []).filter((c) => !c.adult && !isSelf(c.character)),
    ...(person.movie_credits?.crew ?? []).filter((c) => !c.adult && CREATIVE_JOBS.has(c.job)),
  ];
  return [...new Map(credits.map((c) => [c.id, c])).values()]
    .filter((m) => m.title && m.vote_count > 0)
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, count)
    .map((m) => m.title);
}

/**
 * Élément Satori sans JSX : { type, props: { style, children } }.
 * Satori 0.29 (celui de @vercel/og 1.0.1) exige un display explicite dès que children est
 * un tableau, même vide, et n'accepte que flex, contents et none : un élément sans enfant
 * ne reçoit donc pas de propriété children.
 */
const el = (type, style, children) => ({
  type,
  props: children === undefined || (Array.isArray(children) && children.length === 0) ? { style } : { style, children },
});

/** Bobine de film, même dessin que le logo : repli quand TMDB n'a pas de portrait. */
function reelPlaceholder() {
  const hole = (left, top) =>
    el("div", { position: "absolute", left, top, width: 38, height: 38, borderRadius: 19, backgroundColor: C.ink2 }, []);
  return el("div", { display: "flex", alignItems: "center", justifyContent: "center", width: PORTRAIT_WIDTH, height: HEIGHT, backgroundColor: C.ink2 }, [
    el("div", { display: "flex", position: "relative", width: 160, height: 160, borderRadius: 80, backgroundColor: C.gold }, [
      hole(99, 61), hole(80, 94), hole(42, 94), hole(23, 61), hole(42, 28), hole(80, 28),
      el("div", { position: "absolute", left: 71, top: 71, width: 18, height: 18, borderRadius: 9, backgroundColor: C.velvet }, []),
    ]),
  ]);
}

export function card(person, portrait) {
  const department = DEPARTMENTS[person.known_for_department] ?? "";
  // Satori ne mesure pas le texte : taille du nom par paliers de longueur, pour qu'il tienne
  // sur une ligne (« Krzysztof Kieślowski » à 68 px passait sur deux lignes et écrasait la liste).
  // Blancs multiples et retours à la ligne ramenés à une espace simple (données saisies à la main sur TMDB).
  const name = person.name.replace(/\s+/g, " ").trim();
  const nameSize = name.length > 28 ? 44 : name.length > 20 ? 52 : name.length > 14 ? 64 : 84;
  const films = knownForTitles(person, name.length > 28 ? 2 : 3).map((title) => title.replace(/\s+/g, " ").trim());
  const label = { fontFamily: "Big Shoulders Display", fontWeight: 600, textTransform: "uppercase" };

  const left = portrait
    ? el("div", { display: "flex", position: "relative", width: PORTRAIT_WIDTH, height: HEIGHT }, [
        el("img", { width: PORTRAIT_WIDTH, height: HEIGHT, objectFit: "cover", objectPosition: "center top" }, undefined),
        // Fondu vers le fond sur le bord droit du portrait.
        el("div", { position: "absolute", top: 0, right: 0, width: 160, height: HEIGHT, backgroundImage: `linear-gradient(to right, rgba(12, 10, 9, 0), ${C.ink})` }, []),
      ])
    : reelPlaceholder();
  if (portrait) Object.assign(left.props.children[0].props, { src: portrait, width: PORTRAIT_WIDTH, height: HEIGHT });

  return el("div", { display: "flex", width: WIDTH, height: HEIGHT, backgroundColor: C.ink, fontFamily: "Hanken Grotesk", color: C.bone }, [
    left,
    el("div", { display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "52px 64px 48px 44px" }, [
      el("div", { display: "flex", alignItems: "baseline", fontFamily: "Bodoni Moda", fontWeight: 500, fontSize: 36 }, [
        "Cine",
        el("span", { fontStyle: "italic", color: C.gold }, "yast"),
      ]),

      el("div", { display: "flex", flexDirection: "column" }, [
        department ? el("div", { ...label, fontSize: 26, letterSpacing: 5, color: C.gold }, department) : null,
        el("div", { display: "flex", fontFamily: "Bodoni Moda", fontWeight: 500, fontSize: nameSize, lineHeight: 1.02, marginTop: 10, maxWidth: 660 }, name),
        el("div", { width: 72, height: 2, backgroundColor: C.gold, marginTop: 30, marginBottom: 26 }, []),
        ...(films.length
          ? [
              el("div", { ...label, fontSize: 20, letterSpacing: 4, color: C.mute }, "Films les plus connus"),
              ...films.map((title) =>
                el("div", { display: "flex", fontSize: 32, marginTop: 10, maxWidth: 640, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, title),
              ),
            ]
          : [el("div", { fontSize: 30, color: C.mute }, "Filmographie sur Cineyast")]),
      ].filter(Boolean)),

      el("div", { ...label, display: "flex", fontSize: 22, letterSpacing: 4, color: C.mute }, "cineyast.com"),
    ]),
  ]);
}

export default async function handler(req, res) {
  const id = Number.parseInt(new URL(req.url, "https://cineyast.com").searchParams.get("id") ?? "", 10);
  if (!Number.isInteger(id) || id <= 0) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(400).send("Identifiant invalide.");
  }

  const key = (process.env.TMDB_API_KEY ?? "").trim();
  if (!key) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).send("TMDB_API_KEY n'est pas configurée.");
  }

  let person;
  try {
    person = await fetchPerson(id, key);
  } catch {
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    return res.status(502).send("TMDB est momentanément injoignable.");
  }
  if (!person?.name) {
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
    return res.status(404).send("Personne introuvable.");
  }

  try {
    const [fonts, portrait] = await Promise.all([
      loadFonts(),
      // Portrait indisponible : la carte s'affiche quand même, avec la bobine.
      person.profile_path ? fetchPortrait(person.profile_path).catch(() => null) : null,
    ]);
    const image = new ImageResponse(card(person, portrait), { width: WIDTH, height: HEIGHT, fonts });
    const png = Buffer.from(await image.arrayBuffer());

    res.setHeader("Content-Type", "image/png");
    // Une journée sur le CDN, resservie périmée une semaine le temps de régénérer.
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
    return res.status(200).send(png);
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(500).send(`Génération impossible : ${err instanceof Error ? err.message : String(err)}`);
  }
}
