import type { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { TmdbError } from "@/lib/tmdb";
import { TicketButton } from "@/components/ui/ticket-button";
import { cn } from "@/lib/utils";

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const missingKey = error instanceof TmdbError && error.code === "missing_api_key";
  const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";

  return (
    <div role="alert" className={cn("border border-velvet/50 bg-velvet/10 px-5 py-6", className)}>
      <p className="marquee text-xs text-velvet-bright">{missingKey ? "Projection suspendue" : "Incident de projection"}</p>
      <p className="mt-2 font-display text-xl">{missingKey ? "La clé TMDB n'est pas encore configurée." : message}</p>
      {missingKey ? (
        <p className="mt-2 max-w-prose text-sm text-mute">
          {import.meta.env.DEV
            ? "Copiez .env.example en .env, collez-y votre clé dans TMDB_API_KEY puis relancez « npm run dev »."
            : "Le fichier tmdb-config.php est absent du serveur (voir README, section Déploiement)."}
        </p>
      ) : null}
      {onRetry && !missingKey ? (
        <TicketButton variant="ghost" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCcw /> Réessayer
        </TicketButton>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <div className="marquee-lights w-40" aria-hidden />
      <p className="mt-6 font-display text-2xl italic">{title}</p>
      {children ? <div className="mt-3 max-w-md text-sm text-mute">{children}</div> : null}
    </div>
  );
}

export function PosterSkeleton({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="skeleton aspect-[2/3]" />
      <div className="skeleton mt-3 h-4 w-4/5" />
      <div className="skeleton mt-2 h-3 w-2/5" />
    </div>
  );
}
