// src/features/project-management/ui/ProjectList.tsx

import { useMemo } from "react";
import { Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { ProjectElements } from "@shared/authorization/ui/elements/ProjectElements";
import { showToast } from "@shared/ui/ToastContainer";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import type { Project } from "../domain/types";
import type { ProjectStats } from "../domain/models/ProjectStats";
import { INSPECTION_CATEGORY_CONFIG } from "@features/inspection-management/constants";
import { calculateProjectStatus } from "../utils/projectDateUtils";

export interface ProjectWithStats extends Project {
  stats?: ProjectStats | null;
}

interface ProjectListProps {
  projects: ProjectWithStats[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onProjectClick: (project: ProjectWithStats) => void;
  onAddClick: () => void;
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
  loading = false,
}: ProjectListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  const canViewList = canAccessElement(
    ProjectElements.ProjectList.list_item_view.id,
  );
  const canClickItem = canAccessElement(
    ProjectElements.ProjectList.list_item_click.id,
  );
  const canSearch = canAccessElement(ProjectElements.ProjectList.search_box.id);
  const canFilterStatus = canAccessElement(
    ProjectElements.ProjectList.filter_status.id,
  );
  const canAdd = canAccessElement(ProjectElements.ProjectList.btn_add.id);

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

  const handleProjectClick = (project: ProjectWithStats) => {
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
        icon: "🟢",
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
        icon: "⏸️",
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

  const getTeamMembers = (project: ProjectWithStats) => {
    const members = project.members || [];
    const pm = members.find((m) => m.role === "PROJECT_MANAGER");
    const coordinator = members.find((m) => m.role === "COORDINATOR");
    const inspectors = members.filter((m) => m.role === "INSPECTOR");
    return { pm, coordinator, inspectors };
  };

  if (!canViewList) {
    return (
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
          You do not have permission to view the project list.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className={`relative px-6 py-4 border-b ${isDark ? "border-slate-700/50 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900" : "border-slate-200/70 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isDark ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20"}`}
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

        {canFilterStatus && (
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
                  {status === "ALL"
                    ? "📊 All"
                    : `${config.icon} ${config.label}`}
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterStatus === status ? "bg-white/20" : isDark ? "bg-slate-800" : "bg-slate-200"}`}
                  >
                    {statusCounts[status] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-4xl mb-2 animate-pulse">⏳</div>
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
              const stats = project.stats;
              const dynamicStatus = calculateProjectStatus(
                project.start_date,
                project.end_date,
                project.status,
              );
              const statusConfig = getStatusConfig(dynamicStatus);
              const progress =
                stats && stats.total_inspections > 0
                  ? (stats.completed_inspections / stats.total_inspections) *
                    100
                  : 0;
              const { pm, coordinator, inspectors } = getTeamMembers(project);

              return (
                <button
                  key={project.id}
                  onClick={() => !isOptimistic && handleProjectClick(project)}
                  disabled={isOptimistic || !canClickItem}
                  className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300 ${
                    !canClickItem ? "cursor-not-allowed opacity-60" : ""
                  } ${
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
                  <div
                    className={`h-1 bg-gradient-to-r ${isOptimistic ? "from-slate-400 to-slate-500" : statusConfig.bg}`}
                  />

                  <div className="p-4">
                    {/* ✅ Header: Title + Client Name */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-bold truncate mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                        >
                          {project.name}
                        </h3>
                        {project.client && (
                          <p
                            className={`text-[11px] truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            👤{" "}
                            {project.client.name_en || project.client.name_fa}
                          </p>
                        )}
                      </div>
                      <Badge
                        tone={statusConfig.color as any}
                        className="text-[9px] shrink-0 ml-2"
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </Badge>
                    </div>

                    {/* ✅ Service Types */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {project.service_types?.map((type) => (
                        <Badge
                          key={type}
                          tone={
                            INSPECTION_CATEGORY_CONFIG[
                              type as keyof typeof INSPECTION_CATEGORY_CONFIG
                            ]?.color as any
                          }
                          className="text-[9px]"
                        >
                          {
                            INSPECTION_CATEGORY_CONFIG[
                              type as keyof typeof INSPECTION_CATEGORY_CONFIG
                            ]?.icon
                          }{" "}
                          {type}
                        </Badge>
                      ))}
                      {isOptimistic && (
                        <Badge tone="indigo" className="text-[9px]">
                          ⏳ Saving...
                        </Badge>
                      )}
                    </div>

                    {/* ✅ Team Members Section */}
                    {(pm || coordinator || inspectors.length > 0) && (
                      <div
                        className={`space-y-1.5 mb-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                      >
                        <div
                          className={`text-[9px] uppercase font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}
                        >
                          Team
                        </div>

                        {pm && (
                          <div
                            className={`flex items-center gap-2 text-[11px] ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            <span className="text-[10px]">👔</span>
                            <span className="truncate">
                              <span
                                className={`font-semibold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                              >
                                Project Manager:
                              </span>{" "}
                              {pm.user?.full_name ||
                                pm.user?.username ||
                                "Unknown"}
                            </span>
                          </div>
                        )}

                        {coordinator && (
                          <div
                            className={`flex items-center gap-2 text-[11px] ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            <span className="text-[10px]">🤝</span>
                            <span className="truncate">
                              <span
                                className={`font-semibold ${isDark ? "text-violet-400" : "text-violet-600"}`}
                              >
                                Co-Ordinator:
                              </span>{" "}
                              {coordinator.user?.full_name ||
                                coordinator.user?.username ||
                                "Unknown"}
                            </span>
                          </div>
                        )}

                        {inspectors.length > 0 && (
                          <div
                            className={`flex items-center gap-2 text-[11px] ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            <span className="text-[10px]">🔍</span>
                            <span className="truncate">
                              <span
                                className={`font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                              >
                                {inspectors.length} Inspector
                                {inspectors.length > 1 ? "s" : ""}:
                              </span>{" "}
                              {inspectors
                                .slice(0, 2)
                                .map(
                                  (i) => i.user?.full_name || i.user?.username,
                                )
                                .join(", ")}
                              {inspectors.length > 2 &&
                                ` +${inspectors.length - 2}`}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stats Grid */}
                    {stats && !isOptimistic && (
                      <div
                        className={`grid grid-cols-3 gap-2 mt-3 pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                      >
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

                    {/* Progress */}
                    {stats && !isOptimistic && stats.total_inspections > 0 && (
                      <div
                        className={`mt-2 pt-2 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
                      >
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
                            className={`h-full bg-gradient-to-r ${progress >= 75 ? "from-emerald-500 to-green-600" : progress >= 50 ? "from-blue-500 to-indigo-600" : progress >= 25 ? "from-amber-500 to-orange-600" : "from-rose-500 to-red-600"} transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Footer: Dates */}
                    <div
                      className={`flex items-center justify-between text-[10px] pt-3 mt-3 border-t ${isDark ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}
                    >
                      <span>
                        📅 {project.start_date} → {project.end_date}
                      </span>
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
