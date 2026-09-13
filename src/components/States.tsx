import type { ReactNode } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { TmdbError } from "@/lib/tmdb";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  /** Ce qui n'a pas pu être chargé, en fin de phrase : « impossible de charger {what}. » */
  what?: string;
  /** Phrase complète après « Erreur : », à la place de la formule par défaut. */
  title?: string;
  /** Action supplémentaire à côté de « Réessayer » (ex. retour à l'accueil). */
  action?: ReactNode;
  className?: string;
}

/** L'erreur est toujours écrite (« Erreur : … ») : la couleur rouge n'est jamais seule à la porter. */
export function ErrorState({ error, onRetry, what = "ce contenu", title, action, className }: ErrorStateProps) {
  const missingKey = error instanceof TmdbError && error.code === "missing_api_key";
  const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";

  return (
    <div role="alert" className={cn("etat etat-erreur", className)}>
      <TriangleAlert className="size-6 shrink-0 text-erreur" strokeWidth={2.4} aria-hidden />
      <div className="flex-1">
        <p className="font-bold">
          Erreur : {missingKey ? "la clé TMDB n'est pas encore configurée." : (title ?? `impossible de charger ${what}.`)}
        </p>
        <p className="mt-0.5 text-sm text-gris">
          {missingKey
            ? import.meta.env.DEV
              ? "Copiez .env.example en .env, collez-y votre clé dans TMDB_API_KEY puis relancez « npm run dev »."
              : "La variable TMDB_API_KEY est absente du serveur (voir README, section Déploiement)."
            : message}
        </p>
      </div>
      {(onRetry && !missingKey) || action ? (
        <div className="flex flex-wrap gap-3 self-start md:self-auto">
          {onRetry && !missingKey ? (
            <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
              <RotateCw className="size-[18px]" strokeWidth={2.4} aria-hidden />
              Réessayer
            </button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  /** Bouton ou lien d'action, à droite sur desktop. */
  action?: ReactNode;
  /** Mot de l'affiche typographique à gauche (« Rien », « Pas de séance », « VO »…). */
  mark?: string;
  className?: string;
}

export function EmptyState({ title, children, action, mark = "Rien", className }: EmptyStateProps) {
  return (
    <div className={cn("etat", className)}>
      <div className="w-[72px] shrink-0" aria-hidden>
        <div className="relative aspect-[2/3] border-2 border-noir bg-creme">
          <div className="affiche-absente">
            <b className={mark.length > 4 ? "!text-[20px]" : "!text-[22px]"}>{mark}</b>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        {children ? <div className="mt-0.5 text-sm text-gris">{children}</div> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3 self-start md:self-auto">{action}</div> : null}
    </div>
  );
}

/** Carte en chargement : mêmes dimensions que la carte finale. */
export function PosterSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("carte", className)} aria-hidden>
      <div className="carte-media squelette !border-filet" />
      <div className="squelette mt-3 h-4 w-4/5" />
      <div className="squelette mt-2 h-3.5 w-2/5" />
    </div>
  );
}
