import { cn } from "@/lib/utils";

export function navLinkHorizontalClass(active: boolean): string {
  return cn(
    "flex items-center gap-2 rounded-xl text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out shrink-0 whitespace-nowrap motion-safe:active:scale-[0.99]",
    "px-3 py-2.5",
    active
      ? "border border-amber-500/30 bg-amber-500/15 text-amber-200 shadow-sm"
      : "border border-transparent text-muted-foreground hover:bg-white/5 hover:text-amber-50",
  );
}

export function navLinkVerticalClass(active: boolean): string {
  return cn(
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out motion-safe:active:scale-[0.99]",
    active
      ? "border border-amber-500/25 bg-amber-500/10 text-amber-100 shadow-sm"
      : "border border-transparent text-muted-foreground hover:border-white/5 hover:bg-white/[0.04] hover:text-foreground",
  );
}
