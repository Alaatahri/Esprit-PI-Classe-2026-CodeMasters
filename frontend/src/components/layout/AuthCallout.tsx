import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthCalloutProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

/** État « connectez-vous » ou message d’accès limité — même silhouette sur tous les rôles. */
export function AuthCallout({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AuthCalloutProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-lg px-4 py-16 text-center sm:py-20",
        className,
      )}
    >
      <div className="bmp-panel mx-auto w-full max-w-md p-8 sm:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/12">
          <Icon className="h-7 w-7 text-amber-300" aria-hidden />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {action ? <div className="mt-8">{action}</div> : null}
      </div>
    </div>
  );
}
