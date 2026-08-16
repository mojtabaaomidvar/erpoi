import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  options: SelectOption[];
  placeholder?: string;
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, hasError, disabled, ...props }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full appearance-none rounded-[var(--radius-input)] border bg-[var(--color-surface)] px-3 py-[var(--density-form)] pr-8 text-sm text-[var(--color-text-primary)] transition-colors",
          "border-[var(--color-border)]",
          "focus:border-[var(--color-accent-from)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]",
          hasError &&
            "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
        aria-invalid={hasError || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);

Select.displayName = "Select";
