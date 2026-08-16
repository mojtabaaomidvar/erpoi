// src/shared/ui/skeletons/CardSkeleton.tsx
import { SkeletonBox } from "./SkeletonBox";

interface CardSkeletonProps {
  /** Number of content lines to show */
  lines?: number;
  /** Whether to show a header/title skeleton */
  showHeader?: boolean;
}

/**
 * Generic card skeleton for dashboard widgets and list items.
 * Uses semantic theme tokens and respects reduced motion via SkeletonBox.
 */
export function CardSkeleton({
  lines = 3,
  showHeader = true,
}: CardSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading content"
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3"
    >
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <SkeletonBox height="h-8" width="w-8" rounded="rounded-lg" />
          <SkeletonBox height="h-5" width="w-1/3" />
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height="h-4"
          width={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}
