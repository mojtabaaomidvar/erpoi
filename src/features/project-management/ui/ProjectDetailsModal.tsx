// src/features/project-management/ui/ProjectDetailsModal.tsx

import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ProjectElements } from "@shared/authorization/ui/elements/ProjectElements";
import type { Project } from "../domain/types";
import { INSPECTION_CATEGORY_CONFIG } from "@features/inspection-management/constants";
import { useProjectStats } from "../hooks/useProjectStats";
import {
  calculateProjectStatus,
  calculateTimeProgress,
} from "../utils/projectDateUtils";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onEdit: (project: Project) => void;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onEdit,
}: ProjectDetailsModalProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  // ✅ تعریف دسترسی‌ها بر اساس Registry

  const canBtn_edit = canAccessElement(
    ProjectElements.ProjectDetails.btn_edit.id,
  );
  const canStats_section = canAccessElement(
    ProjectElements.ProjectDetails.stats_section.id,
  );
  const canStat_tpi_spot = canAccessElement(
    ProjectElements.ProjectDetails.stat_tpi_spot.id,
  );
  const canStat_tpi_resident = canAccessElement(
    ProjectElements.ProjectDetails.stat_tpi_resident.id,
  );
  const canStat_mws = canAccessElement(
    ProjectElements.ProjectDetails.stat_mws.id,
  );
  const canStat_total_inspections = canAccessElement(
    ProjectElements.ProjectDetails.stat_total_inspections.id,
  );
  const canStat_completed_inspections = canAccessElement(
    ProjectElements.ProjectDetails.stat_completed_inspections.id,
  );
  const canStat_total_man_days = canAccessElement(
    ProjectElements.ProjectDetails.stat_total_man_days.id,
  );
  const canProgress_overall = canAccessElement(
    ProjectElements.ProjectDetails.progress_overall.id,
  );
  const canInfo_pm = canAccessElement(
    ProjectElements.ProjectDetails.info_pm.id,
  );
  const canInfo_coordinator = canAccessElement(
    ProjectElements.ProjectDetails.info_coordinator.id,
  );

  const { stats, isLoading: isStatsLoading } = useProjectStats(
    project?.id || null,
  );

  if (!project) return null;

  const dynamicStatus = calculateProjectStatus(
    project.start_date,
    project.end_date,
    project.status,
  );
  const timeProgress = calculateTimeProgress(
    project.start_date,
    project.end_date,
  );
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "emerald";
      case "COMPLETED":
        return "slate";
      case "ON_HOLD":
        return "amber";
      case "CANCELLED":
        return "rose";
      default:
        return "slate";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Details" size="lg">
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Basic Information */}
          <div
            className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
          >
            <h3
              className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              📋 Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Project Name
                </div>
                <div
                  className={`text-sm font-bold mt-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {project.name}
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Status
                </div>
                <div className="mt-1">
                  {/* ✅ نمایش وضعیت پویا */}
                  <Badge
                    tone={getStatusColor(dynamicStatus) as any}
                    className="text-xs"
                  >
                    {dynamicStatus === "NOT_STARTED" && "⏳ "}
                    {dynamicStatus === "ACTIVE" && "🟢 "}
                    {dynamicStatus === "COMPLETED" && "✅ "}
                    {dynamicStatus === "ON_HOLD" && "⏸️ "}
                    {dynamicStatus === "CANCELLED" && "❌ "}
                    {dynamicStatus.replace("_", " ")}
                  </Badge>
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Service Types
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {project.service_types?.map((type) => {
                    const config =
                      INSPECTION_CATEGORY_CONFIG[
                        type as keyof typeof INSPECTION_CATEGORY_CONFIG
                      ];
                    return (
                      <Badge
                        key={type}
                        tone={config?.color as any}
                        className="text-xs"
                      >
                        {config?.icon} {type}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div>
                <div
                  className={`text-[10px] uppercase font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Period
                </div>
                <div
                  className={`text-sm mt-1 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                >
                  {project.start_date} → {project.end_date}
                </div>
              </div>

              {/* ✅ نمایش درصد پیشرفت زمانی */}
              <div className="col-span-2">
                <div
                  className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Time Progress
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  >
                    <div
                      className={`h-full transition-all duration-500 ${
                        timeProgress >= 75
                          ? "bg-gradient-to-r from-rose-500 to-red-600"
                          : timeProgress >= 50
                            ? "bg-gradient-to-r from-amber-500 to-orange-600"
                            : timeProgress >= 25
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                              : "bg-gradient-to-r from-emerald-500 to-green-600"
                      }`}
                      style={{ width: `${timeProgress}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}
                  >
                    {timeProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {project.description && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div
                  className={`text-[10px] uppercase font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Description
                </div>
                <div
                  className={`text-sm mt-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  {project.description}
                </div>
              </div>
            )}
          </div>

          {/* Inspection Statistics (Conditional) */}
          {canStats_section &&
            (isStatsLoading ? (
              <div
                className={`p-4 rounded-xl border text-center ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Loading statistics...
                </p>
              </div>
            ) : stats ? (
              <div
                className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <h3
                  className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  📊 Inspection Statistics
                </h3>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {canStat_tpi_spot && (
                    <div
                      className={`p-3 rounded-lg ${isDark ? "bg-indigo-900/20 border border-indigo-800" : "bg-indigo-50 border border-indigo-200"}`}
                    >
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                      >
                        {stats.tpi_spot_count}
                      </div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        TPI Spot Inspections
                      </div>
                      <div
                        className={`text-[9px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                      >
                        {stats.tpi_spot_man_days} man-days
                      </div>
                    </div>
                  )}
                  {canStat_tpi_resident && (
                    <div
                      className={`p-3 rounded-lg ${isDark ? "bg-emerald-900/20 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}
                    >
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                      >
                        {stats.tpi_resident_count}
                      </div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        TPI Resident Inspections
                      </div>
                      <div
                        className={`text-[9px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                      >
                        {stats.tpi_resident_man_days} man-days
                      </div>
                    </div>
                  )}
                  {canStat_mws && (
                    <div
                      className={`p-3 rounded-lg ${isDark ? "bg-blue-900/20 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}
                    >
                      <div
                        className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                      >
                        {stats.mws_count}
                      </div>
                      <div
                        className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        MWS Inspections
                      </div>
                      <div
                        className={`text-[9px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                      >
                        {stats.mws_man_days} man-days
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Stats */}
                <div
                  className={`p-3 rounded-lg ${isDark ? "bg-slate-900/50 border border-slate-700" : "bg-white border border-slate-200"}`}
                >
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {canStat_total_inspections && (
                      <div>
                        <div
                          className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          {stats.total_inspections}
                        </div>
                        <div
                          className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Total Inspections
                        </div>
                      </div>
                    )}
                    {canStat_completed_inspections && (
                      <div>
                        <div
                          className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                        >
                          {stats.completed_inspections}
                        </div>
                        <div
                          className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Completed
                        </div>
                      </div>
                    )}
                    {canStat_total_man_days && (
                      <div>
                        <div
                          className={`text-lg font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                        >
                          {stats.total_man_days}
                        </div>
                        <div
                          className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          Total Man-Days
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {canProgress_overall && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span
                        className={isDark ? "text-slate-400" : "text-slate-600"}
                      >
                        Overall Progress
                      </span>
                      <span
                        className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        {stats.total_inspections > 0
                          ? Math.round(
                              (stats.completed_inspections /
                                stats.total_inspections) *
                                100,
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div
                      className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                        style={{
                          width: `${stats.total_inspections > 0 ? (stats.completed_inspections / stats.total_inspections) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null)}
        </div>

        {/* Footer */}
        <div
          className={`flex-shrink-0 px-6 py-4 border-t ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
        >
          <div className="flex justify-end gap-2">
            {canBtn_edit && (
              <Button variant="outline" onClick={() => onEdit(project)}>
                ✏️ Edit
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
