// src/features/tpi-management/ui/components/NCRTab.tsx
//
// Presentation-only tab that lists the Non-Conformity Reports (NCRs) and
// Observations of a TPI request and lets the user move each NCR through its
// lifecycle (OPEN → IN_PROGRESS → CLOSED / REJECTED).
//
// All data access goes through the inspection-management application layer
// (checklistAppService); this component never touches a repository directly.

import { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "@design-system";
import type { BadgeTone } from "@shared/ui/Badge";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import { checklistAppService } from "@/features/inspection-management/application/ChecklistApplicationService";
import type {
  NonConformityReport,
  Observation,
} from "@/features/inspection-management/repositories/NonConformityRepository";

interface NCRTabProps {
  requestId: string;
  /** equipment id → name, reused from the parent details modal */
  equipmentNames?: Record<string, string>;
}

type NCRSeverity = NonConformityReport["severity"];
type NCRStatus = NonConformityReport["status"];

// ── Presentation metadata (no business rules here) ──────────────────────────
const SEVERITY_CONFIG: Record<
  NCRSeverity,
  { label: string; tone: BadgeTone; color: string }
> = {
  MINOR: { label: "Minor", tone: "amber", color: "#f59e0b" },
  MAJOR: { label: "Major", tone: "danger", color: "#ef4444" },
  OBSERVATION: { label: "Observation", tone: "info", color: "#0ea5e9" },
  "HOLD POINT": { label: "Hold Point", tone: "violet", color: "#8b5cf6" },
};

const STATUS_CONFIG: Record<
  NCRStatus,
  { label: string; tone: BadgeTone; icon: string }
> = {
  OPEN: { label: "Open", tone: "warning", icon: "🟠" },
  IN_PROGRESS: { label: "In Progress", tone: "indigo", icon: "🔄" },
  CLOSED: { label: "Closed", tone: "emerald", icon: "✅" },
  REJECTED: { label: "Rejected", tone: "danger", icon: "⛔" },
};

export function NCRTab({ requestId, equipmentNames }: NCRTabProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [ncrs, setNcrs] = useState<NonConformityReport[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ncrData, obsData] = await Promise.all([
        checklistAppService.getNonConformitysByRequestId(requestId),
        checklistAppService.getObservationsByRequestId(requestId),
      ]);
      setNcrs(ncrData || []);
      setObservations(obsData || []);
    } catch (err: any) {
      console.error("Failed to load NCR data:", err);
      showToast(
        "error",
        "Load Failed",
        err.message || "Could not load Non-Conformity reports",
      );
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Optimistic status transition: update the UI immediately, persist in the
   * background, roll back silently if persistence fails.
   */
  const updateStatus = async (ncr: NonConformityReport, next: NCRStatus) => {
    const original = ncr;
    const isTerminal = next === "CLOSED" || next === "REJECTED";

    setNcrs((prev) =>
      prev.map((n) =>
        n.id === ncr.id
          ? {
              ...n,
              status: next,
              ...(isTerminal
                ? {
                    closed_by: user?.id || "unknown",
                    closed_at: new Date().toISOString(),
                  }
                : {}),
            }
          : n,
      ),
    );

    setUpdatingId(ncr.id);
    try {
      await checklistAppService.updateNonConformityStatus(
        ncr.id,
        next,
        user?.id || "unknown",
      );
      showToast(
        "success",
        "Status Updated",
        `${ncr.NonConformity_number} → ${STATUS_CONFIG[next].label}`,
      );
    } catch (err: any) {
      // Roll back silently.
      setNcrs((prev) =>
        prev.map((n) => (n.id === ncr.id ? original : n)),
      );
      showToast(
        "error",
        "Update Failed",
        err.message || "Could not update Non-Conformity status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openCount = ncrs.filter((n) => n.status === "OPEN").length;
  const inProgressCount = ncrs.filter((n) => n.status === "IN_PROGRESS").length;
  const closedCount = ncrs.filter((n) => n.status === "CLOSED").length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p
          className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Loading Non-Conformity reports...
        </p>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (ncrs.length === 0 && observations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <p
          className={`text-sm font-semibold mb-1 ${
            isDark ? "text-slate-300" : "text-slate-700"
          }`}
        >
          No Non-Conformities
        </p>
        <p
          className={`text-xs max-w-sm ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Rejected checklist items are automatically turned into Non-Conformity
          Reports while filling out the inspection checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary chips ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <SummaryChip
          isDark={isDark}
          value={ncrs.length}
          label="Total NCRs"
          icon="📋"
        />
        <SummaryChip
          isDark={isDark}
          value={openCount}
          label="Open"
          icon="🟠"
        />
        <SummaryChip
          isDark={isDark}
          value={inProgressCount}
          label="In Progress"
          icon="🔄"
        />
        <SummaryChip
          isDark={isDark}
          value={closedCount}
          label="Closed"
          icon="✅"
        />
        <SummaryChip
          isDark={isDark}
          value={observations.length}
          label="Observations"
          icon="👁️"
        />
      </div>

      {/* ── NCR list ──────────────────────────────────────────────────── */}
      {ncrs.length > 0 && (
        <div>
          <h3
            className={`text-sm font-bold mb-3 flex items-center gap-2 ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            ⚠️ Non-Conformity Reports ({ncrs.length})
          </h3>
          <div className="space-y-3">
            {ncrs.map((ncr) => {
              const severity = SEVERITY_CONFIG[ncr.severity] || SEVERITY_CONFIG.MINOR;
              const status = STATUS_CONFIG[ncr.status] || STATUS_CONFIG.OPEN;
              const equipmentName = ncr.equipment_id
                ? equipmentNames?.[ncr.equipment_id] || ncr.equipment_id
                : "—";

              return (
                <div
                  key={ncr.id}
                  className={`p-4 rounded-xl border ${
                    isDark
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isDark ? "text-indigo-300" : "text-indigo-700"
                        }`}
                      >
                        {ncr.NonConformity_number}
                      </span>
                      <Badge
                        tone={severity.tone}
                        className="text-[9px]"
                        dot
                      >
                        {severity.label}
                      </Badge>
                      <Badge tone={status.tone} className="text-[9px]" dot>
                        {status.icon} {status.label}
                      </Badge>
                    </div>

                    <span
                      className={`text-[10px] shrink-0 ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      📅 {formatJalaliDate(ncr.created_at)}
                    </span>
                  </div>

                  {/* Title + description */}
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    {ncr.title}
                  </p>
                  {ncr.description && (
                    <p
                      className={`text-xs leading-relaxed ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {ncr.description}
                    </p>
                  )}

                  {/* Checklist source quote */}
                  {ncr.checklist_text && (
                    <div
                      className={`mt-2 px-3 py-2 rounded-lg border-l-4 text-[11px] italic ${
                        isDark
                          ? "bg-slate-900/50 border-indigo-500/60 text-slate-400"
                          : "bg-slate-50 border-indigo-400 text-slate-500"
                      }`}
                    >
                      “{ncr.checklist_text}”
                    </div>
                  )}

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-[10px]">
                    <MetaItem
                      isDark={isDark}
                      label="Equipment"
                      value={equipmentName}
                    />
                    <MetaItem
                      isDark={isDark}
                      label="Method"
                      value={ncr.inspection_method || "—"}
                    />
                    <MetaItem
                      isDark={isDark}
                      label="Category"
                      value={ncr.category || "—"}
                    />
                  </div>

                  {/* Corrective action block */}
                  {(ncr.corrective_action ||
                    ncr.responsible_person ||
                    ncr.due_date) && (
                    <div
                      className={`mt-3 p-3 rounded-lg border ${
                        isDark
                          ? "bg-slate-900/40 border-slate-700"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        🔧 Corrective Action
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
                        {ncr.corrective_action && (
                          <div className="md:col-span-2">
                            <span
                              className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {ncr.corrective_action}
                            </span>
                          </div>
                        )}
                        {ncr.responsible_person && (
                          <MetaItem
                            isDark={isDark}
                            label="Responsible"
                            value={ncr.responsible_person}
                          />
                        )}
                        {ncr.due_date && (
                          <MetaItem
                            isDark={isDark}
                            label="Due Date"
                            value={formatJalaliDate(ncr.due_date)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Closure info */}
                  {(ncr.status === "CLOSED" || ncr.status === "REJECTED") &&
                    ncr.closed_at && (
                      <p
                        className={`mt-2 text-[10px] ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        {ncr.status === "CLOSED" ? "✅" : "⛔"} Closed on{" "}
                        {formatJalaliDate(ncr.closed_at)}
                        {ncr.closed_by ? ` by ${ncr.closed_by}` : ""}
                      </p>
                    )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center gap-2 justify-end">
                    {ncr.status === "OPEN" && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={updatingId === ncr.id}
                        onClick={() => updateStatus(ncr, "IN_PROGRESS")}
                      >
                        {updatingId === ncr.id ? "..." : "▶ Start"}
                      </Button>
                    )}
                    {ncr.status === "IN_PROGRESS" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={updatingId === ncr.id}
                          onClick={() => updateStatus(ncr, "REJECTED")}
                          className="text-rose-500"
                        >
                          ⛔ Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={updatingId === ncr.id}
                          onClick={() => updateStatus(ncr, "CLOSED")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          ✅ Close
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Observations ───────────────────────────────────────────────── */}
      {observations.length > 0 && (
        <div>
          <h3
            className={`text-sm font-bold mb-3 flex items-center gap-2 ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            👁️ Observations ({observations.length})
          </h3>
          <div className="space-y-2">
            {observations.map((obs) => {
              const equipmentName = obs.equipment_id
                ? equipmentNames?.[obs.equipment_id] || obs.equipment_id
                : "—";
              return (
                <div
                  key={obs.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    isDark
                      ? "bg-slate-800/40 border-sky-500/60"
                      : "bg-sky-50/50 border-sky-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-snug ${
                          isDark ? "text-slate-200" : "text-slate-700"
                        }`}
                      >
                        {obs.observation_text}
                      </p>
                      {obs.checklist_text && (
                        <p
                          className={`mt-1 text-[10px] italic ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          “{obs.checklist_text}”
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] shrink-0 ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      📅 {formatJalaliDate(obs.created_at)}
                    </span>
                  </div>
                  <div
                    className={`mt-1.5 text-[10px] flex items-center gap-3 ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    <span>🔧 {equipmentName}</span>
                    {obs.inspection_method && <span>🔬 {obs.inspection_method}</span>}
                    {obs.category && <span>🏷️ {obs.category}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small presentational helpers ────────────────────────────────────────────

function SummaryChip({
  isDark,
  value,
  label,
  icon,
}: {
  isDark: boolean;
  value: number;
  label: string;
  icon: string;
}) {
  return (
    <div
      className={`p-3 rounded-lg text-center ${
        isDark ? "bg-slate-800/60" : "bg-slate-100"
      }`}
    >
      <div
        className={`text-lg font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}
      >
        {icon} {value}
      </div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function MetaItem({
  isDark,
  label,
  value,
}: {
  isDark: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div
        className={`text-[9px] font-semibold uppercase tracking-wider ${
          isDark ? "text-slate-500" : "text-slate-400"
        }`}
      >
        {label}
      </div>
      <div
        className={`truncate font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
