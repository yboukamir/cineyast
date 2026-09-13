import { Link } from "react-router";
import { EmptyState } from "@/components/States";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <div className="mx-auto max-w-page px-gouttiere pt-10 md:px-gouttiere-lg">
      <EmptyState
        title="Cette page n'existe pas."
        action={
          <>
            <Link to="/" className="btn btn-primary btn-sm">
              Accueil
            </Link>
            <Link to="/explorer" className="btn btn-sm">
              Explorer
            </Link>
          </>
        }
      >
        Le lien est peut-être erroné, ou la page a été déplacée.
      </EmptyState>
    </div>
  );
}
