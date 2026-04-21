import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type KpiVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "amber"
  | "violet";

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  trend?: { value: number; label?: string };
  variant?: KpiVariant;
  description?: string;
  className?: string;
  onClick?: () => void;
}

const variantConfig: Record<
  KpiVariant,
  {
    iconBg: string;
    iconColor: string;
    trendColor: string;
    accent: string;
  }
> = {
  default: {
    iconBg: "rgba(255,255,255,0.07)",
    iconColor: "#9ca3af",
    trendColor: "#6b7280",
    accent: "rgba(255,255,255,0.04)",
  },
  success: {
    iconBg: "rgba(16,185,129,0.12)",
    iconColor: "#34d399",
    trendColor: "#34d399",
    accent: "rgba(16,185,129,0.06)",
  },
  warning: {
    iconBg: "rgba(249,115,22,0.12)",
    iconColor: "#fb923c",
    trendColor: "#fb923c",
    accent: "rgba(249,115,22,0.06)",
  },
  danger: {
    iconBg: "rgba(239,68,68,0.12)",
    iconColor: "#f87171",
    trendColor: "#f87171",
    accent: "rgba(239,68,68,0.06)",
  },
  info: {
    iconBg: "rgba(59,130,246,0.12)",
    iconColor: "#60a5fa",
    trendColor: "#60a5fa",
    accent: "rgba(59,130,246,0.06)",
  },
  amber: {
    iconBg: "rgba(245,158,11,0.12)",
    iconColor: "#fbbf24",
    trendColor: "#fbbf24",
    accent: "rgba(245,158,11,0.06)",
  },
  violet: {
    iconBg: "rgba(139,92,246,0.12)",
    iconColor: "#a78bfa",
    trendColor: "#a78bfa",
    accent: "rgba(139,92,246,0.06)",
  },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = "default",
  description,
  className,
  onClick,
}: KpiCardProps) {
  const cfg = variantConfig[variant];
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl transition-all duration-200",
        onClick && "cursor-pointer",
        className,
      )}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.11)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLElement).style.borderColor =
          "rgba(255,255,255,0.07)";
      }}
      onClick={onClick}
    >
      {/* Accent bar at top */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: cfg.iconColor, opacity: 0.6 }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "#6b7280" }}
            >
              {label}
            </p>
            <p className="mt-2.5 text-[28px] font-bold leading-none tracking-tight text-white">
              {value}
            </p>
            {description && (
              <p className="mt-1.5 text-[12px]" style={{ color: "#6b7280" }}>
                {description}
              </p>
            )}
            {trend && TrendIcon && (
              <div
                className="mt-2.5 flex items-center gap-1 text-[12px] font-medium"
                style={{ color: cfg.trendColor }}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                <span>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span style={{ color: "#6b7280" }}>{trend.label}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: cfg.iconBg }}
            >
              <Icon className="h-5 w-5" style={{ color: cfg.iconColor }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
