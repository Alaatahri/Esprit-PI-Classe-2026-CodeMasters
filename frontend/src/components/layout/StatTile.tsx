import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<
  "neutral" | "amber" | "sky" | "emerald",
  string
> = {
  neutral:
    "border-border/50 bg-card/25 text-muted-foreground [&_.stat-value]:text-foreground",
  amber:
    "border-amber-500/20 bg-amber-950/25 text-amber-200/80 [&_.stat-value]:text-foreground",
  sky: "border-sky-500/20 bg-sky-950/25 text-sky-200/80 [&_.stat-value]:text-foreground",
  emerald:
    "border-emerald-500/20 bg-emerald-950/25 text-emerald-200/80 [&_.stat-value]:text-foreground",
};

type StatTileProps = {
  label: ReactNode;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
  className?: string;
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "bmp-stat-tile flex flex-col justify-center rounded-2xl border p-4 sm:p-5",
        tones[tone],
        className,
      )}
    >
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
        {label}
      </p>
      <p className="stat-value mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
