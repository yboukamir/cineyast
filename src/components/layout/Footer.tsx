import { Link } from "react-router";
import { Wordmark } from "@/components/layout/Logo";

const LIENS = [
  { to: "/", label: "Accueil" },
  { to: "/explorer", label: "Explorer" },
  { to: "/favoris", label: "Favoris" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t-[3px] border-noir bg-noir text-creme">
      <div className="mx-auto grid max-w-page gap-10 px-gouttiere py-12 md:grid-cols-[1.4fr_1fr_1.2fr] md:px-gouttiere-lg md:py-16">
        <div>
          <Link to="/" aria-label="Cineyast, accueil" className="inline-block">
            <Wordmark variant="pied" />
          </Link>
          <p className="mt-5 max-w-[42ch] text-[15px] leading-relaxed text-creme/90">
            Une salle de découverte pour cinéphiles : tendances de la semaine, recherche, fiches détaillées et
            recommandations.
          </p>
        </div>

        <nav aria-label="Pied de page" className="grid content-start gap-1">
          <p className="surtitre mb-2 !text-jaune">Naviguer</p>
          {LIENS.map((lien) => (
            <Link
              key={lien.to}
              to={lien.to}
              className="inline-flex h-11 items-center font-semibold decoration-2 underline-offset-4 hover:underline"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div>
          <p className="surtitre mb-3 !text-jaune">Source des données</p>
          <div className="flex items-start gap-4">
            {/* Logo et mention d'attribution exigés par les conditions d'utilisation de l'API TMDB.
                Le logo doit rester moins proéminent que celui du site. */}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-[92px] shrink-0 place-items-center border-2 border-creme bg-creme px-2"
            >
              <img src="/tmdb-logo.svg" alt="The Movie Database (TMDB)" width={273} height={36} className="h-auto w-full" />
            </a>
            <p className="text-sm leading-relaxed text-creme/90">
              Ce produit utilise l'API TMDB mais n'est pas approuvé ou certifié par TMDB.
            </p>
          </div>
          <p className="mt-4 text-sm text-creme/90">Bandes-annonces hébergées par YouTube.</p>
        </div>
      </div>
    </footer>
  );
}
