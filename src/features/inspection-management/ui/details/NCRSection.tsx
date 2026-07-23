// src/features/inspection-management/ui/details/NCRSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { ncrAppService } from "../../application/NCRApplicationService";
import { inspectionAppService } from "../../application";
import type {
  NonConformity,
  NCRSeverity,
  NCRStatus,
  Inspection,
} from "@/features/inspection-management/domain/types";
import { NCR_SEVERITY_CONFIG, NCR_STATUS_CONFIG } from "../../constants";

interface NCRSectionProps {
  requestId: string;
}

const SEVERITY_OPTIONS: NCRSeverity[] = ["MINOR", "MAJOR", "CRITICAL"];

export function NCRSection({ requestId }: NCRSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>("");
  const [ncrs, setNcrs] = useState<NonConformity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    severity: "MINOR" as NCRSeverity,
    location_found: "",
    photos: [] as string[],
  });

  const loadInspections = async () => {
    setLoading(true);
    try {
      const data = await inspectionAppService.getByInspectionRequest(requestId);
      setInspections(data);
      if (data.length > 0) setSelectedInspectionId(data[0].id);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNCRs = async (inspectionId: string) => {
    try {
      const data = await ncrAppService.getByInspection(inspectionId);
      setNcrs(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [requestId]);

  useEffect(() => {
    if (selectedInspectionId) {
      loadNCRs(selectedInspectionId);
    }
  }, [selectedInspectionId]);

  const handleCreate = async () => {
    if (!selectedInspectionId) {
      showToast("error", "Error", "Please select an inspection first");
      return;
    }
    if (!createForm.title.trim() || !createForm.description.trim()) {
      showToast("error", "Error", "Title and description are required");
      return;
    }

    setCreating(true);
    try {
      await ncrAppService.create({
        inspection_id: selectedInspectionId,
        title: createForm.title,
        description: createForm.description,
        severity: createForm.severity,
        location_found: createForm.location_found,
        photos: createForm.photos,
        reported_by: user?.id,
      });
      showToast("success", "Created", "NCR created successfully");
      setShowCreateModal(false);
      setCreateForm({
        title: "",
        description: "",
        severity: "MINOR",
        location_found: "",
        photos: [],
      });
      await loadNCRs(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (
    ncr: NonConformity,
    newStatus: NCRStatus,
  ) => {
    try {
      if (newStatus === "CLOSED") {
        await ncrAppService.closeNCR(ncr.id, user?.id || "");
      } else if (newStatus === "OPEN") {
        await ncrAppService.reopenNCR(ncr.id);
      } else {
        const action = prompt("Enter corrective action:");
        if (!action) return;
        await ncrAppService.addCorrectiveAction(ncr.id, action);
      }
      showToast("success", "Updated", `NCR status changed to ${newStatus}`);
      await loadNCRs(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const handleDelete = async (ncrId: string) => {
    const confirmed = await confirmDialog({
      title: "Delete NCR",
      message: "Are you sure you want to delete this NCR?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await ncrAppService.delete(ncrId);
      showToast("success", "Deleted", "NCR removed");
      await loadNCRs(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const stats = {
    open: ncrs.filter((n) => n.status === "OPEN").length,
    inProgress: ncrs.filter((n) => n.status === "CORRECTIVE_ACTION").length,
    closed: ncrs.filter((n) => n.status === "CLOSED").length,
    critical: ncrs.filter((n) => n.severity === "CRITICAL").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={selectedInspectionId}
            onChange={(e) => setSelectedInspectionId(e.target.value)}
            className={`rounded-lg px-3 py-2 text-sm input-themed max-w-xs`}
          >
            {inspections.length === 0 ? (
              <option value="">No inspections available</option>
            ) : (
              inspections.map((insp) => (
                <option key={insp.id} value={insp.id}>
                  Inspection {insp.id.slice(-6)}
                </option>
              ))
            )}
          </select>
          <Badge tone="danger" className="text-[10px]">
            ⚠️ {stats.open} Open
          </Badge>
          <Badge tone="indigo" className="text-[10px]">
            🔧 {stats.inProgress} In Progress
          </Badge>
          <Badge tone="emerald" className="text-[10px]">
            ✅ {stats.closed} Closed
          </Badge>
          {stats.critical > 0 && (
            <Badge tone="danger" className="text-[10px] animate-pulse">
              🚨 {stats.critical} Critical
            </Badge>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedInspectionId}
        >
          ⚠️ Create NCR
        </Button>
      </div>

      {/* NCRs List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Loading...
          </p>
        </div>
      ) : !selectedInspectionId ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">⚠️</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No inspection selected
          </p>
        </div>
      ) : ncrs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">✅</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No non-conformities found
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Great! No issues reported for this inspection
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ncrs.map((ncr) => {
            const severityConfig = NCR_SEVERITY_CONFIG[ncr.severity];
            const statusConfig = NCR_STATUS_CONFIG[ncr.status];

            return (
              <div
                key={ncr.id}
                className={`p-4 rounded-xl border-l-4 ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                } ${
                  ncr.severity === "CRITICAL"
                    ? "border-l-rose-500"
                    : ncr.severity === "MAJOR"
                      ? "border-l-orange-500"
                      : "border-l-amber-500"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {ncr.ncr_number}
                      </span>
                      <Badge
                        tone={severityConfig.color as any}
                        className="text-[9px]"
                      >
                        {severityConfig.label}
                      </Badge>
                      <Badge
                        tone={statusConfig.color as any}
                        className="text-[9px]"
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                    </div>
                    <h4
                      className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {ncr.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleDelete(ncr.id)}
                    className={`px-2 py-1 rounded text-xs ${
                      isDark
                        ? "text-rose-400 hover:bg-rose-900/30"
                        : "text-rose-600 hover:bg-rose-50"
                    }`}
                  >
                    🗑️
                  </button>
                </div>

                <p
                  className={`text-xs mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {ncr.description}
                </p>

                {ncr.location_found && (
                  <div
                    className={`text-[11px] mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    📍 {ncr.location_found}
                  </div>
                )}

                {ncr.corrective_action && (
                  <div
                    className={`p-2 rounded-lg text-[11px] mb-2 ${
                      isDark
                        ? "bg-blue-900/20 text-blue-300"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      <span></span>
                      <div>
                        <div className="font-semibold">Corrective Action:</div>
                        <div>{ncr.corrective_action}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {ncr.status === "OPEN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(ncr, "CORRECTIVE_ACTION")
                      }
                    >
                      🔧 Add Action
                    </Button>
                  )}
                  {ncr.status === "CORRECTIVE_ACTION" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusChange(ncr, "CLOSED")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      ✓ Close NCR
                    </Button>
                  )}
                  {ncr.status === "CLOSED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(ncr, "OPEN")}
                    >
                      ↺ Reopen
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
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
                ⚠️ Create Non-Conformity Report
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Title *
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, title: e.target.value })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                  placeholder="Brief title of the non-conformity"
                />
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Description *
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                  placeholder="Detailed description of the issue..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Severity *
                  </label>
                  <div className="flex gap-1.5">
                    {SEVERITY_OPTIONS.map((sev) => {
                      const config = NCR_SEVERITY_CONFIG[sev];
                      const isSelected = createForm.severity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() =>
                            setCreateForm({ ...createForm, severity: sev })
                          }
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? sev === "CRITICAL"
                                ? "bg-rose-600 text-white border-rose-600"
                                : sev === "MAJOR"
                                  ? "bg-orange-600 text-white border-orange-600"
                                  : "bg-amber-600 text-white border-amber-600"
                              : isDark
                                ? "bg-slate-800 border-slate-700 text-slate-400"
                                : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    value={createForm.location_found}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        location_found: e.target.value,
                      })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                    placeholder="Where found"
                  />
                </div>
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-end gap-2 ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "⏳ Creating..." : "️ Create NCR"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
