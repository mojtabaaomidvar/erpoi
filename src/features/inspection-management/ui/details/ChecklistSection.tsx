// src/features/inspection-management/ui/details/ChecklistSection.tsx

import { useState, useEffect } from "react";
import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { checklistAppService } from "../../application/ChecklistApplicationService";
import { ChecklistFullScreenModal } from "./ChecklistFullScreenModal";

interface ChecklistSectionProps {
  requestId: string;
  equipmentId: string[];
  stages?: string[];
  methods?: string[];
}

export function ChecklistSection({
  requestId,
  equipmentId = [],
  stages,
  methods,
}: ChecklistSectionProps) {
  const { isDark } = useTheme();
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [summary, setSummary] = useState({
    equipmentCount: 0,
    totalItems: 0,
    templateNames: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (equipmentId.length === 0) {
        setLoading(false);
        return;
      }
      try {
        let totalItems = 0;
        const templateNames = new Set<string>();

        for (const eqId of equipmentId) {
          const data = await checklistAppService.getChecklist({
            equipmentId: [eqId],
            stages,
            methods,
          });
          if (data.template) {
            templateNames.add(data.template.name);
            totalItems += data.groups.reduce(
              (sum, g) => sum + g.items.length,
              0,
            );
          }
        }

        setSummary({
          equipmentCount: equipmentId.length,
          totalItems,
          templateNames: Array.from(templateNames),
        });
      } catch (err) {
        console.error("Failed to fetch checklist summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [equipmentId, stages, methods]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}
      >
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span
          className={`ml-3 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          Loading checklist summary...
        </span>
      </div>
    );
  }

  if (equipmentId.length === 0 || summary.totalItems === 0) {
    return (
      <div
        className={`text-center py-12 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50"}`}
      >
        <div className="text-4xl mb-3">📋</div>
        <p
          className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          No checklist available
        </p>
        <p
          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          No checklist templates found for the selected equipment.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`p-6 rounded-2xl border-2 ${isDark ? "border-indigo-900/50 bg-gradient-to-br from-slate-800 to-slate-900" : "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white"}`}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3
              className={`text-lg font-bold mb-2 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              📋 Inspection Checklist Ready
            </h3>
            <div className="space-y-1.5">
              <p
                className={`text-sm flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                <span className="text-indigo-500">🔧</span>{" "}
                {summary.equipmentCount} Equipment Type
                {summary.equipmentCount > 1 ? "s" : ""}
              </p>
              <p
                className={`text-sm flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                <span className="text-indigo-500">📝</span> ~
                {summary.totalItems} Total Inspection Items
              </p>
              <p
                className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Templates: {summary.templateNames.join(", ")}
              </p>
            </div>
          </div>

          <div
            className={`text-4xl p-3 rounded-xl ${isDark ? "bg-indigo-900/30" : "bg-indigo-100"}`}
          >
            ⛶
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsFullScreenOpen(true)}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
        >
          Checklist Deatils
        </Button>
      </div>

      {isFullScreenOpen && (
        <ChecklistFullScreenModal
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          requestId={requestId}
          equipmentId={equipmentId}
          stages={stages}
          methods={methods}
        />
      )}
    </>
  );
}
