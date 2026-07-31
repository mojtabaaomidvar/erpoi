// src/features/inspection-management/ui/InspectionList.tsx

import { useState, useMemo } from "react";
import { Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { InspectionElements } from "@shared/authorization/ui/elements/InspectionElements";
import { showToast } from "@shared/ui/ToastContainer";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import type {
  InspectionStatus,
  Priority,
} from "@/features/inspection-management/domain/types";
import type { TPIRequest } from "@/features/tpi-management";
import { INSPECTION_STATUS_CONFIG, PRIORITY_CONFIG } from "../constants";

type ViewMode = "kanban" | "calendar" | "list";

interface InspectionListProps {
  inspectionRequests: TPIRequest[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: InspectionStatus | "ALL";
  setFilterStatus: (status: InspectionStatus | "ALL") => void;
  filterPriority: Priority | "ALL";
  setFilterPriority: (priority: Priority | "ALL") => void;
  onRequestClick: (request: TPIRequest) => void;
  onAddClick: () => void;
  loading?: boolean;
}

export function InspectionList({
  inspectionRequests,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  onRequestClick,
  onAddClick,
  loading = false,
}: InspectionListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // ✅ استفاده از Registry به جای رشته‌های سخت‌کد شده
  const canViewItems = canAccessElement(
    InspectionElements.InspectionList.list_item_view.id,
  );
  const canClickItem = canAccessElement(
    InspectionElements.InspectionList.list_item_click.id,
  );
  const canSearch = canAccessElement(
    InspectionElements.InspectionList.search_box.id,
  );
  const canFilterPriority = canAccessElement(
    InspectionElements.InspectionList.filter_priority.id,
  );
  const canAdd = canAccessElement(InspectionElements.InspectionList.btn_add.id);

  // فیلتر و جستجو
  const filteredRequests = useMemo(() => {
    return inspectionRequests.filter((request) => {
      const matchesSearch =
        !searchQuery ||
        request.methods.some((m: string) =>
          m.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      const matchesStatus =
        filterStatus === "ALL" || request.status === filterStatus;
      const matchesPriority =
        filterPriority === "ALL" || request.priority === filterPriority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [inspectionRequests, searchQuery, filterStatus, filterPriority]);

  // گروه‌بندی بر اساس Status برای Kanban
  const groupedByStatus = useMemo(() => {
    const groups: Record<InspectionStatus, TPIRequest[]> = {
      NEW: [],
      INSPECTOR_ASSIGNED: [],
      IN_PROGRESS: [],
      INSPECTION_COMPLETED: [],
      REPORT_ISSUED: [],
      FOLLOW_UP: [],
      CLOSED: [],
      REJECTED: [],
      CANCELLED: [],
    };
    filteredRequests.forEach((r) => {
      if (groups[r.status]) groups[r.status].push(r);
    });
    return groups;
  }, [filteredRequests]);

  // KPI Stats
  const stats = useMemo(() => {
    const urgent = filteredRequests.filter(
      (r) => r.priority === "URGENT",
    ).length;
    const high = filteredRequests.filter((r) => r.priority === "HIGH").length;
    const open = filteredRequests.filter(
      (r) => r.status !== "CLOSED" && r.status !== "REJECTED",
    ).length;
    const completed = filteredRequests.filter(
      (r) => r.status === "CLOSED",
    ).length;
    return { urgent, high, open, completed, total: filteredRequests.length };
  }, [filteredRequests]);

  const handleRequestClick = (request: TPIRequest) => {
    if (!canClickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view inspection details",
      );
      return;
    }
    onRequestClick(request);
  };

  // Drag & Drop Handlers
  const handleDragStart = (requestId: string) => {
    setDraggedId(requestId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: InspectionStatus) => {
    if (!draggedId) return;
    showToast(
      "info",
      "Status Update",
      `Moved to ${INSPECTION_STATUS_CONFIG[status].label}`,
    );
    setDraggedId(null);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* HEADER SECTION */}
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
              🔍
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Inspection Command Center
              </h2>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Manage your inspection workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canSearch && (
              <FloatingSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search inspections..."
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
                <span>➕</span> New Request
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: "📋", color: "slate" },
            { label: "Open", value: stats.open, icon: "🔵", color: "blue" },
            {
              label: "Completed",
              value: stats.completed,
              icon: "✅",
              color: "emerald",
            },
            {
              label: "High Priority",
              value: stats.high,
              icon: "⚠️",
              color: "orange",
            },
            { label: "Urgent", value: stats.urgent, icon: "🚨", color: "rose" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl p-3 border transition-all hover:scale-105 ${
                isDark
                  ? "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                  : "bg-white/70 border-slate-200/70 hover:border-slate-300 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{stat.icon}</span>
                <span
                  className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  {stat.value}
                </span>
              </div>
              <div
                className={`text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VIEW SWITCHER & FILTERS */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between gap-4 ${
          isDark
            ? "border-slate-700/50 bg-slate-900/30"
            : "border-slate-200/70 bg-slate-50/50"
        }`}
      >
        {/* View Mode Tabs */}
        <div
          className={`flex gap-1 p-1 rounded-lg ${isDark ? "bg-slate-800/50" : "bg-white/70"}`}
        >
          {(["kanban", "calendar", "list"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === mode
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-500 text-white shadow-md"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>
                {mode === "kanban" ? "📊" : mode === "calendar" ? "📅" : "📋"}
              </span>
              <span className="capitalize">{mode}</span>
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        {canFilterPriority && (
          <div className="flex gap-1.5">
            {(["ALL", "LOW", "NORMAL", "HIGH", "URGENT"] as const).map(
              (priority) => (
                <button
                  key={priority}
                  onClick={() => setFilterPriority(priority)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    filterPriority === priority
                      ? isDark
                        ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700"
                        : "bg-indigo-100 text-indigo-700 border border-indigo-300"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800/50"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {priority === "ALL"
                    ? "All"
                    : `${PRIORITY_CONFIG[priority as Priority]?.icon} ${priority}`}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden min-h-0">
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
              You do not have permission to view inspections.
            </p>
          </div>
        ) : viewMode === "kanban" ? (
          /* KANBAN VIEW */
          <div className="h-full overflow-x-auto p-4">
            <div className="flex gap-4 min-w-max h-full">
              {(Object.keys(groupedByStatus) as InspectionStatus[]).map(
                (status) => {
                  const config = INSPECTION_STATUS_CONFIG[status];
                  const items = groupedByStatus[status];
                  const isRejected = status === "REJECTED";

                  return (
                    <div
                      key={status}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(status)}
                      className={`w-72 flex flex-col rounded-2xl border transition-all ${
                        isDark
                          ? "bg-slate-900/50 border-slate-700/50"
                          : "bg-slate-50/50 border-slate-200/70"
                      } ${draggedId ? "ring-2 ring-indigo-500/30" : ""}`}
                    >
                      {/* Column Header */}
                      <div
                        className={`px-4 py-3 border-b ${
                          isDark ? "border-slate-700/50" : "border-slate-200/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{config.icon}</span>
                            <h3
                              className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}
                            >
                              {config.label}
                            </h3>
                          </div>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              isDark
                                ? "bg-slate-800 text-slate-300"
                                : "bg-white text-slate-700 shadow-sm"
                            }`}
                          >
                            {items.length}
                          </span>
                        </div>
                        <div
                          className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
                        >
                          <div
                            className={`h-full rounded-full transition-all ${
                              isRejected ? "bg-rose-500" : "bg-indigo-500"
                            }`}
                            style={{
                              width: `${(items.length / Math.max(filteredRequests.length, 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {items.length === 0 ? (
                          <div
                            className={`text-center py-8 text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}
                          >
                            <div className="text-2xl mb-1">📭</div>
                            No items
                          </div>
                        ) : (
                          items.map((request) => {
                            const priorityConfig =
                              PRIORITY_CONFIG[request.priority];
                            const isUrgent = request.priority === "URGENT";

                            return (
                              <div
                                key={request.id}
                                draggable
                                onDragStart={() => handleDragStart(request.id)}
                                onClick={() => handleRequestClick(request)}
                                className={`group relative rounded-xl p-3 border-l-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                                  isDark
                                    ? "bg-slate-800/70 hover:bg-slate-800"
                                    : "bg-white hover:bg-slate-50 shadow-sm"
                                } ${
                                  request.priority === "URGENT"
                                    ? "border-l-rose-500"
                                    : request.priority === "HIGH"
                                      ? "border-l-orange-500"
                                      : request.priority === "NORMAL"
                                        ? "border-l-blue-500"
                                        : "border-l-slate-400"
                                } ${draggedId === request.id ? "opacity-50" : ""}`}
                              >
                                {isUrgent && (
                                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                )}

                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span
                                    className={`text-[10px] font-mono truncate ${isDark ? "text-slate-500" : "text-slate-500"}`}
                                  >
                                    {request.id.slice(-8)}
                                  </span>
                                  <Badge
                                    tone={priorityConfig.color as any}
                                    className="text-[9px] px-1.5"
                                  >
                                    {priorityConfig.icon}
                                  </Badge>
                                </div>

                                <h4
                                  className={`text-xs font-semibold mb-1 line-clamp-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                                >
                                  {request.methods}
                                </h4>

                                <div
                                  className={`flex items-center gap-1 text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                                >
                                  <span></span>
                                  <span>
                                    {new Date(
                                      request.inspection_date,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                {request.notes && (
                                  <p
                                    className={`text-[10px] mt-1 line-clamp-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                                  >
                                    {request.notes}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ) : viewMode === "list" ? (
          /* LIST VIEW */
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredRequests.map((request) => {
                const statusConfig = INSPECTION_STATUS_CONFIG[request.status];
                const priorityConfig = PRIORITY_CONFIG[request.priority];

                return (
                  <button
                    key={request.id}
                    onClick={() => handleRequestClick(request)}
                    disabled={!canClickItem}
                    className={`group w-full text-left rounded-xl p-4 border transition-all hover:shadow-md flex items-center gap-4 ${
                      !canClickItem
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    } ${
                      isDark
                        ? "bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60"
                        : "bg-white border-slate-200/70 hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`w-1 h-12 rounded-full ${
                        request.priority === "URGENT"
                          ? "bg-rose-500"
                          : request.priority === "HIGH"
                            ? "bg-orange-500"
                            : request.priority === "NORMAL"
                              ? "bg-blue-500"
                              : "bg-slate-400"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-500"}`}
                        >
                          {request.id}
                        </span>
                        <Badge
                          tone={statusConfig.color as any}
                          className="text-[9px]"
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </Badge>
                        <Badge
                          tone={priorityConfig.color as any}
                          className="text-[9px]"
                        >
                          {priorityConfig.icon} {priorityConfig.label}
                        </Badge>
                      </div>
                      <h3
                        className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {request.methods}
                      </h3>
                      {request.notes && (
                        <p
                          className={`text-[11px] truncate mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {request.notes}
                        </p>
                      )}
                    </div>

                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      📅{" "}
                      {new Date(request.inspection_date).toLocaleDateString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* CALENDAR VIEW (Placeholder) */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              📅
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Calendar View
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
