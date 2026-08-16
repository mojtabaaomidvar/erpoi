// src/features/resident-inspection/ui/ResidentEngagementDetail.tsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@design-system";
import { showToast } from "@shared/ui/ToastContainer";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ResidentElements } from "@shared/authorization/ui/elements/ResidentElements";
import {
  residentEngagementDetailQueryService,
  type ResidentEngagementDetailSnapshot,
} from "../application";
import { tpiEngagementAppService } from "@/features/tpi-management/application";
import type { ResidentEngagement } from "../domain/types";

interface ResidentEngagementDetailProps {
  engagement: ResidentEngagement;
  onEdit?: (engagement: ResidentEngagement) => void;
  onChanged?: (engagement: ResidentEngagement) => void;
  onBack?: () => void;
}

type DetailTab =
  | "overview"
  | "assignments"
  | "activities"
  | "evidence"
  | "mandays"
  | "quality"
  | "itp"
  | "lookahead"
  | "reports"
  | "closeout";

const EMPTY_SNAPSHOT: ResidentEngagementDetailSnapshot = {
  assignments: [],
  activities: [],
  evidence: [],
  manDays: [],
  qualityIssues: [],
  correctiveActions: [],
  itpMonitoring: [],
  lookahead: [],
  reports: [],
  closeout: null,
};

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
      {message}
    </div>
  );
}

function RecordsTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number | undefined | null>>;
}) {
  if (rows.length === 0) return <EmptyState message="No records yet." />;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3">
                  {cell ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResidentEngagementDetail({
  engagement,
  onEdit,
  onChanged,
  onBack,
}: ResidentEngagementDetailProps) {
  const { canAccessElement } = usePermissionMapping();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [loading, setLoading] = useState(true);
  const [transitioningTo, setTransitioningTo] = useState<
    ResidentEngagement["status"] | null
  >(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshot(
        await residentEngagementDetailQueryService.getSnapshot(engagement.id),
      );
    } catch (error) {
      showToast(
        "error",
        "Resident detail failed",
        error instanceof Error
          ? error.message
          : "Unable to load Resident workflow data",
      );
    } finally {
      setLoading(false);
    }
  }, [engagement.id]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const canViewTeam = canAccessElement(
    ResidentElements.ResidentDetails.team_section.id,
  );
  const canViewActivities = canAccessElement(
    ResidentElements.ResidentDetails.activities_section.id,
  );
  const canViewManDays = canAccessElement(
    ResidentElements.ResidentDetails.mandays_section.id,
  );
  const canViewQuality = canAccessElement(
    ResidentElements.ResidentDetails.quality_section.id,
  );
  const canViewReports = canAccessElement(
    ResidentElements.ResidentDetails.reports_section.id,
  );

  const tabs = useMemo<Array<[DetailTab, string]>>(() => {
    const availableTabs: Array<[DetailTab, string]> = [
      ["overview", "Overview"],
    ];
    if (canViewTeam) {
      availableTabs.push([
        "assignments",
        `Assignments (${snapshot.assignments.length})`,
      ]);
    }
    if (canViewActivities) {
      availableTabs.push([
        "activities",
        `Daily Activities (${snapshot.activities.length})`,
      ]);
      availableTabs.push([
        "evidence",
        `Evidence (${snapshot.evidence.length})`,
      ]);
    }
    if (canViewManDays) {
      availableTabs.push(["mandays", `Man-Days (${snapshot.manDays.length})`]);
    }
    if (canViewQuality) {
      availableTabs.push([
        "quality",
        `Quality & CA (${snapshot.qualityIssues.length})`,
      ]);
    }
    if (canViewActivities) {
      availableTabs.push(["itp", `ITP (${snapshot.itpMonitoring.length})`]);
      availableTabs.push([
        "lookahead",
        `Lookahead (${snapshot.lookahead.length})`,
      ]);
    }
    if (canViewReports) {
      availableTabs.push(["reports", `Reports (${snapshot.reports.length})`]);
      availableTabs.push(["closeout", "Closeout / Punch List"]);
    }
    return availableTabs;
  }, [
    canViewActivities,
    canViewManDays,
    canViewQuality,
    canViewReports,
    canViewTeam,
    snapshot,
  ]);

  const transition = async (
    status: "PLANNED" | "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CLOSED",
  ) => {
    if (transitioningTo) return;

    setTransitioningTo(status);
    try {
      const updated = await tpiEngagementAppService.transitionStatus(
        engagement.id,
        status,
      );
      if (updated.mode !== "RESIDENT") {
        throw new Error("Expected a Resident TPI engagement");
      }
      showToast("success", "Success", `Engagement moved to ${status}`);
      onChanged?.(updated.engagement);
    } catch (error) {
      showToast(
        "error",
        "Transition failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setTransitioningTo(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{engagement.title}</h2>
          <p className="mt-1 text-slate-500">{engagement.scope_of_work}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            tone={
              engagement.status === "ACTIVE" ||
              engagement.status === "COMPLETED"
                ? "success"
                : "neutral"
            }
          >
            {engagement.status}
          </Badge>
          <Button variant="outline" onClick={() => void loadSnapshot()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
              activeTab === id
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <EmptyState message="Loading Resident workflow..." />
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                  <strong>Planned window</strong>
                  <p>
                    {formatDate(engagement.planned_start_date)} -{" "}
                    {formatDate(engagement.planned_end_date)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                  <strong>Location</strong>
                  <p>
                    {engagement.location ??
                      engagement.site_address ??
                      "Not specified"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                  <strong>Billable effort</strong>
                  <p>
                    {snapshot.manDays
                      .filter((item) => item.is_billable)
                      .reduce(
                        (total, item) =>
                          total +
                          item.hours_worked +
                          (item.overtime_hours ?? 0),
                        0,
                      )}{" "}
                    hours
                  </p>
                </div>
              </div>
              <p className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                {engagement.notes ?? engagement.description ?? "No notes."}
              </p>
            </div>
          )}

          {activeTab === "assignments" && (
            <RecordsTable
              headers={["Inspector", "Role", "Disciplines", "Window", "Status"]}
              rows={snapshot.assignments.map((item) => [
                item.inspector_id,
                item.role_description,
                item.disciplines.join(", "),
                `${formatDate(item.planned_start_date)} - ${formatDate(item.planned_end_date)}`,
                item.status,
              ])}
            />
          )}
          {activeTab === "activities" && (
            <RecordsTable
              headers={[
                "Date",
                "Activity",
                "Type",
                "Hours",
                "Status",
                "Outcome",
              ]}
              rows={snapshot.activities.map((item) => [
                formatDate(item.activity_date),
                item.title,
                item.activity_type,
                item.hours_spent,
                item.status,
                item.outcome,
              ])}
            />
          )}
          {activeTab === "evidence" && (
            <RecordsTable
              headers={["File", "Activity", "Type", "Size", "Description"]}
              rows={snapshot.evidence.map((item) => [
                item.file_name,
                snapshot.activities.find(
                  (activity) => activity.id === item.resident_daily_activity_id,
                )?.title ?? item.resident_daily_activity_id,
                item.mime_type,
                item.file_size
                  ? `${Math.ceil(item.file_size / 1024)} KB`
                  : undefined,
                item.description,
              ])}
            />
          )}
          {activeTab === "mandays" && (
            <RecordsTable
              headers={[
                "Date",
                "Inspector",
                "Attendance",
                "Hours",
                "Overtime",
                "Billable",
              ]}
              rows={snapshot.manDays.map((item) => [
                formatDate(item.work_date),
                item.inspector_id,
                item.attendance_status,
                item.hours_worked,
                item.overtime_hours ?? 0,
                item.is_billable ? "Yes" : "No",
              ])}
            />
          )}

          {activeTab === "quality" && (
            <div className="space-y-6">
              <RecordsTable
                headers={["Issue", "Severity", "Raised", "Status", "Location"]}
                rows={snapshot.qualityIssues.map((item) => [
                  item.title,
                  item.severity,
                  formatDate(item.raised_date),
                  item.status,
                  item.location_found,
                ])}
              />
              <div>
                <h3 className="mb-3 font-semibold">Corrective Actions</h3>
                <RecordsTable
                  headers={[
                    "Action",
                    "Responsible",
                    "Due",
                    "Status",
                    "Verification",
                  ]}
                  rows={snapshot.correctiveActions.map((item) => [
                    item.title,
                    item.responsible_party,
                    formatDate(item.planned_completion_date),
                    item.status,
                    item.verification_notes,
                  ])}
                />
              </div>
            </div>
          )}

          {activeTab === "itp" && (
            <RecordsTable
              headers={[
                "Activity",
                "Point",
                "Planned",
                "Actual",
                "Status",
                "Result",
              ]}
              rows={snapshot.itpMonitoring.map((item) => [
                item.activity_description,
                item.point_type,
                formatDate(item.planned_date),
                formatDate(item.actual_date),
                item.status,
                item.result_notes,
              ])}
            />
          )}
          {activeTab === "lookahead" && (
            <RecordsTable
              headers={[
                "Activity",
                "Window",
                "Priority",
                "Status",
                "Vendor / Site",
              ]}
              rows={snapshot.lookahead.map((item) => [
                item.title,
                `${formatDate(item.planned_start_date)} - ${formatDate(item.planned_end_date)}`,
                item.priority,
                item.status,
                item.vendor_or_site,
              ])}
            />
          )}
          {activeTab === "reports" && (
            <RecordsTable
              headers={["Report", "Type", "Period", "Status", "File"]}
              rows={snapshot.reports.map((item) => [
                item.title,
                item.report_type,
                `${formatDate(item.report_period_start)} - ${formatDate(item.report_period_end)}`,
                item.status,
                item.file_url ? "Available" : "—",
              ])}
            />
          )}

          {activeTab === "closeout" &&
            (snapshot.closeout ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                  <strong>Status:</strong> {snapshot.closeout.status}
                </div>
                <h3 className="font-semibold">Punch List</h3>
                {snapshot.closeout.punch_list_items?.length ? (
                  <ul className="list-disc space-y-1 pl-6">
                    {snapshot.closeout.punch_list_items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState message="No punch-list items." />
                )}
                <p>
                  {snapshot.closeout.handover_notes ??
                    snapshot.closeout.lessons_learned ??
                    "No handover notes."}
                </p>
              </div>
            ) : (
              <EmptyState message="Closeout has not been started." />
            ))}
        </>
      )}

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        {engagement.status === "DRAFT" &&
          canAccessElement(
            ResidentElements.ResidentDetails.btn_activate.id,
          ) && (
            <Button
              variant="primary"
              disabled={transitioningTo !== null}
              onClick={() => void transition("PLANNED")}
            >
              {transitioningTo === "PLANNED" ? "Planning..." : "Plan"}
            </Button>
          )}
        {engagement.status === "PLANNED" &&
          canAccessElement(
            ResidentElements.ResidentDetails.btn_activate.id,
          ) && (
            <Button
              variant="primary"
              disabled={transitioningTo !== null}
              onClick={() => void transition("ACTIVE")}
            >
              {transitioningTo === "ACTIVE" ? "Activating..." : "Activate"}
            </Button>
          )}
        {engagement.status === "SUSPENDED" &&
          canAccessElement(
            ResidentElements.ResidentDetails.btn_activate.id,
          ) && (
            <Button
              variant="primary"
              disabled={transitioningTo !== null}
              onClick={() => void transition("ACTIVE")}
            >
              {transitioningTo === "ACTIVE" ? "Resuming..." : "Resume"}
            </Button>
          )}
        {engagement.status === "ACTIVE" &&
          canAccessElement(ResidentElements.ResidentDetails.btn_suspend.id) && (
            <Button
              variant="outline"
              disabled={transitioningTo !== null}
              onClick={() => void transition("SUSPENDED")}
            >
              {transitioningTo === "SUSPENDED" ? "Suspending..." : "Suspend"}
            </Button>
          )}
        {engagement.status === "ACTIVE" &&
          canAccessElement(
            ResidentElements.ResidentDetails.btn_complete.id,
          ) && (
            <Button
              variant="secondary"
              disabled={transitioningTo !== null}
              onClick={() => void transition("COMPLETED")}
            >
              {transitioningTo === "COMPLETED" ? "Completing..." : "Complete"}
            </Button>
          )}
        {engagement.status === "COMPLETED" &&
          canAccessElement(ResidentElements.ResidentDetails.btn_close.id) && (
            <Button
              variant="outline"
              disabled={transitioningTo !== null}
              onClick={() => void transition("CLOSED")}
            >
              {transitioningTo === "CLOSED" ? "Closing..." : "Close"}
            </Button>
          )}
        {onEdit &&
          canAccessElement(ResidentElements.ResidentDetails.btn_edit.id) && (
            <Button variant="outline" onClick={() => onEdit(engagement)}>
              Edit
            </Button>
          )}
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
