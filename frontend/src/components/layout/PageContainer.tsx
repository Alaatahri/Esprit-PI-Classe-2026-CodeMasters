import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
};

const maxWidths: Record<NonNullable<PageContainerProps["size"]>, string> = {
  default: "max-w-6xl",
  wide: "max-w-[1400px]",
  narrow: "max-w-3xl",
};

export function PageContainer({
  children,
  className,
  size = "default",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10",
        maxWidths[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
