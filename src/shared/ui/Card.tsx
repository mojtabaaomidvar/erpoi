import { cn } from "../lib/cn";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  const paddingClass = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
  }[padding];

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--elevation-card)]",
        paddingClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
