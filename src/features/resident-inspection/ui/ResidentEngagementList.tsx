// src/features/resident-inspection/ui/ResidentEngagementList.tsx

import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@design-system";
import type { ResidentEngagement } from "../domain/types";
import { residentEngagementAppService } from "../application";
import { CardSkeleton } from "@shared/ui/skeletons";
import { EmptyState } from "@shared/ui/EmptyState";
import { Building2, AlertTriangle } from "lucide-react";

interface ResidentEngagementListProps {
  projectId?: string;
  onSelectEngagement?: (engagement: ResidentEngagement) => void;
  onCreateNew?: () => void;
}

export function ResidentEngagementList({
  projectId,
  onSelectEngagement,
  onCreateNew,
}: ResidentEngagementListProps) {
  const [engagements, setEngagements] = useState<ResidentEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = projectId
          ? await residentEngagementAppService.getByProject(projectId)
          : await residentEngagementAppService.getAll();
        setEngagements(data);
      } catch (err: any) {
        setError(err.message || "Failed to load engagements");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PLANNED":
        return "info";
      case "DRAFT":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CLOSED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="w-full p-2">
        <div
          className="w-full space-y-3"
          role="status"
          aria-label="Loading engagements"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} lines={3} showHeader />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        role="alert"
      >
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load engagements"
          description={error}
        />
      </div>
    );
  }

  if (engagements.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No Resident Engagements"
        description="No resident inspection engagements have been created yet."
        action={
          onCreateNew ? (
            <Button variant="outline" onClick={onCreateNew}>
              Create First Engagement
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {engagements.map((engagement) => (
          <Card
            key={engagement.id}
            className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${onSelectEngagement ? "hover:bg-[var(--color-surface-hover)]" : ""}`}
          >
            <div onClick={() => onSelectEngagement?.(engagement)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">
                    {engagement.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {engagement.scope_of_work || "No scope defined"}
                  </p>
                </div>
                <Badge tone={getStatusColor(engagement.status) as any}>
                  {engagement.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Location:
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {engagement.location || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Start Date:
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {engagement.planned_start_date || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    End Date:
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {engagement.planned_end_date || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)]">
                    Created:
                  </span>
                  <p className="text-[var(--color-text-primary)] font-medium">
                    {engagement.created_at?.split("T")[0] || "—"}
                  </p>
                </div>
              </div>

              {engagement.notes && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded text-sm text-slate-700 dark:text-slate-300">
                  <strong>Notes:</strong> {engagement.notes}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {onCreateNew && engagements.length > 0 && (
        <Button variant="outline" onClick={onCreateNew} className="w-full">
          + Create New Engagement
        </Button>
      )}
    </div>
  );
}
