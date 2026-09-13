import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";

// Polices auto-hébergées (pas d'appel à Google Fonts : plus rapide et conforme RGPD).
// Bebas Neue : titres, chiffres et logo (latin + latin étendu : É, À, Œ, Ç…).
// Figtree en variable : texte courant, graisses 400 à 700 et italique des accroches.
import "@fontsource/bebas-neue";
import "@fontsource-variable/figtree/wght.css";
import "@fontsource-variable/figtree/wght-italic.css";
import "./index.css";

import { queryClient } from "@/hooks/queries";
import { router } from "./router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
