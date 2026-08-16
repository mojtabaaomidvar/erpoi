// src/shared/ui/skeletons/TableSkeleton.tsx
import { SkeletonBox } from "./SkeletonBox";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  /** Show a header row skeleton */
  showHeader?: boolean;
}

/**
 * Generic table skeleton using theme tokens.
 * Replaces feature-specific table skeletons that relied on hardcoded slate colors.
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading table data"
      className="w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      {showHeader && (
        <div className="flex gap-4 border-b border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonBox key={i} height="h-3" width="w-24" />
          ))}
        </div>
      )}
      <div className="divide-y divide-[var(--color-border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, c) => (
              <SkeletonBox
                key={c}
                height="h-4"
                width={c === 0 ? "w-32" : "w-20"}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
