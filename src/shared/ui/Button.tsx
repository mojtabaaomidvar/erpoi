// src/shared/ui/Button.ts

import { cn } from "../lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    // primary follows the active accent tokens so presets/custom colors apply
    primary:
      "bg-[var(--color-primary)] text-[var(--color-accent-text)] hover:bg-[var(--color-accent-hover)] shadow-sm",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]",
    ghost:
      "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
    outline:
      "border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "relative overflow-hidden",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 active:animate-[ripple_0.4s_ease-out] active:opacity-100 bg-current"
        style={{ mixBlendMode: "overlay" }}
      />
    </button>
  );
}
