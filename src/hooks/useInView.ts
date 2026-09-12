import { useEffect, useRef, useState } from "react";

/**
 * `once: true` (défaut) : passe à true la première fois que l'élément approche
 * de l'écran, puis cesse d'observer — idéal pour différer un chargement.
 * `once: false` : suit la visibilité en continu (sentinelle de scroll infini).
 */
export function useInView<T extends Element>({ rootMargin = "600px", once = true } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (once && inView)) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting);
        if (!once) setInView(visible);
        else if (visible) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, inView, rootMargin]);

  return [ref, inView] as const;
}
