import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { releaseDateLong } from "@/lib/format";
import type { WatchAvailability } from "@/lib/tmdb";
import { buildGroups, type WatchGroup } from "@/lib/watchProviders";

const LOGO = "https://image.tmdb.org/t/p/w92";
/** Au-delà, les offres sont repliées : Fight Club en compte 9 en abonnement et 9 en location. */
const VISIBLE = 6;

function ProviderGroup({ group }: { group: WatchGroup }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = group.providers.length - VISIBLE;
  const shown = expanded || hidden <= 0 ? group.providers : group.providers.slice(0, VISIBLE);
  const listId = `offres-${group.key}`;

  return (
    <div>
      <h3 className="marquee text-[11px] text-mute">{group.label}</h3>
      <ul id={listId} className="mt-3 flex flex-wrap gap-2">
        {shown.map((provider) => (
          <li
            key={provider.provider_id}
            className="flex h-10 items-center gap-2.5 border border-line-strong bg-ink-2/60 pr-3"
          >
            {provider.logo_path ? (
              // Le nom est écrit à côté : le logo est décoratif pour les lecteurs d'écran.
              <img
                src={`${LOGO}${provider.logo_path}`}
                alt=""
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
                className="size-10 shrink-0 object-cover"
              />
            ) : (
              <span aria-hidden className="size-10 shrink-0 bg-ink-3" />
            )}
            <span className="text-sm leading-tight text-bone/90">{provider.provider_name}</span>
          </li>
        ))}
        {hidden > 0 ? (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-controls={listId}
              className="marquee flex h-10 items-center border border-dashed border-line-strong px-3 text-[11px] text-mute transition-colors hover:border-gold hover:text-gold"
            >
              {expanded ? "Réduire" : `+ ${hidden} autre${hidden > 1 ? "s" : ""}`}
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function NoOffer({ releaseDate }: { releaseDate?: string }) {
  const released = releaseDate ? new Date(`${releaseDate}T00:00:00`) : null;
  const days = released && !Number.isNaN(released.getTime()) ? (Date.now() - released.getTime()) / 86_400_000 : null;
  const date = releaseDateLong(releaseDate);

  let context = "";
  if (days !== null && days < 0) context = `Sa sortie en salle est prévue le ${date}.`;
  else if (days !== null && days <= 365)
    context = `Sorti en salle le ${date} : en France, un film arrive généralement en location quelques mois après sa sortie au cinéma, et plus tard en abonnement.`;

  return (
    <div className="mt-5 border-l-2 border-line-strong pl-4">
      <p className="text-bone/90">Aucune offre de streaming, de location ou d'achat n'est référencée en France pour le moment.</p>
      {context ? <p className="mt-1 text-sm text-mute">{context}</p> : null}
    </div>
  );
}

export function WatchProviders({
  availability,
  releaseDate,
}: {
  availability?: WatchAvailability;
  releaseDate?: string;
}) {
  const groups = availability ? buildGroups(availability) : [];

  return (
    <>
      {groups.length ? (
        <div className="mt-5 space-y-6">
          {groups.map((group) => (
            <ProviderGroup key={group.key} group={group} />
          ))}
        </div>
      ) : (
        <NoOffer releaseDate={releaseDate} />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-mute">
        {groups.length && availability?.link ? (
          <a
            href={availability.link}
            target="_blank"
            rel="noopener noreferrer"
            className="marquee inline-flex items-center gap-1.5 transition-colors hover:text-gold"
          >
            Accéder aux offres sur TMDB <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
        {/* Attribution exigée par TMDB pour utiliser ces données. */}
        <p>
          Disponibilités fournies par{" "}
          <a
            href="https://www.justwatch.com/fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bone underline decoration-gold/50 underline-offset-4 hover:text-gold"
          >
            JustWatch
          </a>
        </p>
      </div>
    </>
  );
}
