import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visual error state */
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full rounded-[var(--radius-input)] border bg-[var(--color-surface)] px-3 py-[var(--density-form)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors",
          "border-[var(--color-border)]",
          "focus:border-[var(--color-accent-from)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]",
          hasError && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
