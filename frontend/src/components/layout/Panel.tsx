import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PanelProps = {
  title?: string;
  icon?: LucideIcon;
  /** Contenu à droite du titre (loader, badge, lien) */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
};

/**
 * Panneau type carte (liste / détail) pour les dashboards — même langage que `.bmp-panel`.
 */
export function Panel({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
  headerClassName,
}: PanelProps) {
  const hasHeader = Boolean(title || action || Icon);

  return (
    <section
      className={cn(
        "bmp-panel flex min-h-0 flex-col overflow-hidden shadow-black/20",
        className,
      )}
    >
      {hasHeader ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-4 sm:px-6 sm:py-5",
            headerClassName,
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon ? (
              <Icon
                className="h-5 w-5 shrink-0 text-amber-300/95"
                aria-hidden
              />
            ) : null}
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            ) : null}
          </div>
          {action ? (
            <div className="flex shrink-0 items-center gap-2">{action}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}
