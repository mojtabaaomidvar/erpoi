// src/features/inspection-management/ui/ProjectList.tsx

import { useMemo, useState, useEffect } from "react";
import { Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { showToast } from "@shared/ui/ToastContainer";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import {
  projectStatsAppService,
  type ProjectStats,
} from "../application/ProjectStatsApplicationService";
import type { Project } from "../domain/types";
import { INSPECTION_CATEGORY_CONFIG } from "@features/inspection-management/constants";

interface ProjectListProps {
  projects: Project[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onProjectClick: (project: Project) => void;
  onAddClick: () => void;
  canClickItem: boolean;
  canAdd: boolean;
  loading?: boolean;
}

export function ProjectList({
  projects,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  onProjectClick,
  onAddClick,
  canClickItem,
  canAdd,
  loading = false,
}: ProjectListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();
  const [projectStats, setProjectStats] = useState<
    Record<string, ProjectStats>
  >({});
  const [statsLoading, setStatsLoading] = useState(false);

  const canViewItems = canAccessElement("project_list_item_view");
  const canSearch = canAccessElement("project_search_box");

  useEffect(() => {
    const loadStats = async () => {
      if (projects.length === 0) return;
      setStatsLoading(true);
      const stats: Record<string, ProjectStats> = {};
      for (const project of projects) {
        try {
          stats[project.id] = await projectStatsAppService.getProjectStats(
            project.id,
          );
        } catch (err) {
          console.error(`Failed to load stats for project ${project.id}`, err);
        }
      }
      setProjectStats(stats);
      setStatsLoading(false);
    };
    loadStats();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchQuery ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "ALL" || project.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: projects.length };
    projects.forEach((p) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const handleProjectClick = (project: Project) => {
    if (!canClickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view project details",
      );
      return;
    }
    onProjectClick(project);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; bg: string; icon: string; label: string }
    > = {
      ACTIVE: {
        color: "emerald",
        bg: "from-emerald-500 to-green-600",
        icon: "",
        label: "Active",
      },
      COMPLETED: {
        color: "slate",
        bg: "from-slate-500 to-slate-600",
        icon: "✅",
        label: "Completed",
      },
      ON_HOLD: {
        color: "amber",
        bg: "from-amber-500 to-orange-600",
        icon: "️",
        label: "On Hold",
      },
      CANCELLED: {
        color: "rose",
        bg: "from-rose-500 to-red-600",
        icon: "❌",
        label: "Cancelled",
      },
    };
    return configs[status] || configs.ACTIVE;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "from-emerald-500 to-green-600";
    if (progress >= 50) return "from-blue-500 to-indigo-600";
    if (progress >= 25) return "from-amber-500 to-orange-600";
    return "from-rose-500 to-red-600";
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className={`relative px-6 py-4 border-b ${
          isDark
            ? "border-slate-700/50 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900"
            : "border-slate-200/70 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                isDark
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20"
              }`}
            >
              📁
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Projects
              </h2>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {projects.length} total projects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSearch && (
              <FloatingSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search projects..."
                icon="🔍"
              />
            )}
            {canAdd && (
              <Button
                variant="primary"
                size="sm"
                onClick={onAddClick}
                className="gap-2"
              >
                <span>➕</span> New Project
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {(
            ["ALL", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"] as const
          ).map((status) => {
            const config = getStatusConfig(status);
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  filterStatus === status
                    ? isDark
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-indigo-500 text-white shadow-md"
                    : isDark
                      ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {status === "ALL" ? "📊 All" : `${config.icon} ${config.label}`}
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    filterStatus === status
                      ? "bg-white/20"
                      : isDark
                        ? "bg-slate-800"
                        : "bg-slate-200"
                  }`}
                >
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!canViewItems ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              🔒
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Access Denied
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              You do not have permission to view projects.
            </p>
          </div>
        ) : loading || statsLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-4xl mb-2 animate-pulse"></div>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Loading projects...
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              📁
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No projects found
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Create your first project to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const isOptimistic = project.id.startsWith("temp_");
              const stats = projectStats[project.id];
              const statusConfig = getStatusConfig(project.status);
              const progress =
                stats && stats.total_inspections > 0
                  ? (stats.completed_inspections / stats.total_inspections) *
                    100
                  : 0;
              const progressColor = getProgressColor(progress);

              return (
                <button
                  key={project.id}
                  onClick={() => !isOptimistic && handleProjectClick(project)}
                  disabled={isOptimistic}
                  className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOptimistic
                      ? "opacity-70 cursor-wait bg-slate-100 dark:bg-slate-800/30 animate-pulse-slow"
                      : "hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
                  } ${
                    !isOptimistic &&
                    (isDark
                      ? "bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-indigo-500/10"
                      : "bg-white border border-slate-200/70 hover:border-indigo-300 hover:shadow-indigo-500/10")
                  }`}
                >
                  {/* 🔔 نشانگر در حال ذخیره (Ping Indicator) */}
                  {isOptimistic && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                    </div>
                  )}

                  {/* Top Gradient Bar */}
                  <div
                    className={`h-1 bg-gradient-to-r ${isOptimistic ? "from-slate-400 to-slate-500" : statusConfig.bg}`}
                  />

                  {/* Card Content */}
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-bold truncate mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            tone={statusConfig.color as any}
                            className="text-[9px]"
                          >
                            {statusConfig.icon} {statusConfig.label}
                          </Badge>
                          {project.service_types?.map((type) => (
                            <Badge
                              key={type}
                              tone={
                                INSPECTION_CATEGORY_CONFIG[type]?.color as any
                              }
                              className="text-[9px]"
                            >
                              {INSPECTION_CATEGORY_CONFIG[type]?.icon} {type}
                            </Badge>
                          ))}
                          {isOptimistic && (
                            <Badge tone="indigo" className="text-[9px]">
                              ⏳ Saving...
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid (فقط برای پروژه‌های واقعی) */}
                    {stats && !isOptimistic && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                          <div
                            className={`text-lg font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                          >
                            {stats.tpi_spot_count}
                          </div>
                          <div
                            className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            TPI Spot
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                          >
                            {stats.tpi_resident_count}
                          </div>
                          <div
                            className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            TPI Resident
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-lg font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          >
                            {stats.mws_count}
                          </div>
                          <div
                            className={`text-[9px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            MWS
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skeleton Stats برای آیتم موقت */}
                    {isOptimistic && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="text-center">
                            <div
                              className={`h-6 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} animate-pulse mb-1`}
                            ></div>
                            <div
                              className={`h-3 w-12 mx-auto rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} animate-pulse`}
                            ></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Progress Section (فقط برای پروژه‌های واقعی) */}
                    {stats && !isOptimistic && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span
                            className={
                              isDark ? "text-slate-400" : "text-slate-500"
                            }
                          >
                            Man-Days: {stats.total_man_days}
                          </span>
                          <span
                            className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {stats.completed_inspections}/
                            {stats.total_inspections} ({Math.round(progress)}%)
                          </span>
                        </div>
                        <div
                          className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                        >
                          <div
                            className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Skeleton Progress برای آیتم موقت */}
                    {isOptimistic && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <div
                            className={`h-3 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} animate-pulse`}
                          ></div>
                          <div
                            className={`h-3 w-12 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"} animate-pulse`}
                          ></div>
                        </div>
                        <div
                          className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                        >
                          <div className="h-full w-1/3 bg-gradient-to-r from-slate-400 to-slate-500 animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div
                      className={`flex items-center justify-between text-[10px] pt-3 border-t ${
                        isDark
                          ? "border-slate-700 text-slate-400"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      <span>
                        📅 {project.start_date} → {project.end_date}
                      </span>
                      {stats && !isOptimistic && (
                        <span className="font-semibold">
                          ⏱️ {stats.total_man_days} man-days
                        </span>
                      )}
                      {isOptimistic && (
                        <span className="text-indigo-500 font-semibold">
                          ⏳ Syncing...
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className={`px-6 py-3 border-t ${isDark ? "border-slate-700/50 bg-slate-900/50" : "border-slate-200/70 bg-slate-50/50"}`}
      >
        <div className="flex items-center justify-between text-[10px]">
          <span className={isDark ? "text-slate-400" : "text-slate-600"}>
            Showing {filteredProjects.length} of {projects.length} projects
          </span>
        </div>
      </div>
    </div>
  );
}
