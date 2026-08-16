// src/shared/ui/StatCard.ts

import { cn } from "../lib/cn";

export type StatCardTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "indigo"
  | "emerald"
  | "rose"
  | "amber";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  delta?: string;
  tone?: StatCardTone;
  icon?: React.ReactNode;
  className?: string;
}

const toneBorderClasses: Record<StatCardTone, string> = {
  default: "border-[var(--color-border)]",
  success: "border-emerald-500/30 dark:border-emerald-500/40",
  warning: "border-amber-500/30 dark:border-amber-500/40",
  danger: "border-rose-500/30 dark:border-rose-500/40",
  info: "border-sky-500/30 dark:border-sky-500/40",
  indigo: "border-indigo-500/30 dark:border-indigo-500/40",
  emerald: "border-emerald-500/30 dark:border-emerald-500/40",
  rose: "border-rose-500/30 dark:border-rose-500/40",
  amber: "border-amber-500/30 dark:border-amber-500/40",
};

export function StatCard({
  label,
  value,
  subtitle,
  delta,
  tone = "default",
  icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[var(--color-surface)] p-5 shadow-sm transition-colors",
        toneBorderClasses[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-secondary)] truncate">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-text-primary)] truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)] truncate">
              {subtitle}
            </p>
          )}
          {delta && (
            <p className="mt-1 text-xs font-medium text-[var(--color-text-secondary)] truncate">
              {delta}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-text-secondary)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
