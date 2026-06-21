import { cn } from "../../lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "purple";

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, tone = "neutral", dot, className }: BadgeProps) {
  const tones: Record<BadgeTone, string> = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}