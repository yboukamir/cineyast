import { isRouteErrorResponse, useRouteError } from "react-router";
import { Wordmark } from "@/components/layout/Logo";
import { TicketAnchor, TicketButton } from "@/components/ui/ticket-button";

/** Erreur de rendu ou de chargement d'une page (ex. ancien fichier JS après un redéploiement). */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-md">
        <a href="/" className="inline-block" aria-label="Cineyast — accueil">
          <Wordmark />
        </a>
        <div className="marquee-lights mx-auto mt-10 w-48" aria-hidden />
        <p className="marquee mt-8 text-xs text-velvet-bright">{notFound ? "Bobine introuvable" : "La pellicule a sauté"}</p>
        <h1 className="mt-3 font-display text-3xl">
          {notFound ? "Cette page n'existe pas." : "Un incident a interrompu la projection."}
        </h1>
        <p className="mt-3 text-sm text-mute">
          {notFound
            ? "Le lien est peut-être erroné ou la page a été déplacée."
            : "Rechargez la page ; si le problème persiste, revenez à l'accueil."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {!notFound ? (
            <TicketButton variant="velvet" onClick={() => window.location.reload()}>
              Recharger
            </TicketButton>
          ) : null}
          <TicketAnchor href="/" variant="gold">
            Accueil
          </TicketAnchor>
        </div>
      </div>
    </div>
  );
}
