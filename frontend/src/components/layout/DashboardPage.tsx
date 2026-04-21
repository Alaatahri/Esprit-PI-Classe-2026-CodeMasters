import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardPageProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Conteneur principal des écrans « espace » : largeur max, rythme vertical, alignement grille.
 * Les transitions de page sont gérées par `app/espace/template.tsx`.
 */
export function DashboardPage({ children, className }: DashboardPageProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl space-y-10 lg:space-y-12 xl:space-y-14",
        className,
      )}
    >
      {children}
    </div>
  );
}
