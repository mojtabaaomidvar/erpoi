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

export function StatCard({
  label,
  value,
  subtitle,
  delta,
  tone = "default",
  icon,
  className,
}: StatCardProps) {
  const toneClasses = {
	  default: "border-slate-200 dark:border-slate-700",
	  success: "border-emerald-200 dark:border-emerald-800",
	  warning: "border-amber-200 dark:border-amber-800",
	  danger: "border-rose-200 dark:border-rose-800",
	  info: "border-sky-200 dark:border-sky-800",

	  indigo: "border-indigo-200 dark:border-indigo-800",
	  emerald: "border-emerald-200 dark:border-emerald-800",
	  rose: "border-rose-200 dark:border-rose-800",
	  amber: "border-amber-200 dark:border-amber-800",
	};

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900",
        toneClasses[tone],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
		  {delta && (
		    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
			  {delta}
		    </p>
		  )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}





