/**
 * Déploiement FTP vers l'hébergement LWS : `npm run build && npm run deploy`
 *
 * Identifiants lus dans .env.deploy (voir .env.deploy.example), jamais commités.
 * Les fichiers distants sans rapport (tmdb-config.php, cache…) ne sont pas touchés.
 *
 * Option : `npm run deploy -- --config` envoie aussi deploy/tmdb-config.php
 * UN NIVEAU AU-DESSUS du dossier web (hors d'atteinte depuis Internet).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { posix } from "node:path";
import { Client } from "basic-ftp";

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

const envFile = resolve(".env.deploy");
if (!existsSync(envFile)) fail("Fichier .env.deploy introuvable : copiez .env.deploy.example et complétez-le.");
process.loadEnvFile(envFile);

const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_REMOTE_DIR = "/htdocs", FTP_SECURE = "true" } = process.env;
if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) fail("FTP_HOST, FTP_USER et FTP_PASSWORD doivent être renseignés dans .env.deploy.");

const dist = resolve("dist");
if (!existsSync(join(dist, "index.html"))) fail("Aucun build trouvé : lancez d'abord `npm run build`.");

const withConfig = process.argv.includes("--config");
const configFile = resolve("deploy", "tmdb-config.php");
if (withConfig && !existsSync(configFile)) fail("deploy/tmdb-config.php introuvable (copiez deploy/tmdb-config.example.php).");

const remoteDir = FTP_REMOTE_DIR.replace(/\/+$/, "") || "/";
const client = new Client(30_000);

try {
  console.log(`→ Connexion à ${FTP_HOST}…`);
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
    secure: FTP_SECURE === "true",
    secureOptions: { servername: FTP_HOST },
  });

  await client.ensureDir(remoteDir);

  // index.html en DERNIER : un visiteur ne reçoit jamais une page qui pointe
  // vers des fichiers JS/CSS pas encore envoyés.
  const entries = readdirSync(dist).filter((name) => name !== "index.html");
  for (const name of entries) {
    const local = join(dist, name);
    console.log(`  ↑ ${name}`);
    if (statSync(local).isDirectory()) await client.uploadFromDir(local, name);
    else await client.uploadFrom(local, name);
  }
  // Fichiers propres à un hébergement Apache/PHP : ils ne sont pas dans dist/
  // (sinon Vercel les servirait en clair au lieu d'exécuter sa fonction).
  const php = resolve("deploy", "php");
  if (existsSync(php)) {
    console.log("  ↑ deploy/php (.htaccess, api/tmdb.php)");
    await client.uploadFromDir(php);
  }

  console.log("  ↑ index.html");
  await client.uploadFrom(join(dist, "index.html"), "index.html");

  if (withConfig) {
    const target = posix.join(posix.dirname(remoteDir), "tmdb-config.php");
    console.log(`  ↑ tmdb-config.php → ${target}`);
    await client.uploadFrom(configFile, target);
  }

  console.log(`\n✔ Déployé dans ${remoteDir}. Vérifiez : https://cineyast.com/api/tmdb.php?path=/genre/movie/list\n`);
} catch (err) {
  fail(`Échec du déploiement : ${err instanceof Error ? err.message : err}`);
} finally {
  client.close();
}
