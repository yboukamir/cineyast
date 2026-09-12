import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router/dom";

// Polices auto-hébergées (pas d'appel à Google Fonts : plus rapide et conforme RGPD).
// Bodoni en version « standard » = axes graisse + taille optique : le contraste
// des pleins et déliés s'adapte automatiquement aux grands titres.
import "@fontsource-variable/bodoni-moda/standard.css";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import "@fontsource-variable/hanken-grotesk/wght.css";
import "@fontsource-variable/big-shoulders-display";
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
