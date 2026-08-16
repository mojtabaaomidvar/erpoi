import { cn } from "../lib/cn";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-4",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className={cn("inline-flex flex-col items-center justify-center gap-2", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-[var(--color-accent-from)] border-t-transparent",
          sizeClasses[size],
        )}
        role="status"
        aria-label={label ?? "Loading"}
      />
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
    </div>
  );
}
