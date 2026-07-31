// src/features/inspection-management/ui/details/ChecklistSection.tsx

import { useState, useEffect } from "react";
import { Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { checklistAppService } from "../../application/ChecklistApplicationService";
import type {
  ChecklistData,
  ChecklistGroup,
} from "../../domain/checklistTypes";

interface ChecklistSectionProps {
  equipmentId: string;
  inspectionStages?: string[];
  inspectionMethods?: string | string[];
}

export function ChecklistSection({
  equipmentId,
  inspectionStages,
  inspectionMethods,
}: ChecklistSectionProps) {
  const { isDark } = useTheme();
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const loadChecklist = async () => {
    setLoading(true);
    try {
      const data =
        await checklistAppService.getChecklistByEquipment(equipmentId);
      setChecklistData(data);

      if (data.groups.length > 0) {
        setExpandedGroups(new Set(data.groups.map((g) => g.method)));
      }
    } catch (err) {
      console.error("Failed to load checklist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (equipmentId) {
      loadChecklist();
    }
  }, [equipmentId]);

  const handleCheckItem = (itemId: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleGroup = (method: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(method)) {
        newSet.delete(method);
      } else {
        newSet.add(method);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-2 animate-pulse">⏳</div>
        <p
          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          Loading checklist...
        </p>
      </div>
    );
  }

  if (!checklistData || !checklistData.template) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">📋</div>
        <p
          className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          No checklist available
        </p>
        <p
          className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          No checklist template found for equipment: {equipmentId}
        </p>
      </div>
    );
  }

  // ✅ فیلتر کردن گروه‌ها بر اساس inspectionStages و inspectionMethod
  let filteredGroups = checklistData.groups;

  if (inspectionStages && inspectionStages.length > 0) {
    filteredGroups = filteredGroups.filter((group) =>
      inspectionStages.some((stage) =>
        group.method.toLowerCase().includes(stage.toLowerCase()),
      ),
    );
  }

  if (inspectionMethods) {
    const methodsArray = Array.isArray(inspectionMethods)
      ? inspectionMethods
      : [inspectionMethods];
    const methodsLower = methodsArray;
  }

  const totalItems = filteredGroups.reduce((sum, g) => sum + g.items.length, 0);
  const checkedCount = filteredGroups.reduce(
    (sum, g) =>
      sum + g.items.filter((item) => checkedItems.has(item.id)).length,
    0,
  );
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* هدر با اطلاعات template و پیشرفت */}
      <div
        className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3
              className={`text-base font-bold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              📋 {checklistData.template.name}
            </h3>
            <p
              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {checklistData.template.description}
            </p>
          </div>
          <Badge tone="indigo" className="text-xs shrink-0 ml-3">
            {checkedCount}/{totalItems}
          </Badge>
        </div>

        {/* نوار پیشرفت */}
        <div
          className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={`text-[10px] mt-1 text-right ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {progress.toFixed(0)}% Complete
        </div>
      </div>

      {/* گروه‌های چک‌لیست */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-8">
          <p
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            No checklist items for the selected stages/method
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group, groupIdx) => (
            <ChecklistGroupCard
              key={groupIdx}
              group={group}
              checkedItems={checkedItems}
              onCheckItem={handleCheckItem}
              isExpanded={expandedGroups.has(group.method)}
              onToggle={() => toggleGroup(group.method)}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistGroupCard({
  group,
  checkedItems,
  onCheckItem,
  isExpanded,
  onToggle,
  isDark,
}: {
  group: ChecklistGroup;
  checkedItems: Set<string>;
  onCheckItem: (itemId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isDark: boolean;
}) {
  const checkedCount = group.items.filter((item) =>
    checkedItems.has(item.id),
  ).length;
  const totalCount = group.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-700" : "border-slate-200"}`}
    >
      {/* هدر گروه قابل کلیک */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          isDark
            ? "bg-indigo-900/20 hover:bg-indigo-900/30"
            : "bg-indigo-50 hover:bg-indigo-100"
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <span
            className={`text-lg ${isExpanded ? "rotate-90" : ""} transition-transform`}
          >
            ▶
          </span>
          <h4
            className={`text-sm font-bold text-left ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
          >
            🔍 {group.method}
          </h4>
        </div>
        <div className="flex items-center gap-3">
          {/* نوار پیشرفت کوچک */}
          <div
            className={`w-24 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          >
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <Badge tone="indigo" className="text-[10px]">
            {checkedCount}/{totalCount}
          </Badge>
        </div>
      </button>

      {/* آیتم‌های چک‌لیست (فقط وقتی باز است) */}
      {isExpanded && (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {group.items.map((item) => {
            const isChecked = checkedItems.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isChecked
                    ? isDark
                      ? "bg-emerald-900/10"
                      : "bg-emerald-50/50"
                    : isDark
                      ? "hover:bg-slate-800/50"
                      : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onCheckItem(item.id)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm leading-relaxed ${
                      isChecked
                        ? isDark
                          ? "text-slate-400 line-through"
                          : "text-slate-500 line-through"
                        : isDark
                          ? "text-slate-200"
                          : "text-slate-800"
                    }`}
                  >
                    {item.sequence}. {item.checklist_text}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
