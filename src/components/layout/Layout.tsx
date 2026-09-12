import { Outlet, ScrollRestoration, useNavigation } from "react-router";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function Layout() {
  const navigation = useNavigation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Aller au contenu
      </a>

      <Header />

      {/* Fine barre dorée pendant le chargement d'une page à la demande. */}
      {navigation.state === "loading" ? (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden" role="progressbar" aria-label="Chargement">
          <div className="h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] bg-gold" />
        </div>
      ) : null}

      {/* Au moins un écran de haut : le pied de page démarre toujours sous la ligne de flottaison
          et ne peut plus sauter quand le contenu d'une page arrive (CLS mesuré à 0,17 sur les fiches). */}
      <main id="contenu" className="min-h-dvh flex-1">
        <Outlet />
      </main>

      <Footer />
      <ScrollRestoration />
    </div>
  );
}
