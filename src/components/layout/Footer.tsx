import { Link } from "react-router";
import { Wordmark } from "@/components/layout/Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-ink-2/40">
      <div className="marquee-lights" aria-hidden />
      <div className="px-page grid gap-10 py-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <Link to="/" aria-label="Cineyast — accueil" className="inline-block">
            <Wordmark />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mute">
            Une salle de découverte pour cinéphiles : tendances de la semaine, recherche, fiches détaillées et
            recommandations.
          </p>
          <nav aria-label="Pied de page" className="marquee mt-6 flex gap-5 text-xs text-bone/70">
            <Link to="/" className="hover:text-gold">
              Accueil
            </Link>
            <Link to="/explorer" className="hover:text-gold">
              Explorer
            </Link>
            <Link to="/favoris" className="hover:text-gold">
              Favoris
            </Link>
          </nav>
        </div>

        <div className="text-sm leading-relaxed text-mute md:text-right">
          <p className="marquee text-xs text-gold">Source des données</p>
          {/* Logo et mention d'attribution exigés par les conditions d'utilisation de l'API TMDB.
              Le logo doit rester moins proéminent que celui du site. */}
          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block transition-opacity hover:opacity-75"
          >
            <img
              src="/tmdb-logo.svg"
              alt="The Movie Database (TMDB)"
              width={273}
              height={36}
              className="h-5 w-auto"
            />
          </a>
          <p className="mt-4">Ce produit utilise l'API TMDB mais n'est pas approuvé ou certifié par TMDB.</p>
          <p className="mt-1">Bandes-annonces hébergées par YouTube.</p>
          <p className="mt-6 text-xs">
            © {new Date().getFullYear()} Cineyast · Conçu et développé par Yassine Boukamir
          </p>
        </div>
      </div>
    </footer>
  );
}
