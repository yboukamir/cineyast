/**
 * Image de partage 1200×630 d'une page personne (Open Graph).
 *
 * LinkedIn affiche l'og:image en grande carte paysage recadrée au centre : un portrait
 * TMDB brut y perdait le haut du visage. Cette fonction compose une carte au format
 * attendu, dans la charte « L'Affiche » : fond outremer, portrait entier dans un cadre noir
 * à ombre jaune, métier en étiquette, nom et films les plus connus à droite.
 *
 * Appelée depuis les balises générées par api/share.js : /api/og/personne?id=287&v=3
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
const PAD = 56;
const PORTRAIT_WIDTH = 328;
const PORTRAIT_HEIGHT = 492;

/** Mêmes teintes que @theme dans src/index.css. */
const C = {
  creme: "#FFFCF5",
  noir: "#111111",
  gris: "#5E5E5E",
  zone: "#EAE6DC",
  outremer: "#1F3BD9",
  jaune: "#FFD23F",
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
 * Chaque graisse a deux sous-ensembles, latin et latin étendu (Kieślowski, Dvořák…).
 */
const FONT_DIR = join(process.cwd(), "api", "og", "_fonts");
const FONT_FILES = [
  ["Bebas Neue", 400, "normal", "bebas-neue-latin-400-normal.woff"],
  ["Bebas Neue", 400, "normal", "bebas-neue-latin-ext-400-normal.woff"],
  ["Figtree", 600, "normal", "figtree-latin-600-normal.woff"],
  ["Figtree", 600, "normal", "figtree-latin-ext-600-normal.woff"],
  ["Figtree", 700, "normal", "figtree-latin-700-normal.woff"],
  ["Figtree", 700, "normal", "figtree-latin-ext-700-normal.woff"],
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

const initiales = (name) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

/** Portrait absent : affiche typographique, comme sur le site (jamais une silhouette générique). */
function portraitAbsent(name) {
  return el(
    "div",
    { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: PORTRAIT_WIDTH, height: PORTRAIT_HEIGHT, backgroundColor: C.creme },
    [
      el("div", { display: "flex", fontFamily: "Bebas Neue", fontSize: 150, lineHeight: 1, color: C.noir }, initiales(name)),
      el("div", { display: "flex", marginTop: 12, fontWeight: 700, fontSize: 17, letterSpacing: 2, textTransform: "uppercase", color: C.gris }, "Portrait indisponible"),
    ],
  );
}

export function card(person, portrait) {
  const department = DEPARTMENTS[person.known_for_department] ?? "";
  // Satori ne mesure pas le texte : taille du nom par paliers de longueur. En Bebas Neue (condensée,
  // en capitales), un nom jusqu'à ~20 caractères tient sur une ligne ; au-delà il passe sur deux,
  // ce qui reste lisible et laisse la place aux films (vérifié sur Weerasethakul et Henckel von
  // Donnersmarck). Au-delà de 40 caractères, le palier le plus petit évite une troisième ligne.
  // Blancs multiples et retours à la ligne ramenés à une espace simple (données saisies à la main sur TMDB).
  const name = person.name.replace(/\s+/g, " ").trim();
  const nameSize = name.length > 40 ? 48 : name.length > 28 ? 60 : name.length > 20 ? 72 : name.length > 14 ? 88 : 120;
  const films = knownForTitles(person, name.length > 28 ? 2 : 3).map((title) => title.replace(/\s+/g, " ").trim());

  const image = portrait
    ? { type: "img", props: { src: portrait, width: PORTRAIT_WIDTH, height: PORTRAIT_HEIGHT, style: { objectFit: "cover", objectPosition: "center top" } } }
    : portraitAbsent(name);

  // Ombre dure dessinée par deux aplats décalés : jaune puis noir, comme shadow-dure-jaune sur le site.
  const cadre = el("div", { display: "flex", position: "relative", width: PORTRAIT_WIDTH + 22, height: PORTRAIT_HEIGHT + 22 }, [
    el("div", { position: "absolute", left: 16, top: 16, width: PORTRAIT_WIDTH + 6, height: PORTRAIT_HEIGHT + 6, backgroundColor: C.noir }, []),
    el("div", { position: "absolute", left: 12, top: 12, width: PORTRAIT_WIDTH + 6, height: PORTRAIT_HEIGHT + 6, backgroundColor: C.jaune }, []),
    el("div", { display: "flex", position: "absolute", left: 0, top: 0, border: `3px solid ${C.noir}`, backgroundColor: C.zone }, [image]),
  ]);

  return el("div", { display: "flex", width: WIDTH, height: HEIGHT, padding: PAD, backgroundColor: C.outremer, fontFamily: "Figtree", fontWeight: 600, color: C.creme }, [
    cadre,
    el("div", { display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, marginLeft: 56 }, [
      el("div", { display: "flex", position: "relative", alignSelf: "flex-start", paddingLeft: 8, paddingRight: 8 }, [
        el("div", { position: "absolute", left: 0, right: 0, top: 22, height: 16, backgroundColor: C.jaune, transform: "rotate(-1.5deg)" }, []),
        el("div", { display: "flex", fontFamily: "Bebas Neue", fontSize: 48, lineHeight: 1, color: C.creme }, "Cinéyast"),
      ]),

      el("div", { display: "flex", flexDirection: "column" }, [
        department
          ? el(
              "div",
              { display: "flex", alignSelf: "flex-start", padding: "8px 16px 4px", border: `3px solid ${C.noir}`, boxShadow: `4px 4px 0 0 ${C.noir}`, backgroundColor: C.jaune, color: C.noir, fontFamily: "Bebas Neue", fontSize: 34, lineHeight: 1, letterSpacing: 1.5 },
              department,
            )
          : null,
        el("div", { display: "flex", marginTop: 20, maxWidth: 682, fontFamily: "Bebas Neue", fontSize: nameSize, lineHeight: 0.92, textShadow: `5px 5px 0 ${C.noir}` }, name),
        ...(films.length
          ? [
              el("div", { display: "flex", marginTop: 30, fontWeight: 700, fontSize: 18, letterSpacing: 3, textTransform: "uppercase", color: C.jaune }, "Films les plus connus"),
              ...films.map((title) =>
                el("div", { display: "flex", marginTop: 8, maxWidth: 682, fontSize: 32, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, title),
              ),
            ]
          : [el("div", { display: "flex", marginTop: 30, fontSize: 30 }, "Filmographie sur Cinéyast")]),
      ].filter(Boolean)),

      el("div", { display: "flex", fontWeight: 700, fontSize: 22, letterSpacing: 1 }, "cineyast.com"),
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
      // Portrait indisponible : la carte s'affiche quand même, avec l'affiche typographique.
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
