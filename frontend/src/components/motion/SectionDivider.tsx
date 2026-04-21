import { cn } from "@/lib/utils";

export function SectionDivider({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} aria-hidden>
      <div className="h-px w-full bg-white/5" />
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
    </div>
  );
}
