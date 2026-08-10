// src/features/tpi-management/ui/components/SessionsTab.tsx

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { Button, Badge } from "@design-system";
import { useActiveSession } from "@/features/inspection-management/context/ActiveSessionContext";
import { inspectionSessionAppService } from "@/features/inspection-management/application/InspectionSessionApplicationService";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import { INSPECTION_EXECUTION_STATUS_CONFIG } from "@/features/inspection-management/constants";
import { METHOD_METADATA } from "@/features/inspection-management/constants";
import type { TPIRequest } from "../../domain/types";
import { showToast } from "@/shared/ui/ToastContainer";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import { SessionCreateModal } from "./SessionCreateModal";

interface SessionsTabProps {
  request: TPIRequest;
  showCreateModal?: boolean;
  onCloseCreateModal?: () => void;
}

export function SessionsTab({
  request,
  showCreateModal,
  onCloseCreateModal,
}: SessionsTabProps) {
  const { isDark } = useTheme();
  const {
    sessions,
    setSessions,
    activeSession,
    setActiveSession,
    loading,
    setLoading,
  } = useActiveSession();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Collect all stages/methods from all sessions for the create form
  const existingStages = useMemo(
    () => [...new Set(sessions.flatMap((s) => s.stages))],
    [sessions],
  );
  const existingMethods = useMemo(
    () => [...new Set(sessions.flatMap((s) => s.methods))],
    [sessions],
  );

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await inspectionSessionAppService.getSessionsByRequestId(
        request.id,
      );
      setSessions(data);

      // Auto-select first non-cancelled session
      const active = data.find((s) => s.status !== "CANCELLED");
      if (active && !activeSession) {
        setActiveSession(active);
      } else if (!active && data.length > 0) {
        // All cancelled -> select the latest one
        setActiveSession(data[data.length - 1]);
      }
    } catch (err: any) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id]);

  // Open create modal from external trigger (e.g., SessionSelector "+" button)
  useEffect(() => {
    if (showCreateModal) {
      setCreateModalOpen(true);
      onCloseCreateModal?.();
    }
  }, [showCreateModal, onCloseCreateModal]);

  const handleCreateSession = async (data: {
    session_date: string;
    stages: string[];
    methods: string[];
    equipment_ids: string[];
    sub_vendor: string;
    notes: string;
  }) => {
    // Convert jalali date to ISO for storage (YYYY/MM/DD → YYYY-MM-DD)
    const isoDate = data.session_date.replace(/\//g, "-");

    const created = await inspectionSessionAppService.createSession({
      tpi_request_id: request.id,
      session_date: isoDate,
      stages: data.stages,
      methods: data.methods,
      equipment_ids:
        data.equipment_ids.length > 0
          ? data.equipment_ids
          : (request as any).equipment_type_id || [],
      sub_vendor: data.sub_vendor || undefined,
      notes: data.notes || undefined,
    });

    // Add to sessions and set as active
    setSessions([...sessions, created]);
    setActiveSession(created);
  };

  const handleCancelSession = async (session: InspectionSession) => {
    setCancellingId(session.id);
    try {
      await inspectionSessionAppService.cancelSession(session.id);
      setSessions(
        sessions.map((s) =>
          s.id === session.id ? { ...s, status: "CANCELLED" as const } : s,
        ),
      );
      showToast(
        "success",
        "Cancelled",
        `Session #${session.session_number} cancelled`,
      );
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleActivate = (session: InspectionSession) => {
    setActiveSession(session);
    showToast(
      "info",
      "Activated",
      `Switched to Session #${session.session_number}`,
    );
  };

  // Separate active & cancelled sessions for layout
  const activeSessions = sessions.filter((s) => s.status !== "CANCELLED");
  const cancelledSessions = sessions.filter((s) => s.status === "CANCELLED");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className={`text-sm font-bold ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            📅 Inspection Sessions ({sessions.length})
          </h3>
          {activeSession && (
            <p
              className={`text-[11px] mt-0.5 ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              Active: Session #{activeSession.session_number} —{" "}
              {formatJalaliDate(activeSession.session_date)}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
        >
          ➕ New Session
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-2xl animate-spin mb-2">⏳</div>
          <p className="text-xs text-slate-500">Loading sessions...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && sessions.length === 0 && (
        <div
          className={`p-8 rounded-xl border text-center ${
            isDark
              ? "bg-slate-800/30 border-slate-700"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="text-4xl mb-3">📅</div>
          <p
            className={`text-sm font-medium mb-1 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            No inspection sessions yet
          </p>
          <p
            className={`text-xs mb-4 ${
              isDark ? "text-slate-500" : "text-slate-500"
            }`}
          >
            Create your first session to start the inspection process
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
          >
            ➕ Start Session 1
          </Button>
        </div>
      )}

      {/* Active Sessions */}
      {!loading && activeSessions.length > 0 && (
        <div>
          <h4
            className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {activeSessions.length > 1 ? "All Sessions" : "Session"}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSessions.map((session) => {
              const isActive = activeSession?.id === session.id;
              const statusConfig = INSPECTION_EXECUTION_STATUS_CONFIG[
                session.status as keyof typeof INSPECTION_EXECUTION_STATUS_CONFIG
              ] || { label: session.status, color: "slate", icon: "❓" };

              const methodsWithMeta = session.methods.map(
                (m) => METHOD_METADATA[m] || { method: m, icon: "🔍" },
              );

              return (
                <div
                  key={session.id}
                  className={`rounded-xl border transition-all ${
                    isActive
                      ? isDark
                        ? "bg-indigo-900/20 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-indigo-50/50 border-indigo-400 shadow-md ring-1 ring-indigo-300"
                      : isDark
                        ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                        : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={`text-sm font-bold ${
                              isActive
                                ? isDark
                                  ? "text-indigo-200"
                                  : "text-indigo-800"
                                : isDark
                                  ? "text-slate-100"
                                  : "text-slate-900"
                            }`}
                          >
                            Session #{session.session_number}
                          </span>
                          <Badge
                            tone={statusConfig.color as any}
                            className="text-[9px]"
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
                          {isActive && (
                            <Badge tone="indigo" className="text-[9px]">
                              ✅ Active
                            </Badge>
                          )}
                        </div>
                        <p
                          className={`text-xs ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          📅 {formatJalaliDate(session.session_date)}
                        </p>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        {!isActive && session.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleActivate(session)}
                            className={`text-[10px] px-2 py-1 rounded transition-colors font-medium ${
                              isDark
                                ? "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            }`}
                          >
                            Activate
                          </button>
                        )}
                        {session.status !== "CANCELLED" &&
                          session.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleCancelSession(session)}
                              disabled={cancellingId === session.id}
                              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                                isDark
                                  ? "text-rose-400 hover:bg-rose-900/30"
                                  : "text-rose-600 hover:bg-rose-50"
                              } disabled:opacity-50`}
                            >
                              {cancellingId === session.id ? "⏳" : "Cancel"}
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Equipment info */}
                    {session.equipment_ids &&
                      session.equipment_ids.length > 0 && (
                        <div
                          className={`text-[10px] mb-2 ${
                            isDark ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          🔧 Equipment: {session.equipment_ids.join(", ")}
                        </div>
                      )}
                  </div>

                  {/* Tags row */}
                  <div
                    className={`px-4 py-2.5 border-t flex flex-wrap gap-1.5 text-[10px] ${
                      isDark ? "border-slate-700" : "border-slate-100"
                    }`}
                  >
                    {/* Stages */}
                    {session.stages.map((s, i) => (
                      <span
                        key={`stage-${i}`}
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          isDark
                            ? "bg-indigo-900/40 text-indigo-300"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        ⚙️ {s}
                      </span>
                    ))}

                    {/* Methods */}
                    {methodsWithMeta.map((m, i) => (
                      <span
                        key={`method-${i}`}
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          isDark
                            ? "bg-emerald-900/40 text-emerald-300"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {m.icon} {m.method}
                      </span>
                    ))}
                  </div>

                  {/* Notes */}
                  {session.notes && (
                    <div
                      className={`px-4 py-2 text-[10px] border-t italic ${
                        isDark
                          ? "border-slate-700 text-slate-400"
                          : "border-slate-100 text-slate-500"
                      }`}
                    >
                      📝 {session.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled Sessions */}
      {!loading && cancelledSessions.length > 0 && (
        <div>
          <h4
            className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            🚫 Cancelled ({cancelledSessions.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
            {cancelledSessions.map((session) => (
              <div
                key={session.id}
                className={`rounded-xl border p-4 ${
                  isDark
                    ? "bg-slate-800/20 border-slate-700"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-sm font-bold line-through ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Session #{session.session_number}
                  </span>
                  <Badge tone="danger" className="text-[9px]">
                    🚫 Cancelled
                  </Badge>
                </div>
                <p
                  className={`text-xs ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  📅 {formatJalaliDate(session.session_date)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <SessionCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        request={request}
        existingStages={existingStages}
        existingMethods={existingMethods}
        existingSubVendors={sessions
          .map((s) => s.sub_vendor)
          .filter((v): v is string => !!v)}
        onSubmit={handleCreateSession}
      />
    </div>
  );
}
