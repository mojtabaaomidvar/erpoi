// src/features/tpi-management/ui/TPIDetailsModal.tsx

import { useState, useEffect } from "react";
import { Modal, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { TPIElements } from "@shared/authorization/ui/elements/TPIElements";
import {
  tpiRequestAppService,
  type TPIRequestDetailsDTO,
} from "../application";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import type { TPIRequest } from "../domain/types";
import { DocumentReviewSection } from "@/features/inspection-management/ui/details/DocumentReviewSection";
import { InspectorAssignmentSection } from "@/features/inspection-management/ui/details/InspectorAssignmentSection";
import { ChecklistSection } from "@/features/inspection-management/ui/details/ChecklistSection";
import { SessionSelector } from "./components/SessionSelector";
import { NCRTab } from "./components/NCRTab";
import { SessionCreateModal } from "./components/SessionCreateModal";
import { SessionInfoCard } from "./components/SessionInfoCard";
import {
  ActiveSessionProvider,
  useActiveSession,
} from "@/features/inspection-management/context/ActiveSessionContext";
import { showToast } from "@/shared/ui/ToastContainer";
import { inspectionSessionAppService } from "@/features/inspection-management/application/InspectionSessionApplicationService";
import { equipmentAppService } from "../application/EquipmentApplicationService";
import { useAuth } from "@features/auth/hooks/useAuth";
import { DeletionReasonModal } from "./components/DeletionReasonModal";

interface TPIDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TPIRequest | null;
  onEdit: (request: TPIRequest) => void;
}

type TabType =
  | "overview"
  | "documents"
  | "inspector"
  | "checklist"
  | "ncr"
  | "reports"
  | "release_note";

export function TPIDetailsModal({
  isOpen,
  onClose,
  request,
  onEdit,
}: TPIDetailsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="TPI Request Details"
      size="7xl"
    >
      <div className="flex flex-col" style={{ height: "calc(95vh - 80px)" }}>
        <ActiveSessionProvider>
          <TPIDetailsContent request={request} onEdit={onEdit} />
        </ActiveSessionProvider>
      </div>
    </Modal>
  );
}

function TPIDetailsContent({
  request,
  onEdit,
}: {
  request: TPIRequest | null;
  onEdit: (r: TPIRequest) => void;
}) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { canAccessElement } = usePermissionMapping();

  const [details, setDetails] = useState<TPIRequestDetailsDTO | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showDeleteSession, setShowDeleteSession] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>(
    {},
  );
  const { activeSession, sessions, setSessions, setActiveSession, setLoading } =
    useActiveSession();

  const canEdit = canAccessElement(TPIElements.TPIDetails.btn_edit.id);
  const canDelete = canAccessElement(TPIElements.TPIDetails.btn_delete.id);
  const canExportFinding = canAccessElement(
    TPIElements.TPIDetails.ncr_export.id,
  );

  // 🗑️ Delete the ACTIVE session (optimistic: remove first, roll back on error)
  const handleDeleteActiveSession = async (reason: string) => {
    if (!activeSession) return;
    const sessionToDelete = activeSession;
    setIsDeletingSession(true);
    const remaining = sessions
      .filter((s) => s.id !== sessionToDelete.id)
      .sort((a, b) => a.session_number - b.session_number);
    setSessions(remaining);
    setActiveSession(remaining.length > 0 ? remaining[0] : null);

    try {
      await inspectionSessionAppService.deleteSession(sessionToDelete.id, {
        deleted_by: user?.id || "",
        reason,
      });
      setShowDeleteSession(false);
      showToast(
        "success",
        "Deleted",
        `Session #${sessionToDelete.session_number} deleted`,
      );
    } catch (err: any) {
      // Roll back silently-ish (toast) on failure
      setSessions(sessions);
      setActiveSession(sessionToDelete);
      showToast(
        "error",
        "Delete Failed",
        err.message || "Failed to delete session",
      );
    } finally {
      setIsDeletingSession(false);
    }
  };

  useEffect(() => {
    if (!request) return;

    let cancelled = false;
    const requestId = request.id;
    const disciplines = request.disciplines ?? [];

    setActiveTab("overview");
    setDetails(null);
    setLoadingDetails(true);
    setEquipmentNames({});
    setSessions([]);
    setActiveSession(null);
    setLoading(true);

    tpiRequestAppService
      .getTPIRequestDetails(requestId)
      .then((detailsData) => {
        if (!cancelled) setDetails(detailsData);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("Failed to fetch details:", error);
        showToast(
          "error",
          "Load Failed",
          error instanceof Error
            ? error.message
            : "Could not load request details",
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });

    if (disciplines.length > 0) {
      equipmentAppService
        .getGroupedEquipmentByDisciplines(disciplines)
        .then((groups) => {
          if (cancelled) return;
          const map: Record<string, string> = {};
          groups.forEach((group) =>
            group.categories.forEach((category) =>
              category.items.forEach((item) => {
                map[item.id] = item.name;
              }),
            ),
          );
          setEquipmentNames(map);
        })
        .catch(() => {
          if (!cancelled) setEquipmentNames({});
        });
    }

    inspectionSessionAppService
      .getSessionsByRequestId(requestId)
      .then((data) => {
        if (cancelled) return;
        setSessions(data);
        const preselectedId = sessionStorage.getItem(
          `preselected_session_${requestId}`,
        );
        const selectedSession = preselectedId
          ? (data.find((session) => session.id === preselectedId) ?? data[0])
          : data[0];
        setActiveSession(selectedSession ?? null);
        if (preselectedId) {
          sessionStorage.removeItem(`preselected_session_${requestId}`);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error("Failed to load sessions:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [request, setActiveSession, setLoading, setSessions]);

  useEffect(() => {
    setSelectedItems(new Set());
  }, [details]);

  if (!request) return null;

  const firstStage =
    Array.isArray(request.stages) && request.stages.length > 0
      ? request.stages[0]
      : "No Stage";

  const displayTitle = details
    ? `${details.clientName} - ${details.projectName} - ${details.vendorName || "No Vendor"} - ${firstStage}`
    : "Loading details...";

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "documents", label: "Documents", icon: "📄" },
    { id: "inspector", label: "Inspector", icon: "👷" },
    { id: "checklist", label: "Checklists", icon: "✅" },
    { id: "ncr", label: "NCR", icon: "⚠️" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "release_note", label: "Release Note", icon: "🏷️" },
  ];

  return (
    <>
      {/* Header Info */}
      <div
        className={`flex-shrink-0 px-6 py-4 border-b  ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
      >
        {/* Session Selector */}
        {!loadingDetails && request && (
          <div className="mb-4">
            <SessionSelector
              onCreateNew={() => {
                setTimeout(() => setShowCreateSession(true), 50);
              }}
            />
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          {loadingDetails ? (
            <div className="flex-1 space-y-3 animate-pulse">
              <div className="flex gap-2">
                <div
                  className={`h-5 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
                <div
                  className={`h-5 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </div>
              <div
                className={`h-6 w-3/4 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
              />
              <div
                className={`h-4 w-1/2 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <h2
                className={`text-lg font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                title={displayTitle}
              >
                {displayTitle}
              </h2>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {activeSession
                  ? `📅 Session #${activeSession.session_number} — ${formatJalaliDate(activeSession.session_date)}`
                  : sessions.length === 0
                    ? "⚠️ No sessions — create one to start inspection"
                    : `📅 Planned: ${formatJalaliDate(request.inspection_date)}`}
              </p>
            </div>
          )}

          <div className="flex gap-2 shrink-0">
            {canEdit && !loadingDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(request)}
              >
                ✏️ Edit
              </Button>
            )}
            {canDelete && !loadingDetails && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteSession(true)}
                disabled={!activeSession}
                title={
                  activeSession
                    ? `Delete Session #${activeSession.session_number}`
                    : "No session to delete"
                }
              >
                🗑️ Delete Session
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-500 text-white shadow-md"
                  : isDark
                    ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loadingDetails ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-3xl animate-spin mb-3">⏳</div>
            <p className="text-sm text-slate-500">Loading request details...</p>
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="space-y-4">
                <SessionInfoCard
                  session={activeSession}
                  equipmentNames={equipmentNames}
                  serviceDomain={request.disciplines}
                  tpiMode={request.tpi_mode}
                  vendorName={details?.vendorName}
                />

                {details?.items && details.items.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className={`text-sm font-bold flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        📦 Inspection Items ({details.items.length})
                      </h3>
                      {selectedItems.size > 0 && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}
                        >
                          {selectedItems.size} selected
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr
                            className={`border-b ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-600"}`}
                          >
                            <th className="text-left py-2 px-2 font-semibold">
                              #
                            </th>
                            <th className="text-left py-2 px-2 font-semibold">
                              Item Name & Description
                            </th>
                            <th className="text-left py-2 px-2 font-semibold">
                              Tag No.
                            </th>
                            <th className="text-left py-2 px-2 font-semibold">
                              Manufacturer
                            </th>
                            <th className="text-center py-2 px-2 font-semibold">
                              Qty
                            </th>
                            <th className="text-center py-2 px-2 font-semibold">
                              Unit
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.items.map((item, index) => {
                            const isSelected = selectedItems.has(item.id);
                            return (
                              <tr
                                key={item.id}
                                className={`border-b last:border-0 transition-colors ${
                                  isSelected
                                    ? isDark
                                      ? "bg-indigo-900/20 border-slate-700/50"
                                      : "bg-indigo-50/50 border-slate-100"
                                    : isDark
                                      ? "border-slate-700/50 hover:bg-slate-700/30"
                                      : "border-slate-100 hover:bg-slate-50"
                                }`}
                              >
                                <td className="py-3 px-2 text-slate-500">
                                  {index + 1}
                                </td>
                                <td className="py-3 px-2">
                                  <div
                                    className={`font-medium mb-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                                  >
                                    {item.item_name}
                                  </div>
                                  {item.description && (
                                    <div
                                      className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      {item.description}
                                    </div>
                                  )}
                                </td>
                                <td
                                  className={`py-3 px-2 font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                >
                                  {item.tag_number || "—"}
                                </td>
                                <td className="py-3 px-2">
                                  {item.manufacturer || "—"}
                                </td>
                                <td className="py-3 px-2 text-center font-semibold">
                                  {item.quantity}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                                  >
                                    {item.unit}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {details?.sourceFiles && details.sourceFiles.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <h3
                      className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      📎 Packing List, MTO, ...
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {details.sourceFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className={`group flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                            isDark
                              ? "bg-slate-700/50 border-slate-600 hover:border-indigo-500"
                              : "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${isDark ? "bg-slate-600" : "bg-white border border-slate-200"}`}
                          >
                            {file.file_type === "PACKING_LIST"
                              ? "📦"
                              : file.file_type === "MTO"
                                ? "📋"
                                : "📄"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                            >
                              {file.file_name}
                            </p>
                            <p
                              className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              {file.file_type.replace("_", " ")} •{" "}
                              {((file.file_size || 0) / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            ⬇️
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {(!details?.items || details.items.length === 0) &&
                  (!details?.sourceFiles ||
                    details.sourceFiles.length === 0) && (
                    <div
                      className={`p-8 rounded-xl border text-center ${isDark ? "bg-slate-800/30 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                    >
                      <div className="text-3xl mb-2">📭</div>
                      <p
                        className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        No items or source files attached
                      </p>
                    </div>
                  )}

                {request.notes && (
                  <div
                    className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <h3
                      className={`text-sm font-bold mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      📝 Notes
                    </h3>
                    <p
                      className={`text-sm whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {request.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-4">
                <DocumentReviewSection
                  requestId={request.id}
                  category={request.category}
                  sessionId={activeSession?.id}
                />
              </div>
            )}

            {activeTab === "inspector" && (
              <InspectorAssignmentSection
                requestId={request.id}
                serviceDomain={request.disciplines}
                plannedDate={request.inspection_date}
                mode={request.tpi_mode || "SPOT"}
                category="TPI"
                session={activeSession}
              />
            )}

            {activeTab === "checklist" && request && (
              <ChecklistSection
                requestId={request.id}
                sessionId={activeSession?.id}
                equipmentId={
                  activeSession?.equipment_ids &&
                  activeSession.equipment_ids.length > 0
                    ? activeSession.equipment_ids
                    : (request as any).equipment_type_id &&
                        (request as any).equipment_type_id.length > 0
                      ? (request as any).equipment_type_id
                      : ["GENERIC_ITEM"]
                }
                stages={
                  activeSession ? activeSession.stages : request.stages || []
                }
                methods={
                  activeSession ? activeSession.methods : request.methods || []
                }
              />
            )}

            {activeTab === "ncr" && details && (
              <NCRTab
                request={request}
                details={details}
                sessions={sessions}
                activeSessionId={activeSession?.id}
                equipmentNames={equipmentNames}
                canExport={canExportFinding}
              />
            )}

            {(activeTab === "reports" || activeTab === "release_note") && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-4xl mb-3">🚧</div>
                <p
                  className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Module Under Development
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session Create Modal */}
      <SessionCreateModal
        isOpen={showCreateSession}
        onClose={() => setShowCreateSession(false)}
        request={request}
        existingStages={sessions.flatMap((s) => s.stages)}
        existingMethods={sessions.flatMap((s) => s.methods)}
        existingSubVendors={sessions
          .map((s) => s.sub_vendor)
          .filter((v): v is string => !!v)}
        onSubmit={async (data) => {
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
          setSessions([...sessions, created]);
          setActiveSession(created);
        }}
      />
      <DeletionReasonModal
        isOpen={showDeleteSession}
        onClose={() => setShowDeleteSession(false)}
        title="Delete Inspection Session"
        description={
          activeSession
            ? `Session #${activeSession.session_number} will be hidden from operational views. Its checklists, documents, assignments and audit history will be preserved.`
            : "The selected inspection session will be soft-deleted."
        }
        confirmLabel="Delete Session"
        minLength={5}
        isSubmitting={isDeletingSession}
        onConfirm={handleDeleteActiveSession}
      />
    </>
  );
}
