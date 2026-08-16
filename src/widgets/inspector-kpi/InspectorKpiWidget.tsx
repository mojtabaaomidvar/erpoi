// src/widgets/inspector-kpi/InspectorKpiWidget.tsx

import { Card } from "@shared/ui/Card";
import { Spinner } from "@shared/ui/Spinner";
import { EmptyState } from "@shared/ui/EmptyState";
import { Badge } from "@shared/ui/Badge";
import { Users } from "lucide-react";
import { useInspectors } from "@features/inspector-managment/hooks/useInspectors";
import { cn } from "@shared/lib/cn";

export function InspectorKpiWidget() {
  const { stats, loading, error } = useInspectors();

  if (loading) {
    return (
      <Card className="animate-fadeIn flex items-center justify-center min-h-[200px]">
        <Spinner size="md" label="Loading inspectors..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fadeIn">
        <div className="text-sm text-[var(--color-danger)]">
          Failed to load inspector data
        </div>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="animate-fadeIn">
        <EmptyState
          icon={Users}
          title="No Inspectors"
          description="No inspector records found."
        />
      </Card>
    );
  }

  const utilization =
    stats.total > 0
      ? Math.round(((stats.total - stats.available) / stats.total) * 100)
      : 0;

  return (
    <Card className="animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          Inspector Workload
        </h3>
        <Badge tone="info">{stats.total} Total</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Available
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.available}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            On Mission / Leave
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.total - stats.available}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--color-text-secondary)]">
              Utilization
            </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {utilization}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--color-muted)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                utilization >= 80
                  ? "bg-rose-500"
                  : utilization >= 50
                    ? "bg-amber-500"
                    : "bg-emerald-500",
              )}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]">
          <div className="text-xs">
            <span className="text-[var(--color-text-muted)]">
              ICS Members:{" "}
            </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {stats.ics_member}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-[var(--color-text-muted)]">Freelance: </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {stats.freelance}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
