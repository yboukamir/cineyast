import { ExternalLink } from "lucide-react";

interface Lien {
  href: string;
  label: string;
}

/** Bloc « Ailleurs · Liens » de la maquette (page personne), repris sur la fiche film. */
export function LiensExternes({ titreId, liens, className }: { titreId: string; liens: Lien[]; className?: string }) {
  if (!liens.length) return null;
  return (
    <section aria-labelledby={titreId} className={className}>
      <p className="surtitre mb-1">Ailleurs</p>
      <h2 id={titreId} className="titre-section">
        Liens
      </h2>
      <ul className="m-0 mt-4 list-none border-t-[3px] border-noir p-0">
        {liens.map((lien) => (
          <li key={lien.href} className="border-b-2 border-filet">
            <a
              href={lien.href}
              target="_blank"
              rel="noopener noreferrer"
              className="-mx-2 flex h-14 items-center justify-between px-2 font-semibold hover:bg-jaune"
            >
              <span>
                {lien.label}
                <span className="sr-only"> (nouvel onglet)</span>
              </span>
              <ExternalLink className="size-4" strokeWidth={2.4} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
