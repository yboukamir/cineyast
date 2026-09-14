import { useCallback, useSyncExternalStore } from "react";
import { PAYS_PAR_DEFAUT, paysConnu, paysDesLangues } from "@/lib/pays";

/**
 * Pays des offres de streaming, par ordre de priorité : choix du visiteur (mémorisé dans le
 * navigateur), pays de sa connexion (api/pays.js, sur Vercel), région de la langue du
 * navigateur, puis la France.
 */

const STORAGE_KEY = "cineyast:pays:v1";
const listeners = new Set<() => void>();
/** Choix gardé en mémoire quand le stockage est bloqué (navigation privée). */
let choixMemoire: string | undefined;
let detecte: string | undefined;
let detection: Promise<void> | undefined;

const notifier = () => listeners.forEach((notify) => notify());

function lireChoix(): string | undefined {
  try {
    const stocke = localStorage.getItem(STORAGE_KEY);
    if (paysConnu(stocke)) return stocke;
  } catch {
    // stockage bloqué : on s'en tient au choix en mémoire
  }
  return choixMemoire;
}

function detecter() {
  // Une seule requête par chargement de page.
  detection ??= fetch("/api/pays", { headers: { accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { pays?: unknown } | null) => {
      if (paysConnu(data?.pays)) {
        detecte = data.pays;
        notifier();
      }
    })
    // Hors Vercel (développement, hébergement PHP), la fonction n'existe pas : repli sur la langue.
    .catch(() => undefined);
}

function lirePays() {
  return lireChoix() ?? detecte ?? paysDesLangues(navigator.languages ?? [navigator.language]) ?? PAYS_PAR_DEFAUT;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  if (!lireChoix()) detecter();
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePays() {
  const pays = useSyncExternalStore(subscribe, lirePays, () => PAYS_PAR_DEFAUT);
  const choisir = useCallback((code: string) => {
    if (!paysConnu(code)) return;
    choixMemoire = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // stockage plein ou bloqué : le choix reste valable jusqu'au rechargement
    }
    notifier();
  }, []);
  return [pays, choisir] as const;
}
