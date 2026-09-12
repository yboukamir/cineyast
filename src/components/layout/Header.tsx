import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { Compass, Heart } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Wordmark } from "@/components/layout/Logo";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

const navLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative flex h-10 items-center gap-2 px-2.5 transition-colors md:px-3",
    "marquee text-[13px]",
    "after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left after:bg-gold after:transition-transform",
    isActive ? "text-gold after:scale-x-100" : "text-bone/80 after:scale-x-0 hover:text-bone",
  );

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[background-color,border-color] duration-300",
        scrolled ? "border-line bg-ink/90 backdrop-blur-md" : "border-transparent bg-gradient-to-b from-ink/85 to-transparent",
      )}
    >
      <div className="px-page flex h-16 items-center gap-4 md:h-[4.5rem] md:gap-8">
        <Link to="/" aria-label="Cineyast — accueil" className="shrink-0">
          <Wordmark />
        </Link>

        {/* La page Explorer a déjà sa propre barre de recherche. */}
        {pathname !== "/explorer" ? (
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={(q) => {
              navigate(q ? `/explorer?q=${encodeURIComponent(q)}` : "/explorer");
              setQuery("");
            }}
            className="hidden max-w-sm flex-1 lg:block"
            inputClassName="h-10 bg-ink/60"
          />
        ) : null}

        <nav aria-label="Navigation principale" className="ml-auto flex items-center">
          <NavLink to="/" end className={(s) => cn(navLink(s), "hidden md:flex")}>
            Accueil
          </NavLink>
          <NavLink to="/explorer" className={navLink}>
            <Compass className="size-5 md:hidden" aria-hidden />
            <span className="sr-only md:not-sr-only">Explorer</span>
          </NavLink>
          <NavLink to="/favoris" className={navLink}>
            <Heart className="size-5 md:hidden" aria-hidden />
            <span className="sr-only md:not-sr-only">Favoris</span>
            {favorites.length ? (
              <span className="absolute top-1 right-0.5 min-w-4 bg-velvet px-1 text-center font-sans text-[10px] leading-4 font-semibold tracking-normal text-bone md:static md:leading-5">
                {favorites.length}
                <span className="sr-only"> films</span>
              </span>
            ) : null}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
