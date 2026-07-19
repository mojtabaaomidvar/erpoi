// src/features/inspection-management/ui/ProjectDetailsModal.tsx

import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import {
  projectStatsAppService,
  type ProjectStats,
} from "../application/ProjectStatsApplicationService";
import type { Project } from "../domain/types";
import { INSPECTION_CATEGORY_CONFIG } from "@features/inspection-management/constants";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { useAuth } from "@features/auth/hooks/useAuth";

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ProjectDetailsModal({
  isOpen,
  onClose,
  project,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: ProjectDetailsModalProps) {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();
  const canManageMembers = canAccessElement("project_btn_manage_members");

  useEffect(() => {
    if (isOpen && project?.id) {
      setLoading(true);
      projectStatsAppService
        .getProjectStats(project.id)
        .then(setStats)
        .catch((err) => console.error("Failed to load project stats:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, project?.id]);

  if (!project) return null;

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
        {/* Content */}
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
                  <Badge
                    tone={getStatusColor(project.status) as any}
                    className="text-xs"
                  >
                    {project.status.replace("_", " ")}
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
                  {project.service_types?.map((type) => (
                    <Badge
                      key={type}
                      tone={INSPECTION_CATEGORY_CONFIG[type]?.color as any}
                      className="text-xs"
                    >
                      {INSPECTION_CATEGORY_CONFIG[type]?.icon} {type}
                    </Badge>
                  ))}
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

          {/* Inspection Statistics */}
          {loading ? (
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
              </div>

              {/* Summary Stats */}
              <div
                className={`p-3 rounded-lg ${isDark ? "bg-slate-900/50 border border-slate-700" : "bg-white border border-slate-200"}`}
              >
                <div className="grid grid-cols-3 gap-3 text-center">
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
                </div>
              </div>

              {/* Progress Bar */}
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
                      width: `${
                        stats.total_inspections > 0
                          ? (stats.completed_inspections /
                              stats.total_inspections) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className={`flex-shrink-0 px-6 py-4 border-t ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => onEdit(project)}>
                ️ Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" onClick={() => onDelete(project)}>
                ️ Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
