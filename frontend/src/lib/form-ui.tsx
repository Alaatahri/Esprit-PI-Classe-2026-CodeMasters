"use client";

/** Message d’erreur sous un champ (accessibilité + style cohérent). */
export function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-red-300/95" role="alert">
      {message}
    </p>
  );
}

export function fieldInputClass(
  hasError: boolean,
  disabled: boolean,
  opts?: { hasLeftIcon?: boolean },
): string {
  const pad = opts?.hasLeftIcon
    ? "pl-12 pr-4 py-3"
    : "px-3 py-2.5 sm:px-4";
  const base = `w-full min-h-[48px] sm:min-h-[44px] text-base sm:text-sm rounded-xl bg-card/25 ${pad} text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] duration-200 outline-none disabled:opacity-60`;
  const border = hasError
    ? "border border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
    : "border border-border/80 focus:border-amber-400/55 focus:ring-2 focus:ring-amber-400/28";
  return `${base} ${border}`;
}

export function fieldTextareaClass(hasError: boolean, disabled: boolean): string {
  const base =
    "w-full text-base sm:text-sm rounded-xl bg-card/25 border border-border/80 px-3 py-2.5 text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] duration-200 outline-none resize-y min-h-[88px] disabled:opacity-60";
  const border = hasError
    ? "border-red-400/55 focus:border-red-400 focus:ring-2 focus:ring-red-500/25"
    : "focus:border-amber-400/55 focus:ring-2 focus:ring-amber-400/28";
  const locked = disabled ? " opacity-60 pointer-events-none" : "";
  return `${base} ${border}${locked}`;
}
