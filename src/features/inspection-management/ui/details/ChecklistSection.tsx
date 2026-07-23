// src/features/inspection-management/ui/details/ChecklistSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { checklistAppService } from "../../application/ChecklistApplicationService";
import { inspectionAppService } from "../../application";
import {
  CHECKLIST_TEMPLATES,
  getTemplatesByCategory,
} from "../../utils/checklistTemplates";
import type {
  Checklist,
  ChecklistCategory,
  Inspection,
} from "@/features/inspection-management/domain/types";
import { CHECKLIST_CATEGORY_CONFIG } from "../../constants";

interface ChecklistSectionProps {
  requestId: string;
}

export function ChecklistSection({ requestId }: ChecklistSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>("");
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    category: "VISUAL" as ChecklistCategory,
    template_id: "",
    checklist_name: "",
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

  const loadChecklists = async (inspectionId: string) => {
    try {
      const data = await checklistAppService.getByInspection(inspectionId);
      setChecklists(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  useEffect(() => {
    loadInspections();
  }, [requestId]);

  useEffect(() => {
    if (selectedInspectionId) {
      loadChecklists(selectedInspectionId);
    }
  }, [selectedInspectionId]);

  const handleCreate = async () => {
    if (!selectedInspectionId) {
      showToast("error", "Error", "Please select an inspection first");
      return;
    }

    setCreating(true);
    try {
      let items: any[];
      if (createForm.template_id) {
        items =
          CHECKLIST_TEMPLATES.find(
            (t) => t.id === createForm.template_id,
          )?.items.map((item, idx) => ({
            ...item,
            id: `item_${Date.now()}_${idx}`,
          })) || [];
      } else {
        items = [];
      }

      await checklistAppService.createFromTemplate(
        selectedInspectionId,
        createForm.category,
        createForm.checklist_name ||
          CHECKLIST_CATEGORY_CONFIG[createForm.category].label,
        items,
      );
      showToast("success", "Created", "Checklist created");
      setShowCreateModal(false);
      setCreateForm({
        category: "VISUAL",
        template_id: "",
        checklist_name: "",
      });
      await loadChecklists(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleItemResult = async (
    checklistId: string,
    itemId: string,
    result: "PASS" | "FAIL" | "N/A",
  ) => {
    try {
      await checklistAppService.updateItemResult(
        checklistId,
        itemId,
        result,
        undefined,
        user?.id,
      );
      await loadChecklists(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const handleDelete = async (checklistId: string) => {
    const confirmed = await confirmDialog({
      title: "Delete Checklist",
      message: "Are you sure you want to delete this checklist?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await checklistAppService.delete(checklistId);
      showToast("success", "Deleted", "Checklist removed");
      await loadChecklists(selectedInspectionId);
    } catch (err: any) {
      showToast("error", "Failed", err.message);
    }
  };

  const availableTemplates = getTemplatesByCategory(createForm.category);

  return (
    <div className="space-y-4">
      {/* Inspection Selector */}
      <div className="flex items-center justify-between">
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
                Inspection {insp.id.slice(-6)} - {insp.status}
              </option>
            ))
          )}
        </select>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedInspectionId}
        >
          ✅ Create Checklist
        </Button>
      </div>

      {/* Checklists */}
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
          <div className="text-5xl mb-3"></div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No inspection selected
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Assign an inspector first to create checklists
          </p>
        </div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">✅</div>
          <p
            className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            No checklists created
          </p>
          <p
            className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Create a checklist to track inspection items
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => {
            const categoryConfig =
              CHECKLIST_CATEGORY_CONFIG[checklist.category];
            const totalItems = (checklist.results || checklist.items || [])
              .length;
            const passedItems = (checklist.results || []).filter(
              (r: any) => r.result === "PASS",
            ).length;
            const failedItems = (checklist.results || []).filter(
              (r: any) => r.result === "FAIL",
            ).length;
            const progress =
              totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0;

            return (
              <div
                key={checklist.id}
                className={`p-4 rounded-xl border ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                        isDark ? "bg-emerald-900/30" : "bg-emerald-100"
                      }`}
                    >
                      {categoryConfig.icon}
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {checklist.checklist_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge tone="slate" className="text-[9px]">
                          {categoryConfig.label}
                        </Badge>
                        <Badge
                          tone={
                            checklist.overall_status === "COMPLETED"
                              ? "emerald"
                              : checklist.overall_status === "IN_PROGRESS"
                                ? "indigo"
                                : "amber"
                          }
                          className="text-[9px]"
                        >
                          {checklist.overall_status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(checklist.id)}
                    className={`px-2 py-1 rounded text-xs ${
                      isDark
                        ? "text-rose-400 hover:bg-rose-900/30"
                        : "text-rose-600 hover:bg-rose-50"
                    }`}
                  >
                    🗑️
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span
                      className={isDark ? "text-slate-400" : "text-slate-600"}
                    >
                      Progress
                    </span>
                    <span
                      className={`font-semibold ${
                        failedItems > 0 ? "text-rose-500" : "text-emerald-500"
                      }`}
                    >
                      {passedItems}/{totalItems} ({progress}%)
                    </span>
                  </div>
                  <div
                    className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all ${
                        failedItems > 0 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {failedItems > 0 && (
                    <p className="text-[10px] text-rose-500 mt-1">
                      ⚠️ {failedItems} failed items
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {(checklist.items || []).map((item: any, idx: number) => {
                    const result = (checklist.results || [])[idx];
                    return (
                      <div
                        key={item.id || idx}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                          isDark
                            ? "bg-slate-900/50 border-slate-700"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <span
                          className={`text-xs flex-1 ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          {item.description}
                        </span>
                        <div className="flex gap-1">
                          {(["PASS", "FAIL", "N/A"] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() =>
                                handleItemResult(checklist.id, item.id, r)
                              }
                              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                                result?.result === r
                                  ? r === "PASS"
                                    ? "bg-emerald-600 text-white"
                                    : r === "FAIL"
                                      ? "bg-rose-600 text-white"
                                      : "bg-slate-600 text-white"
                                  : isDark
                                    ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
                ✅ Create Checklist
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Category *
                </label>
                <select
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      category: e.target.value as ChecklistCategory,
                      template_id: "",
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                >
                  {Object.entries(CHECKLIST_CATEGORY_CONFIG).map(
                    ([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Template (Optional)
                </label>
                <select
                  value={createForm.template_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      template_id: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                >
                  <option value="">-- Blank Checklist --</option>
                  {availableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.items.length} items)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={`block text-xs font-semibold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Checklist Name
                </label>
                <input
                  type="text"
                  value={createForm.checklist_name}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      checklist_name: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm input-themed`}
                  placeholder="Leave blank to use category name"
                />
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
                {creating ? "⏳ Creating..." : "✅ Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
