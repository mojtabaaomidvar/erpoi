import { cn } from "../lib/cn";
import { Spinner } from "./Spinner";

export interface TableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  width?: string;
}

export interface TableProps<T = any> {
  /** Legacy children-based API — pass either children OR columns+data */
  children?: React.ReactNode;
  className?: string;
  /** Column definitions for data-driven API */
  columns?: TableColumn<T>[];
  /** Row data for data-driven API */
  data?: T[];
  /** Row key extractor */
  rowKey?: (row: T, index: number) => string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Zebra striping */
  striped?: boolean;
  /** Hover highlight on rows */
  hoverable?: boolean;
  /** Density preset — defaults to token-based density */
  density?: "compact" | "normal" | "comfortable";
  /** Loading state overlay */
  loading?: boolean;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Sort handler */
  onSort?: (key: string, direction: "asc" | "desc") => void;
  /** Current sort key */
  sortKey?: string;
  /** Current sort direction */
  sortDirection?: "asc" | "desc";
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Additional table element props */
  tableClassName?: string;
}

const densityPadding: Record<string, string> = {
  compact: "px-2 py-1",
  normal: "px-[var(--density-table)] py-2",
  comfortable: "px-4 py-3",
};

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction?: "asc" | "desc";
}) {
  return (
    <span
      className={cn(
        "ml-1 inline-flex flex-col text-[8px] leading-none",
        active
          ? "text-[var(--color-accent-from)]"
          : "text-[var(--color-text-muted)] opacity-40",
      )}
    >
      <span
        className={cn(
          active && direction === "asc" ? "opacity-100" : "opacity-30",
        )}
      >
        ▲
      </span>
      <span
        className={cn(
          active && direction === "desc" ? "opacity-100" : "opacity-30",
        )}
      >
        ▼
      </span>
    </span>
  );
}

export function Table<T>({
  children,
  className,
  columns,
  data,
  rowKey,
  stickyHeader = false,
  striped = false,
  hoverable = true,
  density = "normal",
  loading = false,
  emptyState,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  tableClassName,
}: TableProps<T>) {
  const cellPad = densityPadding[density] ?? densityPadding.normal;

  // Legacy children API
  if (!columns && children) {
    return (
      <div
        className={cn(
          "relative overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]",
          className,
        )}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)]/60 backdrop-blur-sm">
            <Spinner size="md" />
          </div>
        )}
        <table
          className={cn(
            "w-full text-sm text-[var(--color-text-primary)]",
            tableClassName,
          )}
        >
          {children}
        </table>
      </div>
    );
  }

  // Data-driven API
  const isEmpty = !data || data.length === 0;

  return (
    <div
      className={cn(
        "relative overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-surface)]/60 backdrop-blur-sm">
          <Spinner size="md" />
        </div>
      )}

      {!isEmpty ? (
        <table
          className={cn(
            "w-full text-sm text-[var(--color-text-primary)]",
            tableClassName,
          )}
          role="table"
        >
          <thead
            className={cn(
              "border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]",
              stickyHeader && "sticky top-0 z-[1]",
            )}
          >
            <tr role="row">
              {columns?.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    cellPad,
                    col.sortable &&
                      "cursor-pointer select-none hover:text-[var(--color-text-primary)]",
                    col.headerClassName,
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() =>
                    col.sortable &&
                    onSort?.(
                      col.key,
                      sortKey === col.key && sortDirection === "asc"
                        ? "desc"
                        : "asc",
                    )
                  }
                  aria-sort={
                    sortKey === col.key
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  role="columnheader"
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIndicator
                        active={sortKey === col.key}
                        direction={sortDirection}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            className="divide-y divide-[var(--color-border)]"
            role="rowgroup"
          >
            {data?.map((row, rowIndex) => (
              <tr
                key={rowKey ? rowKey(row, rowIndex) : rowIndex}
                className={cn(
                  "transition-colors",
                  hoverable && "hover:bg-[var(--color-surface-hover)]",
                  striped &&
                    rowIndex % 2 === 1 &&
                    "bg-[var(--color-surface)]/50",
                  onRowClick && "cursor-pointer",
                )}
                onClick={() => onRowClick?.(row, rowIndex)}
                role="row"
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(row, rowIndex);
                  }
                }}
              >
                {columns?.map((col) => (
                  <td
                    key={col.key}
                    className={cn(cellPad, col.className)}
                    role="cell"
                  >
                    {col.render
                      ? col.render(row, rowIndex)
                      : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {emptyState ?? (
            <>
              <span className="text-3xl mb-2 opacity-40">📋</span>
              <p className="text-sm text-[var(--color-text-muted)]">
                No data available
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
