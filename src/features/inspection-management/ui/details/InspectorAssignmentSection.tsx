// src/features/inspection-management/ui/details/InspectorAssignmentSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { inspectionAppService } from "../../application";
import { inspectorAppService } from "@/features/inspector-managment/application";
import type {
  Inspection,
  CancellationReason,
  EnrichedInspector,
} from "@/features/inspection-management/domain/types";
import type { Inspector } from "@/features/inspector-managment/domain/models/Inspector";
import {
  INSPECTION_EXECUTION_STATUS_CONFIG,
  TPI_CANCELLATION_REASON_CONFIG,
} from "../../constants";
import { TPI_DISCIPLINE_OPTIONS } from "@/features/tpi-management";
import { getTodayJalali } from "@/shared/utils/dateUtils";
import { jalaaliToGregorianDate } from "@/entities/contract/services/contractCalculations";
import { formatArrayField } from "@/shared/utils/formatUtils";

interface InspectorAssignmentSectionProps {
  requestId: string;
  serviceDomain: string | string[];
  plannedDate?: string;
  mode?: "SPOT" | "RESIDENT";
}

type InspectionProjectDetails = {
  inspection: Inspection;
  request: any;
  project: any;
  vendor: any;
  inspector: any;
};

export function InspectorAssignmentSection({
  requestId,
  serviceDomain,
  plannedDate,
  mode = "SPOT",
}: InspectorAssignmentSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const todayString = getTodayJalali();
  const initialDate = plannedDate ? plannedDate.replace(/-/g, "/") : "";

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [availableInspectors, setAvailableInspectors] = useState<
    EnrichedInspector[]
  >([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [processingConflictId, setProcessingConflictId] = useState<
    string | null
  >(null);
  const [inspectionToCancel, setInspectionToCancel] =
    useState<Inspection | null>(null);
  const [relatedInspectionDetails, setRelatedInspectionDetails] =
    useState<InspectionProjectDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [assignForm, setAssignForm] = useState({
    inspector_id: "",
    execution_date: initialDate,
    location: "",
    vendor_site: "",
  });

  const [cancelForm, setCancelForm] = useState({
    reason: "OTHER" as CancellationReason,
    related_inspection_id: "",
    new_scheduled_date: "",
    date_is_unknown: false,
    new_scopes: [] as string[],
    cancellation_notes: "",
  });

  const toggleScope = (scope: string) => {
    setCancelForm((prev) => {
      const exists = prev.new_scopes.includes(scope);
      return {
        ...prev,
        new_scopes: exists
          ? prev.new_scopes.filter((s) => s !== scope)
          : [...prev.new_scopes, scope],
      };
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [inspData, inspList] = await Promise.all([
        inspectionAppService.getByInspectionRequest(requestId),
        inspectorAppService.getAll(),
      ]);
      setInspections(inspData);
      setInspectors(inspList);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSuitableInspectors = async () => {
    if (!assignForm.execution_date) {
      return;
    }

    const dbDate = assignForm.execution_date.replace(/\//g, "-");

    const parseToRealArray = (data: any): string[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (typeof data === "string") {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) return parsed.map((s: string) => s.trim());
        } catch {
          return data
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
      return [];
    };

    const requiredDisciplines: string[] = parseToRealArray(serviceDomain);

    try {
      const suitable = await inspectionAppService.getSuitableInspectors(
        requiredDisciplines,
        dbDate,
      );
      setAvailableInspectors(suitable);
    } catch (err: any) {
      showToast("error", "Failed to load inspectors", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  useEffect(() => {
    if (showAssignModal && assignForm.execution_date) {
      loadSuitableInspectors();
    }
  }, [showAssignModal, assignForm.execution_date]);

  const handleOpenCancelModal = (inspection: Inspection) => {
    setInspectionToCancel(inspection);
    setCancelForm({
      reason: "OTHER",
      related_inspection_id: "",
      new_scheduled_date: "",
      date_is_unknown: false,
      new_scopes: [],
      cancellation_notes: "",
    });
    setShowCancelModal(true);
  };

  const validateDate = (
    selectedDate: string,
    plannedDate?: string,
  ): { valid: boolean; error?: string } => {
    if (!selectedDate) return { valid: false, error: "Date is required" };

    const selected = jalaaliToGregorianDate(selectedDate);
    if (!selected) return { valid: false, error: "Invalid date format" };

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    if (selected < todayDate) {
      return { valid: false, error: "Date cannot be in the past" };
    }

    if (plannedDate) {
      const planned = jalaaliToGregorianDate(plannedDate);
      if (planned && selected.getTime() === planned.getTime()) {
        return {
          valid: false,
          error: "Date must be different from the original planned date",
        };
      }
    }

    return { valid: true };
  };

  const handleConfirmCancel = async () => {
    if (!inspectionToCancel) return;

    if (
      cancelForm.reason === "REASSIGNED" &&
      !cancelForm.related_inspection_id
    ) {
      return showToast(
        "error",
        "Error",
        "Please select the related inspection",
      );
    }

    if (cancelForm.reason === "CLIENT_REQUEST") {
      if (!cancelForm.date_is_unknown) {
        const validation = validateDate(
          cancelForm.new_scheduled_date,
          plannedDate,
        );
        if (!validation.valid) {
          return showToast("error", "Invalid Date", validation.error!);
        }
      }
    }

    if (cancelForm.reason === "VENDOR_UNAVAILABLE") {
      const validation = validateDate(
        cancelForm.new_scheduled_date,
        plannedDate,
      );
      if (!validation.valid) {
        return showToast("error", "Invalid Date", validation.error!);
      }
    }

    if (
      cancelForm.reason === "SCOPE_CHANGED" &&
      cancelForm.new_scopes.length === 0
    ) {
      return showToast(
        "error",
        "Error",
        "Please select at least one new scope",
      );
    }

    if (
      cancelForm.reason === "OTHER" &&
      !cancelForm.cancellation_notes.trim()
    ) {
      return showToast("error", "Error", "Please provide details in notes");
    }

    const previousInspections = [...inspections];

    setInspections((prev) =>
      prev.map((i) =>
        i.id === inspectionToCancel.id
          ? {
              ...i,
              status: "CANCELLED" as const,
              cancelled_at: new Date().toISOString(),
              cancelled_by: user?.id || "",
              cancellation_reason: cancelForm.reason,
              related_inspection_id:
                cancelForm.related_inspection_id || undefined,
              new_scheduled_date: cancelForm.new_scheduled_date || undefined,
              date_is_unknown: cancelForm.date_is_unknown,
              new_scopes:
                cancelForm.new_scopes.length > 0
                  ? cancelForm.new_scopes
                  : undefined,
              cancellation_notes: cancelForm.cancellation_notes || undefined,
            }
          : i,
      ),
    );

    showToast("success", "Processing", "Cancelling inspection...");
    setShowCancelModal(false);

    try {
      await inspectionAppService.cancelInspection(
        inspectionToCancel.id,
        user?.id || "",
        cancelForm.reason,
        cancelForm.related_inspection_id || undefined,
        cancelForm.new_scheduled_date || undefined,
        cancelForm.date_is_unknown,
        cancelForm.new_scopes.length > 0 ? cancelForm.new_scopes : undefined,
        cancelForm.cancellation_notes || undefined,
      );
      showToast("success", "Cancelled", "Inspection cancelled successfully");
      await loadData();
    } catch (err: any) {
      setInspections(previousInspections);
      showToast("error", "Cancel Failed", err.message);
    }
  };

  const handleViewRelatedInspection = async (relatedInspectionId: string) => {
    setLoadingDetails(true);
    setShowDetailsModal(true);
    try {
      const details =
        await inspectionAppService.getInspectionWithDetails(
          relatedInspectionId,
        );
      setRelatedInspectionDetails(details);
    } catch (err: any) {
      showToast("error", "Failed to load details", err.message);
      setShowDetailsModal(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleAssignWithConflictResolution = async (
    targetInspector: EnrichedInspector,
    removeConflicts: boolean,
  ) => {
    if (!assignForm.execution_date) {
      return showToast("error", "Error", "Execution date is required");
    }

    setAssigning(true);
    const dbDate = assignForm.execution_date.replace(/\//g, "-");
    const newInspectionId = `temp_${crypto.randomUUID()}`;
    const previousInspections = [...inspections];

    const newInspection: Inspection = {
      id: newInspectionId,
      inspection_request_id: requestId,
      inspector_id: targetInspector.inspector.id,
      assigned_by: user?.id || "",
      assigned_at: new Date().toISOString(),
      execution_date: dbDate,
      location: assignForm.location,
      vendor_site: assignForm.vendor_site,
      status: "SCHEDULED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedList = [...inspections, newInspection];
    if (removeConflicts) {
      const conflictIds = targetInspector.conflictingInspections.map(
        (c) => c.id,
      );
      updatedList = updatedList.filter((i) => !conflictIds.includes(i.id));
    }

    setInspections(updatedList);
    showToast("success", "Processing", "Assigning inspector...");

    try {
      const created = await inspectionAppService.create({
        inspection_request_id: requestId,
        inspector_id: targetInspector.inspector.id,
        assigned_by: user?.id || "",
        execution_date: dbDate,
        location: assignForm.location,
        vendor_site: assignForm.vendor_site,
      });

      if (removeConflicts) {
        for (const conflict of targetInspector.conflictingInspections) {
          await inspectionAppService.cancelInspection(
            conflict.id,
            user?.id || "",
            "REASSIGNED",
            created.id,
          );
        }
      }

      showToast("success", "Success", "Inspector assigned successfully");
      setShowAssignModal(false);
      setAssignForm({
        inspector_id: "",
        execution_date: initialDate,
        location: "",
        vendor_site: "",
      });
      await loadData();
    } catch (err: any) {
      setInspections(previousInspections);
      showToast("error", "Assignment Failed", err.message);
    } finally {
      setAssigning(false);
      setProcessingConflictId(null);
    }
  };

  const assignedInspectorIds = new Set(
    inspections
      .filter((i) => i.status !== "CANCELLED")
      .map((i) => i.inspector_id),
  );
  const matchingInspectors = availableInspectors.filter((item) => item.isMatch);
  const suitableAndUnassigned = matchingInspectors.filter(
    (item) => !assignedInspectorIds.has(item.inspector.id),
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          Assigned Inspectors
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAssignModal(true)}
        >
          👷 Assign Inspector
        </Button>
      </div>

      {/* Inspections List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Loading...
          </p>
        </div>
      ) : inspections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">👷</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No inspector assigned yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection) => {
            const statusConfig =
              INSPECTION_EXECUTION_STATUS_CONFIG[inspection.status];
            const isCancelled = inspection.status === "CANCELLED";
            const reasonConfig = inspection.cancellation_reason
              ? TPI_CANCELLATION_REASON_CONFIG[inspection.cancellation_reason]
              : null;

            return (
              <div
                key={inspection.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCancelled
                    ? isDark
                      ? "bg-rose-900/10 border-rose-800/50 opacity-75"
                      : "bg-rose-50 border-rose-200 opacity-75"
                    : isDark
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4
                        className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        👷{" "}
                        {inspectors.find(
                          (i) => i.id === inspection.inspector_id,
                        )?.name_en || "Unknown Inspector"}
                      </h4>
                      <Badge
                        tone={statusConfig.color as any}
                        className="text-[9px]"
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {inspection.execution_date && (
                        <span>
                          📅 {inspection.execution_date.replace(/-/g, "/")}
                        </span>
                      )}
                      {inspection.location && (
                        <span>📍 {inspection.location}</span>
                      )}
                    </div>

                    {isCancelled && reasonConfig && (
                      <div
                        className={`mt-3 p-2.5 rounded-lg text-[11px] ${isDark ? "bg-rose-900/20 border border-rose-800/30" : "bg-white border border-rose-200"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{reasonConfig.icon}</span>
                          <span
                            className={`font-semibold ${isDark ? "text-rose-300" : "text-rose-700"}`}
                          >
                            Cancelled: {reasonConfig.label}
                          </span>
                        </div>
                        {inspection.cancelled_at && (
                          <div
                            className={`text-[10px] mb-2 ${isDark ? "text-rose-400" : "text-rose-600"}`}
                          >
                            🕐{" "}
                            {new Date(
                              inspection.cancelled_at,
                            ).toLocaleDateString("fa-IR-u-nu-latn")}
                          </div>
                        )}

                        {inspection.cancellation_reason === "REASSIGNED" &&
                          inspection.related_inspection_id && (
                            <button
                              onClick={() =>
                                handleViewRelatedInspection(
                                  inspection.related_inspection_id!,
                                )
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${isDark ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                            >
                              🔗 View reassigned inspection
                            </button>
                          )}

                        {inspection.cancellation_reason ===
                          "CLIENT_REQUEST" && (
                          <div
                            className={`text-[10px] ${isDark ? "text-blue-300" : "text-blue-700"}`}
                          >
                            {inspection.date_is_unknown
                              ? "📅 New date: To be determined"
                              : inspection.new_scheduled_date &&
                                `📅 New date: ${inspection.new_scheduled_date}`}
                          </div>
                        )}

                        {inspection.cancellation_reason ===
                          "VENDOR_UNAVAILABLE" &&
                          inspection.new_scheduled_date && (
                            <div
                              className={`text-[10px] ${isDark ? "text-amber-300" : "text-amber-700"}`}
                            >
                              🏭 Expected availability:{" "}
                              {inspection.new_scheduled_date}
                            </div>
                          )}

                        {inspection.cancellation_reason === "SCOPE_CHANGED" &&
                          inspection.new_scopes &&
                          inspection.new_scopes.length > 0 && (
                            <div
                              className={`text-[10px] ${isDark ? "text-purple-300" : "text-purple-700"}`}
                            >
                              📝 New scopes: {inspection.new_scopes.join(", ")}
                            </div>
                          )}

                        {inspection.cancellation_reason === "OTHER" &&
                          inspection.cancellation_notes && (
                            <div
                              className={`text-[10px] ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              📝{" "}
                              {inspection.cancellation_notes.substring(0, 100)}
                              {inspection.cancellation_notes.length > 100
                                ? "..."
                                : ""}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {inspection.status === "SCHEDULED" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenCancelModal(inspection)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && inspectionToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
          >
            <div
              className={`px-6 py-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Cancel Inspection
              </h3>
              <p
                className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Please specify the reason for cancellation
              </p>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Cancellation Reason *
                </label>
                <select
                  value={cancelForm.reason}
                  onChange={(e) =>
                    setCancelForm({
                      ...cancelForm,
                      reason: e.target.value as CancellationReason,
                    })
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                >
                  {/* ✅ رفع خطای unknown با تایپ‌دهی صحیح */}
                  {Object.entries(TPI_CANCELLATION_REASON_CONFIG).map(
                    ([key, config]: [string, any]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ),
                  )}
                </select>
                <p
                  className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {
                    TPI_CANCELLATION_REASON_CONFIG[cancelForm.reason]
                      .description
                  }
                </p>
              </div>

              {cancelForm.reason === "REASSIGNED" && (
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Related Inspection *
                  </label>
                  <select
                    value={cancelForm.related_inspection_id}
                    onChange={(e) =>
                      setCancelForm({
                        ...cancelForm,
                        related_inspection_id: e.target.value,
                      })
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                  >
                    <option value="">-- Select Inspection --</option>
                    {inspections
                      .filter(
                        (i) =>
                          i.id !== inspectionToCancel.id &&
                          i.status !== "CANCELLED",
                      )
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.inspector_id} -{" "}
                          {i.execution_date?.replace(/-/g, "/")}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {cancelForm.reason === "CLIENT_REQUEST" && (
                <div className="space-y-3">
                  <div>
                    <label
                      className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      New Scheduled Date
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="date-unknown"
                        checked={cancelForm.date_is_unknown}
                        onChange={(e) =>
                          setCancelForm({
                            ...cancelForm,
                            date_is_unknown: e.target.checked,
                            new_scheduled_date: e.target.checked
                              ? ""
                              : cancelForm.new_scheduled_date,
                          })
                        }
                        className="w-4 h-4 rounded cursor-pointer accent-blue-600"
                      />
                      <label
                        htmlFor="date-unknown"
                        className={`text-xs cursor-pointer ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        New date is not yet determined
                      </label>
                    </div>
                    {!cancelForm.date_is_unknown && (
                      <JalaaliDatePicker
                        value={cancelForm.new_scheduled_date}
                        onChange={(date) =>
                          setCancelForm({
                            ...cancelForm,
                            new_scheduled_date: date,
                          })
                        }
                        placeholder="Select new date"
                        minDate={todayString}
                      />
                    )}
                  </div>
                </div>
              )}

              {cancelForm.reason === "VENDOR_UNAVAILABLE" && (
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    When will vendor be available? *
                  </label>
                  <JalaaliDatePicker
                    value={cancelForm.new_scheduled_date}
                    onChange={(date) =>
                      setCancelForm({ ...cancelForm, new_scheduled_date: date })
                    }
                    placeholder="Select expected availability date"
                    minDate={todayString}
                  />
                  <p
                    className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    You can update this date later if needed
                  </p>
                </div>
              )}

              {cancelForm.reason === "SCOPE_CHANGED" && (
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    New Inspection Scopes * (Select one or more)
                  </label>
                  <div
                    className={`grid grid-cols-2 gap-2 p-3 rounded-lg border max-h-48 overflow-y-auto ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
                  >
                    {/* ✅ رفع خطای any با تایپ‌دهی صحیح scope */}
                    {TPI_DISCIPLINE_OPTIONS.map((scope: string) => {
                      const isSelected = cancelForm.new_scopes.includes(scope);
                      const currentScopes = Array.isArray(serviceDomain)
                        ? serviceDomain
                        : serviceDomain.split(",").map((s) => s.trim());
                      const isCurrent = currentScopes.includes(scope);

                      return (
                        <label
                          key={scope}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${isSelected ? (isDark ? "bg-purple-900/30 border border-purple-700" : "bg-purple-50 border border-purple-300") : isDark ? "hover:bg-slate-700 border border-transparent" : "hover:bg-white border border-transparent shadow-sm"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleScope(scope)}
                            className="w-4 h-4 rounded cursor-pointer accent-purple-600 shrink-0"
                          />
                          <span
                            className={`text-xs ${isSelected ? (isDark ? "text-purple-200 font-medium" : "text-purple-900 font-medium") : isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {scope}
                            {isCurrent && (
                              <span className="text-[10px] opacity-70 ml-1">
                                (Current)
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div
                    className={`mt-2 p-2 rounded-lg text-[11px] ${isDark ? "bg-purple-900/20 text-purple-300 border border-purple-800/30" : "bg-purple-50 text-purple-700 border border-purple-200"}`}
                  >
                    ⚠️ This change will be applied to the entire inspection
                    request.
                  </div>
                </div>
              )}

              {cancelForm.reason === "OTHER" && (
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Notes *
                  </label>
                  <textarea
                    value={cancelForm.cancellation_notes}
                    onChange={(e) =>
                      setCancelForm({
                        ...cancelForm,
                        cancellation_notes: e.target.value,
                      })
                    }
                    rows={4}
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed resize-none`}
                    placeholder="Please provide details about the cancellation..."
                  />
                </div>
              )}
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end gap-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
                Back
              </Button>
              <Button variant="danger" onClick={handleConfirmCancel}>
                Confirm Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Related Inspection Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
          >
            <div
              className={`px-6 py-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                🔗 Reassigned Inspection Details
              </h3>
            </div>
            <div className="p-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2 animate-pulse">⏳</div>
                  <p
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Loading details...
                  </p>
                </div>
              ) : relatedInspectionDetails ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}
                  >
                    <div
                      className={`text-[10px] font-semibold uppercase mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      📁 Project
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Name:
                        </span>
                        <span
                          className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          {relatedInspectionDetails.project?.name || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Client:
                        </span>
                        <span
                          className={`text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          {relatedInspectionDetails.project?.client?.name_en ||
                            "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Domain:
                        </span>
                        <Badge tone="indigo" className="text-[10px]">
                          {Array.isArray(
                            relatedInspectionDetails.request?.disciplines,
                          )
                            ? relatedInspectionDetails.request.disciplines.join(
                                ", ",
                              )
                            : relatedInspectionDetails.request
                                ?.service_domain || "—"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-lg ${isDark ? "bg-indigo-900/10 border border-indigo-800/30" : "bg-indigo-50 border border-indigo-200"}`}
                  >
                    <div
                      className={`text-[10px] font-semibold uppercase mb-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                    >
                      🔍 Inspection Details
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          📅 Date:
                        </span>
                        <span
                          className={`text-xs font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          {relatedInspectionDetails.inspection?.execution_date?.replace(
                            /-/g,
                            "/",
                          ) || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          📍 Location:
                        </span>
                        <span
                          className={`text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          {relatedInspectionDetails.inspection?.location || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          🏭 Vendor/Site:
                        </span>
                        <span
                          className={`text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          {relatedInspectionDetails.vendor?.name ||
                            relatedInspectionDetails.inspection?.vendor_site ||
                            "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          👷 Inspector:
                        </span>
                        <span
                          className={`text-xs ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          {relatedInspectionDetails.inspector?.name_en || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Status:
                        </span>
                        <Badge
                          tone={
                            INSPECTION_EXECUTION_STATUS_CONFIG[
                              relatedInspectionDetails.inspection?.status
                            ]?.color as any
                          }
                          className="text-[10px]"
                        >
                          {
                            INSPECTION_EXECUTION_STATUS_CONFIG[
                              relatedInspectionDetails.inspection?.status
                            ]?.icon
                          }{" "}
                          {
                            INSPECTION_EXECUTION_STATUS_CONFIG[
                              relatedInspectionDetails.inspection?.status
                            ]?.label
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Failed to load inspection details
                </div>
              )}
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDetailsModal(false);
                  setRelatedInspectionDetails(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white"}`}
            style={{ maxHeight: "90vh" }}
          >
            <div
              className={`px-6 py-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <span
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                👷Assign Inspector for {formatArrayField(serviceDomain)}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Execution Date *
                </label>
                <JalaaliDatePicker
                  value={assignForm.execution_date}
                  onChange={(date) =>
                    setAssignForm({ ...assignForm, execution_date: date })
                  }
                  placeholder="Select date (Future dates only)"
                  minDate={plannedDate}
                />
              </div>

              {!assignForm.execution_date ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Please select a date to see available inspectors.
                </div>
              ) : availableInspectors.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No inspectors found for{" "}
                  <strong>{formatArrayField(serviceDomain)}</strong>. Check
                  browser console for details.
                </div>
              ) : suitableAndUnassigned.length === 0 ? (
                <div className="text-center py-8 text-amber-600 text-sm">
                  All matching inspectors are already assigned to this request
                  or busy on this date.
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg text-xs ${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                  >
                    <strong>{suitableAndUnassigned.length}</strong> inspector
                    are available as below:
                  </div>

                  {suitableAndUnassigned.map((item) => {
                    const insp = item.inspector;
                    return (
                      <div
                        key={insp.id}
                        className={`p-4 rounded-xl border ${item.isAvailable ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                              >
                                {insp.name_en}
                              </h4>
                              {item.isAvailable ? (
                                <Badge tone="emerald" className="text-[9px]">
                                  ✅ Available
                                </Badge>
                              ) : (
                                <Badge tone="amber" className="text-[9px]">
                                  ⚠️ Busy ({item.conflictingInspections.length})
                                </Badge>
                              )}
                            </div>
                            <p
                              className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                            >
                              Specialties:{" "}
                              {insp.specialties?.join(", ") || "All"}
                            </p>
                            {!item.isAvailable && (
                              <div
                                className={`mt-2 p-2 rounded-lg text-[11px] ${isDark ? "bg-slate-800" : "bg-white"}`}
                              >
                                <p className="font-semibold mb-1 text-amber-700 dark:text-amber-400">
                                  Conflicts:
                                </p>
                                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400">
                                  {item.conflictingInspections.map((c) => (
                                    <li key={c.id}>
                                      Req:{" "}
                                      {c.inspection_request_id.substring(0, 8)}
                                      ...
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={assigning}
                              onClick={() =>
                                handleAssignWithConflictResolution(
                                  item,
                                  item.isAvailable,
                                )
                              }
                            >
                              {item.isAvailable ? "Assign" : "Assign Anyway"}
                            </Button>
                            {!item.isAvailable && (
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={
                                  assigning || processingConflictId === insp.id
                                }
                                onClick={() => {
                                  setProcessingConflictId(insp.id);
                                  handleAssignWithConflictResolution(
                                    item,
                                    true,
                                  );
                                }}
                              >
                                {processingConflictId === insp.id
                                  ? "⏳..."
                                  : "Assign & Remove Conflicts"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
