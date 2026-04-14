import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  message?: string;
  className?: string;
  minHeight?: "sm" | "md" | "lg";
  children?: ReactNode;
};

const minH = {
  sm: "min-h-[180px]",
  md: "min-h-[280px]",
  lg: "min-h-[40vh]",
} as const;

export function LoadingState({
  message = "Chargement…",
  className,
  minHeight = "sm",
  children,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground",
        minH[minHeight],
        className,
      )}
    >
      <Loader2
        className="h-10 w-10 shrink-0 animate-spin text-amber-400/85 motion-reduce:animate-none"
        aria-hidden
      />
      <p className="text-sm font-medium tracking-tight">{message}</p>
      {children}
    </div>
  );
}
