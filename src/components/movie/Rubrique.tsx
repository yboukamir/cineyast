import { cn } from "@/lib/utils";

/**
 * Onglet de rubrique, à la manière des onglets de couleur sur la tranche des pages d'une revue.
 * Décoratif : le surtitre écrit déjà la rubrique, la couleur n'est jamais la seule information.
 */
export type Rubrique = "actualite" | "palmares" | "memoire" | "belgique";

const COULEURS: Record<Rubrique, string> = {
  actualite: "bg-outremer",
  palmares: "bg-jaune",
  memoire: "bg-noir",
  // Noir, jaune, rouge : le drapeau belge. Seul usage du rouge en dehors des messages d'erreur.
  belgique: "bg-[linear-gradient(90deg,var(--color-noir)_0_33.4%,var(--color-jaune)_33.4%_66.7%,var(--color-erreur)_66.7%)]",
};

export function RubriqueTab({ rubrique }: { rubrique: Rubrique }) {
  return <span aria-hidden className={cn("inline-block h-3 w-6 shrink-0 border-2 border-noir", COULEURS[rubrique])} />;
}
