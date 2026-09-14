import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { SearchBar } from "@/components/SearchBar";
import { Wordmark } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const LIENS = [
  { to: "/", label: "Accueil", end: true },
  { to: "/explorer", label: "Explorer", end: false },
  { to: "/favoris", label: "Favoris", end: false },
];

export function Header() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  // La page Explorer a déjà sa propre barre de recherche.
  const withSearch = pathname !== "/explorer";

  // Raccourci « / » : place le curseur dans la recherche, sauf pendant une saisie.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable='true']")) return;
      const input = window.matchMedia("(min-width: 48rem)").matches ? desktopRef.current : mobileRef.current;
      if (!input) return;
      e.preventDefault();
      input.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (q: string) => {
    navigate(q ? `/explorer?q=${encodeURIComponent(q)}` : "/explorer");
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-noir bg-creme">
      <div className="mx-auto max-w-page px-gouttiere md:px-gouttiere-lg">
        <div className="flex h-16 items-center gap-3 md:h-20 md:gap-8">
          <Link to="/" aria-label="Cinéyast, accueil" className="shrink-0">
            <Wordmark />
          </Link>

          {withSearch ? (
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={submit}
              inputRef={desktopRef}
              shortcut
              // min-w-0 : sans lui, la barre refuse de rétrécir sous sa largeur naturelle, et vers 768 px
              // le lien Favoris sortait de 8 px à droite (page plus large que l'écran).
              className="hidden max-w-[480px] min-w-0 flex-1 md:flex"
            />
          ) : null}

          <nav aria-label="Navigation principale" className="ml-auto flex shrink-0 gap-0 md:gap-1">
            {LIENS.map((lien) => (
              <NavLink
                key={lien.to}
                to={lien.to}
                end={lien.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-11 items-center border-2 border-transparent px-2.5 text-sm font-bold md:px-3.5 md:text-[15px]",
                    isActive ? "bg-noir text-creme" : "hover:border-noir",
                  )
                }
              >
                {lien.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {withSearch ? (
          <SearchBar value={query} onChange={setQuery} onSubmit={submit} inputRef={mobileRef} className="mb-3 md:hidden" />
        ) : null}
      </div>
    </header>
  );
}
