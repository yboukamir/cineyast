import type { WatchAvailability, WatchProvider } from "@/lib/tmdb";

export interface WatchGroup {
  key: string;
  label: string;
  providers: WatchProvider[];
}

const byPriority = (list: WatchProvider[]) => [...list].sort((a, b) => a.display_priority - b.display_priority);

const sameProviders = (a: WatchProvider[] = [], b: WatchProvider[] = []) =>
  a.length === b.length && a.every((p) => b.some((q) => q.provider_id === p.provider_id));

/** Groupes affichés dans « Où regarder », dans l'ordre : abonnement, gratuit, publicité, location, achat. */
export function buildGroups(availability: WatchAvailability): WatchGroup[] {
  const groups: WatchGroup[] = [];
  const add = (key: string, label: string, list?: WatchProvider[]) => {
    if (list?.length) groups.push({ key, label, providers: byPriority(list) });
  };

  add("flatrate", "Abonnement", availability.flatrate);
  add("free", "Gratuit", availability.free);
  add("ads", "Gratuit avec publicité", availability.ads);
  // Les plateformes de location et d'achat sont très souvent les mêmes : un seul groupe évite le doublon.
  if (availability.rent?.length && sameProviders(availability.rent, availability.buy)) {
    add("rent-buy", "Location ou achat", availability.rent);
  } else {
    add("rent", "Location", availability.rent);
    add("buy", "Achat", availability.buy);
  }
  return groups;
}
