import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  /** Zone droite : boutons / liens */
  actions?: ReactNode;
  /** Sous le bloc principal : stats, badges, etc. */
  footer?: ReactNode;
  className?: string;
};

/**
 * Bandeau d’accueil cohérent pour tous les rôles (client, artisan, expert, admin…).
 */
export function DashboardHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  footer,
  className,
}: DashboardHeroProps) {
  return (
    <header
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-amber-500/[0.07] via-card/40 to-transparent p-6 shadow-lg shadow-black/20 backdrop-blur-xl sm:p-8 lg:p-10",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-white/[0.03] blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-500/15 shadow-inner">
            <Icon className="h-7 w-7 text-amber-300" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
              {eyebrow}
            </p>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:flex-col lg:items-end">
            {actions}
          </div>
        ) : null}
      </div>

      {footer ? (
        <div className="relative mt-8 border-t border-border/40 pt-8">{footer}</div>
      ) : null}
    </header>
  );
}
