//src/features/inspection-management/ui/details/ChecklistSection.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { checklistAppService } from "../../application/ChecklistApplicationService";
import type {
  InspectionChecklist,
  ChecklistItem,
  ChecklistResult,
} from "../../domain/types";

interface ChecklistSectionProps {
  inspectionId: string;
  inspectorId?: string;
  isEditable?: boolean;
}

const CATEGORIES = [
  "Visual Inspection",
  "Dimensional Check",
  "Documentation",
  "Functional Test",
  "Others",
];

const RESULT_COLORS: Record<ChecklistResult, string> = {
  PASS: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  FAIL: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
  NA: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
  PENDING:
    "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
};

export function ChecklistSection({
  inspectionId,
  inspectorId,
  isEditable = false,
}: ChecklistSectionProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [checklist, setChecklist] = useState<InspectionChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State موقت برای ویرایش
  const [editItems, setEditItems] = useState<
    Omit<ChecklistItem, "id" | "checklist_id">[]
  >([]);

  const loadChecklist = async () => {
    setLoading(true);
    try {
      const data = await checklistAppService.getByInspectionId(inspectionId);
      setChecklist(data);
      if (data) {
        setEditItems(data.items.map(({ id, checklist_id, ...rest }) => rest));
      } else {
        // مقدار پیش‌فرض برای ایجاد جدید
        setEditItems([
          {
            category: "Visual Inspection",
            description: "",
            result: "PENDING",
            remarks: "",
          },
        ]);
      }
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, [inspectionId]);

  const handleAddItem = () => {
    setEditItems([
      ...editItems,
      {
        category: "Visual Inspection",
        description: "",
        result: "PENDING",
        remarks: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof (typeof editItems)[0],
    value: any,
  ) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditItems(newItems);
  };

  const handleSave = async () => {
    if (!inspectorId && !user?.id) {
      showToast("error", "Error", "Inspector ID is required");
      return;
    }

    // اعتبارسنجی ساده
    const hasEmptyDesc = editItems.some((item) => !item.description.trim());
    if (hasEmptyDesc) {
      showToast(
        "warning",
        "Validation",
        "Please fill in all item descriptions",
      );
      return;
    }

    setIsSaving(true);
    try {
      await checklistAppService.saveChecklist(
        inspectionId,
        inspectorId || user!.id,
        editItems,
      );
      showToast("success", "Saved", "Checklist saved successfully");
      setIsEditing(false);
      await loadChecklist();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <div className="text-2xl animate-spin mb-2">⏳</div>
        <p className="text-xs text-slate-500">Loading checklist...</p>
      </div>
    );
  }

  // --- حالت ویرایش ---
  if (isEditing && isEditable) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3
            className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            ✏️ Edit Checklist
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "💾 Save Checklist"}
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {editItems.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <select
                  value={item.category}
                  onChange={(e) =>
                    handleItemChange(index, "category", e.target.value)
                  }
                  className={`text-xs font-semibold rounded px-2 py-1 input-themed ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="text-rose-500 hover:text-rose-700 text-xs"
                >
                  🗑️ Remove
                </button>
              </div>

              <textarea
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, "description", e.target.value)
                }
                placeholder="Inspection requirement description..."
                className={`w-full text-sm rounded-lg px-3 py-2 mb-3 input-themed resize-none`}
                rows={2}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                    Result
                  </label>
                  <div className="flex gap-2">
                    {(
                      ["PASS", "FAIL", "NA", "PENDING"] as ChecklistResult[]
                    ).map((res) => (
                      <button
                        key={res}
                        type="button"
                        onClick={() => handleItemChange(index, "result", res)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${
                          item.result === res
                            ? RESULT_COLORS[res]
                            : "border-slate-300 text-slate-500 dark:border-slate-600"
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-500 mb-1 block">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={item.remarks || ""}
                    onChange={(e) =>
                      handleItemChange(index, "remarks", e.target.value)
                    }
                    placeholder="Optional notes..."
                    className="w-full text-xs rounded px-2 py-1.5 input-themed"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="ghost"
            onClick={handleAddItem}
            className="w-full border-2 border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            ➕ Add New Item
          </Button>
        </div>
      </div>
    );
  }

  // --- حالت نمایش (Read-Only یا ایجاد جدید) ---
  if (!checklist) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p
          className={`text-sm font-medium mb-3 ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          No checklist created yet
        </p>
        {isEditable && (
          <Button variant="primary" onClick={() => setIsEditing(true)}>
            ➕ Create First Checklist
          </Button>
        )}
      </div>
    );
  }

  // گروه‌بندی آیتم‌ها بر اساس دسته‌بندی برای نمایش زیباتر
  const groupedItems = checklist.items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof checklist.items>,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          >
            📋 Inspection Checklist
          </h3>
          <Badge
            tone={
              checklist.status === "APPROVED"
                ? "emerald"
                : checklist.status === "SUBMITTED"
                  ? "indigo"
                  : "amber"
            }
            className="text-[9px]"
          >
            {checklist.status}
          </Badge>
        </div>
        {isEditable && checklist.status === "DRAFT" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit
          </Button>
        )}
      </div>

      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div
            key={category}
            className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
          >
            <div
              className={`px-4 py-2 border-b ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-100"}`}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {category}
              </h4>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-start gap-3">
                  <div
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      item.result === "PASS"
                        ? "bg-emerald-500"
                        : item.result === "FAIL"
                          ? "bg-rose-500"
                          : item.result === "NA"
                            ? "bg-slate-400"
                            : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {item.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${RESULT_COLORS[item.result]}`}
                      >
                        {item.result}
                      </span>
                      {item.remarks && (
                        <span
                          className={`text-[11px] italic ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          💬 {item.remarks}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
