import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Configuration séparée de vite.config.ts : les tests n'ont besoin ni de React, ni de
// Tailwind, ni du proxy de développement, seulement de l'alias « @ ».
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Le rendu d'une carte de partage (Satori + Resvg) prend environ une seconde.
    testTimeout: 30_000,
  },
});
