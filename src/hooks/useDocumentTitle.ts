import { useEffect } from "react";

const SUFFIX = "Cineyast";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${SUFFIX}` : `${SUFFIX} — films à découvrir, pour cinéphiles`;
  }, [title]);
}
