import { useCallback, useSyncExternalStore } from "react";
import type { MovieSummary } from "@/lib/tmdb";

/**
 * Favoris persistés en localStorage, partagés entre tous les composants et
 * synchronisés entre onglets. On stocke le minimum renvoyé par TMDB pour
 * afficher la liste sans refaire d'appel réseau.
 */

export type FavoriteMovie = Pick<MovieSummary, "id" | "title" | "poster_path" | "release_date" | "vote_average"> & {
  addedAt: number;
};

const STORAGE_KEY = "cineyast:favoris:v1";
const EMPTY: FavoriteMovie[] = [];
const listeners = new Set<() => void>();
let snapshot: FavoriteMovie[] | null = null;

const isFavoriteMovie = (value: unknown): value is FavoriteMovie =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as FavoriteMovie).id === "number" &&
  typeof (value as FavoriteMovie).title === "string";

function read(): FavoriteMovie[] {
  if (snapshot) return snapshot;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    snapshot = Array.isArray(parsed) ? parsed.filter(isFavoriteMovie) : [];
  } catch {
    snapshot = [];
  }
  return snapshot;
}

function write(next: FavoriteMovie[]) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // stockage plein ou bloqué (navigation privée) : la liste reste en mémoire
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = null;
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

type FavoriteInput = Pick<MovieSummary, "id" | "title" | "poster_path" | "release_date" | "vote_average">;

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY);

  const isFavorite = useCallback((id: number) => favorites.some((f) => f.id === id), [favorites]);

  const toggle = useCallback((movie: FavoriteInput) => {
    const current = read();
    if (current.some((f) => f.id === movie.id)) {
      write(current.filter((f) => f.id !== movie.id));
    } else {
      const { id, title, poster_path, release_date, vote_average } = movie;
      write([{ id, title, poster_path, release_date, vote_average, addedAt: Date.now() }, ...current]);
    }
  }, []);

  const remove = useCallback((id: number) => write(read().filter((f) => f.id !== id)), []);
  const clear = useCallback(() => write([]), []);

  return { favorites, isFavorite, toggle, remove, clear };
}
