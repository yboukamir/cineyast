import { isRouteErrorResponse, useRouteError } from "react-router";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Wordmark } from "@/components/layout/Logo";

/** Erreur de rendu ou de chargement d'une page (ex. ancien fichier JS après un redéploiement). */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="grid min-h-dvh place-items-center bg-creme px-gouttiere">
      <div className="w-full max-w-xl">
        <a href="/" className="inline-block" aria-label="Cineyast, accueil">
          <Wordmark />
        </a>
        <div role="alert" className="etat etat-erreur mt-8">
          <TriangleAlert className="size-6 shrink-0 text-erreur" strokeWidth={2.4} aria-hidden />
          <div className="flex-1">
            <p className="font-bold">Erreur : {notFound ? "cette page n'existe pas." : "la page n'a pas pu s'afficher."}</p>
            <p className="mt-0.5 text-sm text-gris">
              {notFound
                ? "Le lien est peut-être erroné, ou la page a été déplacée."
                : "Rechargez la page ; si le problème persiste, revenez à l'accueil."}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {!notFound ? (
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              <RotateCw className="size-[18px]" strokeWidth={2.4} aria-hidden />
              Recharger
            </button>
          ) : null}
          <a href="/" className="btn">
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
