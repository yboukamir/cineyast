/**
 * Enregistre de vraies réponses TMDB pour les tests automatisés : aucune donnée de film
 * n'est inventée. Les tests ne font ensuite plus aucun appel réseau (ni clé, ni TMDB en CI).
 *
 *   npm run fixtures
 *
 * Nécessite TMDB_API_KEY dans .env. À relancer seulement pour rafraîchir les données :
 * les tests vérifient des règles (tri, filtres, balises), pas des valeurs qui évoluent.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "tests", "fixtures");
const TMDB = "https://api.themoviedb.org/3";

if (!existsSync(join(ROOT, ".env"))) throw new Error("Fichier .env introuvable (TMDB_API_KEY requise).");
process.loadEnvFile(join(ROOT, ".env"));
const key = (process.env.TMDB_API_KEY ?? "").trim();
if (!key) throw new Error("TMDB_API_KEY est vide dans .env.");

/** Mêmes paramètres que l'application (src/lib/tmdb.ts) : les tests voient la vraie forme des données. */
const MOVIE = { language: "fr-FR", append_to_response: "credits,videos,recommendations,release_dates,watch/providers", include_video_language: "fr,en,null" };
const PERSON = { language: "fr-FR", append_to_response: "movie_credits,external_ids" };

const REQUESTS = [
  ["movie-550", "/movie/550", MOVIE, "Fight Club : location et achat identiques, bande-annonce, classification FR"],
  ["movie-496243", "/movie/496243", MOVIE, "Parasite : location et achat différents, pas d'abonnement"],
  ["person-287", "/person/287", PERSON, "Brad Pitt : acteur, apparitions « Self » et rôle à son propre nom"],
  ["person-7467", "/person/7467", PERSON, "David Fincher : réalisateur, crédits « Thanks » et postes techniques"],
  ["person-21684", "/person/21684", PERSON, "Bong Joon-ho : réalisateur, scénario, films sans date"],
  ["person-55936", "/person/55936", PERSON, "Jemaine Clement : biographie française absente"],
  ["person-1126", "/person/1126", PERSON, "Krzysztof Kieślowski : nom en latin étendu"],
  ["person-8193", "/person/8193", PERSON, "Florian Henckel von Donnersmarck : nom de 32 caractères"],
  ["person-69759", "/person/69759", PERSON, "Apichatpong Weerasethakul : nom de 25 caractères (palier de taille intermédiaire)"],
];

mkdirSync(join(OUT, "tmdb"), { recursive: true });
const index = [];

for (const [name, path, params, why] of REQUESTS) {
  const query = new URLSearchParams({ ...params, api_key: key });
  const response = await fetch(`${TMDB}${path}?${query}`);
  if (!response.ok) throw new Error(`${path} : HTTP ${response.status}`);
  const body = await response.text();
  if (body.includes(key)) throw new Error(`${path} : la réponse contient la clé, enregistrement annulé.`);
  writeFileSync(join(OUT, "tmdb", `${name}.json`), body);
  index.push(`| \`tmdb/${name}.json\` | \`${path}\` | ${why} |`);
  console.log(`enregistré : tmdb/${name}.json (${Math.round(body.length / 1024)} Ko)`);
}

// Page HTML servie en production : c'est elle que api/share.js enrichit.
const shell = await (await fetch("https://cineyast.vercel.app/index.html")).text();
if (!shell.includes('id="root"')) throw new Error("index.html de production inattendu.");
writeFileSync(join(OUT, "index.html"), shell);
console.log(`enregistré : index.html (${Math.round(shell.length / 1024)} Ko)`);

const date = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(OUT, "README.md"),
  `# Données de test

Réponses réelles de l'API TMDB, enregistrées le ${date} par \`npm run fixtures\` — aucune donnée inventée.
Données fournies par [The Movie Database (TMDB)](https://www.themoviedb.org/) ; offres de streaming : JustWatch.

| Fichier | Requête | Cas couvert |
| --- | --- | --- |
${index.join("\n")}
| \`index.html\` | page de production | HTML enrichi par \`api/share.js\` |
`,
);
console.log("enregistré : README.md");
const size = readFileSync(join(OUT, "index.html")).length;
console.log(`terminé (${REQUESTS.length} réponses TMDB + index.html de ${size} octets).`);
