import { EmptyState } from "@/components/States";
import { TicketLink } from "@/components/ui/ticket-button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <div className="px-page pt-28">
      <EmptyState title="Cette bobine est introuvable.">
        La page demandée n'existe pas ou a été déplacée.
        <div className="mt-6 flex justify-center gap-3">
          <TicketLink to="/">Accueil</TicketLink>
          <TicketLink to="/explorer" variant="ghost">
            Explorer
          </TicketLink>
        </div>
      </EmptyState>
    </div>
  );
}
