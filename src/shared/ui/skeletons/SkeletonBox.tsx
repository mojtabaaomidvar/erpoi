// src/shared/ui/skeletons/SkeletonBox.tsx
import { cn } from "@shared/lib/cn";

interface SkeletonBoxProps {
  className?: string;
  /** Fixed height utility (Tailwind class or arbitrary value) */
  height?: string;
  /** Fixed width utility (Tailwind class or arbitrary value) */
  width?: string;
  /** Border radius override */
  rounded?: string;
}

/**
 * Primitive skeleton block that respects theme tokens and reduced-motion.
 * Uses --color-muted for background and animate-pulse which is automatically
 * disabled by the global pref-reduce-motion rules in index.css.
 */
export function SkeletonBox({
  className,
  height = "h-4",
  width = "w-full",
  rounded = "rounded",
}: SkeletonBoxProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "bg-[var(--color-muted,#e2e8f0)] animate-pulse",
        height,
        width,
        rounded,
        className,
      )}
    />
  );
}
