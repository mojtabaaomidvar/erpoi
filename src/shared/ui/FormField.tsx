import { cn } from "../lib/cn";

export interface FormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export function FormField({
  label,
  description,
  error,
  required,
  disabled,
  htmlFor,
  children,
  className,
  labelClassName,
}: FormFieldProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        disabled && "opacity-50",
        className,
      )}
    >
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            "text-sm font-medium text-[var(--color-text-primary)]",
            labelClassName,
          )}
        >
          {label}
          {required && (
            <span
              className="ml-0.5 text-[var(--color-danger)]"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      )}
      {error && (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
