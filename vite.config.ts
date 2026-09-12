import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tmdbDevProxy } from "./server/tmdb-dev-proxy";
import { CONTENT_SECURITY_POLICY } from "./server/security-headers";

export default defineConfig(({ mode }) => {
  // Le 3e argument "" charge TOUTES les variables du .env, y compris celles
  // sans préfixe VITE_. TMDB_API_KEY reste donc côté serveur Node : elle
  // n'est jamais injectée dans le bundle client (seul VITE_* l'est).
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss(), tmdbDevProxy(env.TMDB_API_KEY)],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    build: {
      target: "es2022",
      assetsInlineLimit: 0,
    },
    // Mêmes en-têtes qu'en production (public/.htaccess) pour vérifier en
    // local que la CSP ne casse rien : `npm run build && npm run preview`.
    preview: {
      headers: { "Content-Security-Policy": CONTENT_SECURITY_POLICY },
    },
  };
});
