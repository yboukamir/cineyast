import { useState } from "react";
import { EmptyState } from "@/components/States";
import { releaseDateLong } from "@/lib/format";
import type { WatchAvailability } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { buildGroups, type WatchGroup } from "@/lib/watchProviders";

const LOGO = "https://image.tmdb.org/t/p/w92";
/** Au-delà, les offres sont repliées : Fight Club en compte 9 en abonnement et 9 en location. */
const VISIBLE = 6;
/** Carré de légende : jaune pour ce qui est inclus ou gratuit, outremer pour ce qui se paie à l'acte. */
const LEGENDE: Record<string, string> = {
  flatrate: "bg-jaune",
  free: "bg-jaune",
  ads: "bg-jaune",
  "rent-buy": "bg-outremer",
  rent: "bg-outremer",
  buy: "bg-outremer",
};

function ProviderGroup({ group }: { group: WatchGroup }) {
  const [expanded, setExpanded] = useState(false);
  const hidden = group.providers.length - VISIBLE;
  const shown = expanded || hidden <= 0 ? group.providers : group.providers.slice(0, VISIBLE);
  const listId = `offres-${group.key}`;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span aria-hidden className={cn("size-3 border-2 border-noir", LEGENDE[group.key] ?? "bg-jaune")} />
        {group.label}
      </h3>
      <ul id={listId} className="m-0 flex list-none flex-wrap gap-3 p-0">
        {shown.map((provider) => (
          <li key={provider.provider_id} className="inline-flex h-12 items-center gap-2.5 border-2 border-noir bg-creme pr-3.5">
            {provider.logo_path ? (
              // Le nom est écrit à côté : le logo est décoratif pour les lecteurs d'écran.
              <img
                src={`${LOGO}${provider.logo_path}`}
                alt=""
                width={44}
                height={44}
                loading="lazy"
                decoding="async"
                className="size-11 shrink-0 border-r-2 border-noir object-cover"
              />
            ) : (
              <span aria-hidden className="zone size-11 shrink-0 border-r-2 border-noir" />
            )}
            <span className="text-[15px] font-semibold">{provider.provider_name}</span>
          </li>
        ))}
        {hidden > 0 ? (
          <li>
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-controls={listId}
              className="btn h-12 shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-jaune"
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

  let context = "Ni abonnement, ni location, ni achat n'est référencé pour ce film.";
  if (days !== null && days < 0) context = `Sa sortie en salle est prévue le ${date}.`;
  else if (days !== null && days <= 365)
    context = `Sorti en salle le ${date} : en France, un film arrive généralement en location quelques mois après sa sortie au cinéma, et plus tard en abonnement.`;

  return (
    <EmptyState mark="Pas de séance" title="Aucune offre de streaming en France pour le moment.">
      {context}
    </EmptyState>
  );
}

export function WatchProviders({ availability, releaseDate }: { availability?: WatchAvailability; releaseDate?: string }) {
  const groups = availability ? buildGroups(availability) : [];

  return (
    <div className="mt-5">
      {groups.length ? (
        <div className="grid gap-8 md:grid-cols-2">
          {groups.map((group) => (
            <ProviderGroup key={group.key} group={group} />
          ))}
        </div>
      ) : (
        <NoOffer releaseDate={releaseDate} />
      )}
      {/* Attribution exigée par TMDB pour utiliser ces données. */}
      <p className="mt-5 text-sm text-gris">
        Disponibilités fournies par{" "}
        <a href="https://www.justwatch.com/fr" target="_blank" rel="noopener noreferrer" className="lien">
          JustWatch
        </a>
        .
      </p>
    </div>
  );
}
