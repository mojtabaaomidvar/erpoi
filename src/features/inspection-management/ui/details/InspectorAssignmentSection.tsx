// src/features/inspection-management/ui/details/InspectorAssignmentSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { inspectionAppService } from "../../application";
import { inspectorAppService } from "@/features/inspector-managment/application";
import type { Inspection } from "@/features/inspection-management/domain/types";
import type { Inspector } from "@/features/inspector-managment/domain/models/Inspector";
import { INSPECTION_EXECUTION_STATUS_CONFIG } from "../../constants";

interface InspectorAssignmentSectionProps {
  requestId: string;
}

export function InspectorAssignmentSection({
  requestId,
}: InspectorAssignmentSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [assignForm, setAssignForm] = useState({
    inspector_id: "",
    execution_date: "",
    location: "",
    vendor_site: "",
  });

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

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handleAssign = async () => {
    if (!assignForm.inspector_id) {
      showToast("error", "Error", "Please select an inspector");
      return;
    }

    setAssigning(true);
    try {
      await inspectionAppService.create({
        inspection_request_id: requestId,
        inspector_id: assignForm.inspector_id,
        assigned_by: user?.id || "",
        execution_date: assignForm.execution_date,
        location: assignForm.location,
        vendor_site: assignForm.vendor_site,
      });
      showToast("success", "Assigned", "Inspector assigned successfully");
      setShowAssignModal(false);
      setAssignForm({
        inspector_id: "",
        execution_date: "",
        location: "",
        vendor_site: "",
      });
      await loadData();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleStartInspection = async (inspection: Inspection) => {
    const confirmed = await confirmDialog({
      title: "Start Inspection",
      message: `Start inspection assigned to ${inspectors.find((i) => i.id === inspection.inspector_id)?.name_en}?`,
      confirmText: "Start",
      cancelText: "Cancel",
      variant: "info",
    });
    if (!confirmed) return;

    try {
      await inspectionAppService.startInspection(inspection.id);
      showToast("success", "Started", "Inspection started");
      await loadData();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const handleCompleteInspection = async (inspection: Inspection) => {
    const remarks = prompt("Enter general remarks (optional):");
    try {
      await inspectionAppService.completeInspection(
        inspection.id,
        remarks || undefined,
      );
      showToast("success", "Completed", "Inspection completed");
      await loadData();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const handleCancel = async (inspection: Inspection) => {
    const confirmed = await confirmDialog({
      title: "Cancel Inspection",
      message: "Are you sure you want to cancel this inspection?",
      confirmText: "Cancel",
      cancelText: "Back",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await inspectionAppService.cancelInspection(inspection.id);
      showToast("success", "Cancelled", "Inspection cancelled");
      await loadData();
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Inspections ({inspections.length})
          </div>
          <Badge tone="indigo" className="text-[10px]">
            📅 {inspections.filter((i) => i.status === "SCHEDULED").length}{" "}
            Scheduled
          </Badge>
          <Badge tone="indigo" className="text-[10px]">
            🔵 {inspections.filter((i) => i.status === "IN_PROGRESS").length} In
            Progress
          </Badge>
        </div>
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
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Assign an inspector to begin the inspection process
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection) => {
            const inspector = inspectors.find(
              (i) => i.id === inspection.inspector_id,
            );
            const statusConfig =
              INSPECTION_EXECUTION_STATUS_CONFIG[inspection.status];

            return (
              <div
                key={inspection.id}
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                        isDark ? "bg-indigo-900/30" : "bg-indigo-100"
                      }`}
                    >
                      👷
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {inspector?.name_en || "Unknown Inspector"}
                      </h4>
                      <div
                        className={`flex items-center gap-2 text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <span>📧 {inspector?.email || "—"}</span>
                        <span>📞 {inspector?.phone || "—"}</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 text-[11px] mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <Badge
                          tone={statusConfig.color as any}
                          className="text-[9px]"
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                        {inspection.execution_date && (
                          <span>
                            📅{" "}
                            {new Date(
                              inspection.execution_date,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {(inspection.location || inspection.vendor_site) && (
                  <div
                    className={`p-2 rounded-lg text-[11px] mb-3 ${
                      isDark
                        ? "bg-slate-900/50 text-slate-300"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{inspection.location}</span>
                      {inspection.vendor_site && (
                        <span className="text-slate-400">
                          ({inspection.vendor_site})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {inspection.general_remarks && (
                  <div
                    className={`p-2 rounded-lg text-[11px] mb-3 ${
                      isDark
                        ? "bg-indigo-900/20 text-indigo-300"
                        : "bg-indigo-50 text-indigo-700"
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      <span></span>
                      <span>{inspection.general_remarks}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {inspection.status === "SCHEDULED" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleStartInspection(inspection)}
                      >
                        ▶️ Start
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancel(inspection)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {inspection.status === "IN_PROGRESS" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCompleteInspection(inspection)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      ✓ Complete
                    </Button>
                  )}
                  {inspection.status === "COMPLETED" && (
                    <Badge tone="emerald" className="text-[10px]">
                      ✓ Completed{" "}
                      {inspection.actual_end_time &&
                        `on ${new Date(inspection.actual_end_time).toLocaleDateString()}`}
                    </Badge>
                  )}
                  {inspection.status === "CANCELLED" && (
                    <Badge tone="slate" className="text-[10px]">
                      ⊘ Cancelled
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-lg rounded-2xl shadow-2xl ${
              isDark ? "bg-slate-900 border border-slate-700" : "bg-white"
            }`}
          >
            <div
              className={`px-6 py-4 border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <h3
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                👷 Assign Inspector
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Select Inspector *
                </label>
                <select
                  value={assignForm.inspector_id}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      inspector_id: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                >
                  <option value="">-- Select Inspector --</option>
                  {inspectors.map((insp) => (
                    <option key={insp.id} value={insp.id}>
                      {insp.name_en} ({insp.inspector_type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Execution Date
                </label>
                <JalaaliDatePicker
                  value={assignForm.execution_date}
                  onChange={(date) =>
                    setAssignForm({ ...assignForm, execution_date: date })
                  }
                  placeholder="Select date"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    value={assignForm.location}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, location: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                    placeholder="e.g., Tehran"
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Vendor / Site
                  </label>
                  <input
                    type="text"
                    value={assignForm.vendor_site}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        vendor_site: e.target.value,
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                    placeholder="e.g., Vendor ABC"
                  />
                </div>
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end gap-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                onClick={() => setShowAssignModal(false)}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAssign}
                disabled={assigning || !assignForm.inspector_id}
              >
                {assigning ? "⏳ Assigning..." : "👷 Assign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
