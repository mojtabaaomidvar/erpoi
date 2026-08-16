import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full rounded-[var(--radius-input)] border bg-[var(--color-surface)] px-3 py-[var(--density-form)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors resize-y min-h-[80px]",
          "border-[var(--color-border)]",
          "focus:border-[var(--color-accent-from)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]",
          hasError &&
            "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
