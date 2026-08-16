// src/widgets/project-overview/ProjectOverviewWidget.tsx

import { useMemo } from "react";
import { Card } from "@shared/ui/Card";
import { Spinner } from "@shared/ui/Spinner";
import { EmptyState } from "@shared/ui/EmptyState";
import { Badge } from "@shared/ui/Badge";
import { FolderKanban } from "lucide-react";
import { useProjects } from "@features/project-management/hooks/useProjects";
import { cn } from "@shared/lib/cn";

export function ProjectOverviewWidget() {
  const { projects, loading, error } = useProjects();

  const stats = useMemo(() => {
    if (!projects.length) return null;

    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;
    const pending = projects.filter(
      (p) => p.status === "PENDING" || p.status === "NOT_STARTED",
    ).length;
    const onHold = projects.filter(
      (p) => p.status === "ON_HOLD" || p.status === "SUSPENDED",
    ).length;

    return {
      total: projects.length,
      active,
      completed,
      pending,
      onHold,
    };
  }, [projects]);

  if (loading) {
    return (
      <Card className="animate-fadeIn flex items-center justify-center min-h-[200px]">
        <Spinner size="md" label="Loading projects..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="animate-fadeIn">
        <div className="text-sm text-[var(--color-danger)]">
          Failed to load project data
        </div>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="animate-fadeIn">
        <EmptyState
          icon={FolderKanban}
          title="No Projects"
          description="No project records found."
        />
      </Card>
    );
  }

  const activeRate =
    stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <Card className="animate-fadeIn space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          Project Pipeline
        </h3>
        <Badge tone="indigo">{stats.total} Total</Badge>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">Active</div>
          <div className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
            {stats.active}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-3">
          <div className="text-xs text-[var(--color-text-muted)]">
            Completed
          </div>
          <div className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">
            {stats.completed}
          </div>
        </div>
      </div>

      {/* Status Distribution Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">Active Rate</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {activeRate}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              activeRate >= 70
                ? "bg-emerald-500"
                : activeRate >= 40
                  ? "bg-amber-500"
                  : "bg-rose-500",
            )}
            style={{ width: `${Math.min(activeRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[var(--color-border)] pt-3">
        <div className="text-xs">
          <span className="text-[var(--color-text-muted)]">Pending: </span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {stats.pending}
          </span>
        </div>
        <div className="text-xs">
          <span className="text-[var(--color-text-muted)]">On Hold: </span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {stats.onHold}
          </span>
        </div>
      </div>
    </Card>
  );
}
