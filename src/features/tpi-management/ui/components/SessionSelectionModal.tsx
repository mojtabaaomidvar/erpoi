// src/features/tpi-management/ui/components/SessionSelectionModal.tsx

import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { inspectionSessionAppService } from "@/features/inspection-management/application/InspectionSessionApplicationService";
import type { InspectionSession } from "@/features/inspection-management/domain/models/InspectionSession";
import type { TPIRequest } from "../../domain/types";
import { INSPECTION_EXECUTION_STATUS_CONFIG } from "@/features/inspection-management/constants";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import { showToast } from "@/shared/ui/ToastContainer";
import { SessionCreateModal } from "./SessionCreateModal";
import { DeletionReasonModal } from "./DeletionReasonModal";

interface SessionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TPIRequest | null;
  onSessionSelect: (
    request: TPIRequest,
    session: InspectionSession | null,
  ) => void;
  /** Submits the package deletion request for managerial approval. */
  onDelete: (request: TPIRequest, reason: string) => void | Promise<void>;
  /** Whether the user has permission to delete the request. */
  canDelete?: boolean;
}

export function SessionSelectionModal({
  isOpen,
  onClose,
  request,
  onSessionSelect,
  onDelete,
  canDelete = true,
}: SessionSelectionModalProps) {
  const { isDark } = useTheme();
  const [sessions, setSessions] = useState<InspectionSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteRequest, setShowDeleteRequest] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const requestId = request?.id;

  // Load sessions when modal opens
  useEffect(() => {
    if (isOpen && requestId) {
      setLoading(true);
      inspectionSessionAppService
        .getSessionsByRequestId(requestId)
        .then((data) => {
          setSessions(data);
        })
        .catch((err) => {
          console.error("Failed to load sessions:", err);
          showToast("error", "Load Failed", "Could not load sessions");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, requestId]);

  // Collect all previous stages/methods for session create form
  const existingStages = useMemo(
    () => [...new Set(sessions.flatMap((s) => s.stages))],
    [sessions],
  );
  const existingMethods = useMemo(
    () => [...new Set(sessions.flatMap((s) => s.methods))],
    [sessions],
  );

  const handleSessionClick = (session: InspectionSession) => {
    if (!request) return;
    if (session.status === "CANCELLED") {
      showToast("warning", "Cancelled", "This session has been cancelled");
      return;
    }
    onSessionSelect(request, session);
  };

  // 🗑️ Delete the WHOLE TPI request
  const handleDeleteRequest = async (reason: string) => {
    if (!request) return;
    setRequestingDeletion(true);
    try {
      await onDelete(request, reason);
      setShowDeleteRequest(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not submit deletion request";
      showToast("error", "Request Failed", message);
    } finally {
      setRequestingDeletion(false);
    }
  };

  const handleCreateSession = async (data: {
    session_date: string;
    stages: string[];
    methods: string[];
    equipment_ids: string[];
    sub_vendor: string;
    notes: string;
  }) => {
    if (!request) return;

    try {
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

      showToast("success", "Created", "Session created successfully");
      setShowCreateModal(false);
      onSessionSelect(request, created);
    } catch (err: any) {
      showToast("error", "Failed", err.message || "Could not create session");
    }
  };

  if (!request) return null;

  const firstStage =
    Array.isArray(request.stages) && request.stages.length > 0
      ? request.stages[0]
      : "No Stage";
  const displayTitle = `${firstStage}`;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Inspection Sessions"
        size="lg"
      >
        {/* Header with inspection info */}
        <div
          className={`px-6 py-3 border-b ${
            isDark
              ? "border-slate-700 bg-slate-900/50"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p
            className={`text-xs ${
              isDark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            📋 Inspection:{" "}
            <span
              className={`font-semibold ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}
            >
              {displayTitle}
            </span>
          </p>
          <p
            className={`text-[10px] mt-0.5 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
          >
            📅 Planned: {formatJalaliDate(request.inspection_date)} | 🏷️{" "}
            {request.tpi_mode === "SPOT" ? "Spot" : "Resident"}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-2xl animate-spin mb-3">⏳</div>
              <p className="text-xs text-slate-500">Loading sessions...</p>
            </div>
          )}

          {/* No sessions */}
          {!loading && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="text-5xl mb-4">📅</div>
              <p
                className={`text-sm font-bold mb-2 ${
                  isDark ? "text-slate-200" : "text-slate-800"
                }`}
              >
                No Sessions Yet
              </p>
              <p
                className={`text-xs mb-6 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Start the inspection process by creating the first session.
                Items from the initial inspection will be pre-selected.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowCreateModal(true)}
                className="gap-2"
              >
                ➕ Start Session 1
              </Button>
            </div>
          )}

          {/* Session list */}
          {!loading && sessions.length > 0 && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Select a session to continue:
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                >
                  ➕ New Session
                </Button>
              </div>

              {sessions.map((session) => {
                const isCancelled = session.status === "CANCELLED";
                const statusConfig = INSPECTION_EXECUTION_STATUS_CONFIG[
                  session.status as keyof typeof INSPECTION_EXECUTION_STATUS_CONFIG
                ] || {
                  label: session.status,
                  color: "slate",
                  icon: "❓",
                };

                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    disabled={isCancelled}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${
                      isCancelled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer hover:scale-[1.01] hover:shadow-md"
                    } ${
                      isDark
                        ? "bg-slate-800/50 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800"
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isDark ? "text-slate-100" : "text-slate-900"
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
                        {isCancelled && (
                          <span className="text-[10px] text-rose-500 font-medium">
                            🚫 Cancelled
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        📅 {formatJalaliDate(session.session_date)}
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.stages.slice(0, 5).map((s, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isDark
                              ? "bg-indigo-900/40 text-indigo-300"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          ⚙️ {s}
                        </span>
                      ))}
                      {session.stages.length > 5 && (
                        <span className="text-[10px] text-slate-500">
                          +{session.stages.length - 5}
                        </span>
                      )}
                    </div>

                    {session.notes && (
                      <p
                        className={`text-[10px] mt-2 italic truncate ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        📝 {session.notes}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between gap-3 ${
            isDark ? "border-slate-700" : "border-slate-200"
          }`}
        >
          {canDelete ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteRequest(true)}
              title="Request deletion of the complete inspection package"
            >
              🗑️ Request Package Deletion
            </Button>
          ) : (
            <span />
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Create Session Modal (nested) */}
      {request && (
        <>
          <SessionCreateModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            request={request}
            existingStages={existingStages}
            existingMethods={existingMethods}
            existingSubVendors={sessions
              .map((s) => s.sub_vendor)
              .filter((v): v is string => !!v)}
            onSubmit={handleCreateSession}
          />
          <DeletionReasonModal
            isOpen={showDeleteRequest}
            onClose={() => setShowDeleteRequest(false)}
            title="Request Package Deletion"
            description="This request will be sent to the unit manager. The package and all inspection evidence remain available until the request is approved."
            confirmLabel="Send Request"
            minLength={10}
            isSubmitting={requestingDeletion}
            onConfirm={handleDeleteRequest}
          />
        </>
      )}
    </>
  );
}
