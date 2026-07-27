// src/features/tpi-management/ui/TPIList.tsx
import { useState, useEffect, useMemo } from "react";
import { Badge, Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import { INSPECTION_STATUS_CONFIG } from "@/features/inspection-management/constants";
import { projectAppService } from "@/features/project-management";
import { vendorAppService } from "@/features/tpi-management/application/VendorApplicationService";
import type { TPIRequest, TPIMode } from "../domain/types";
import type { Project } from "@/features/project-management/domain/types";
import type { Vendor } from "@/features/tpi-management/domain/types";

interface TPIListProps {
  tpiRequests: TPIRequest[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterMode: TPIMode | "ALL";
  setFilterMode: (mode: TPIMode | "ALL") => void;
  onRequestClick: (request: TPIRequest) => void;
  onAddClick: () => void;
  loading?: boolean;
}

const formatArrayField = (value: any): string => {
  if (!value) return "—";

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed.join(", ") : "—";
      }
      return parsed;
    } catch {
      return value;
    }
  }

  return String(value);
};

const formatJalaliDate = (dateString: string): string => {
  if (!dateString) return "—";

  const jalaliRegex = /^\d{4}[/\-]\d{1,2}[/\-]\d{1,2}$/;
  if (jalaliRegex.test(dateString)) {
    const normalized = dateString.replace(/-/g, "/");
    const parts = normalized.split("/");
    if (parts.length === 3) {
      const year = parts[0].padStart(4, "0");
      const month = parts[1].padStart(2, "0");
      const day = parts[2].padStart(2, "0");
      return `${year}/${month}/${day}`;
    }
    return normalized;
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const jalaliDate = date.toLocaleDateString("en-US-u-ca-persian-nu-latn", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = jalaliDate.split("/");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[0]}/${parts[1]}`;
    }

    return jalaliDate;
  } catch {
    return dateString;
  }
};

export function TPIList({
  tpiRequests,
  searchQuery,
  setSearchQuery,
  filterMode,
  setFilterMode,
  onRequestClick,
  onAddClick,
  loading = false,
}: TPIListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const canViewList = canAccessElement("tpi_list_item_view");
  const canAdd = canAccessElement("tpi_btn_add");
  const canSearch = canAccessElement("tpi_search_box");

  // ✅ بارگذاری پروژه‌ها و وندورها
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, vendorsData] = await Promise.all([
          projectAppService.getAllProjects(),
          vendorAppService.getAll(),
        ]);
        setProjects(projectsData);
        setVendors(vendorsData);
      } catch (err) {
        console.error("Failed to load projects or vendors", err);
      }
    };
    loadData();
  }, []);

  const filteredRequests = useMemo(() => {
    return tpiRequests.filter((request) => {
      const methodsStr = formatArrayField(request.methods).toLowerCase();
      const disciplinesStr = formatArrayField(
        request.disciplines,
      ).toLowerCase();
      const idStr = (request.id || "").toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        methodsStr.includes(searchLower) ||
        disciplinesStr.includes(searchLower) ||
        idStr.includes(searchLower);

      const matchesMode =
        filterMode === "ALL" || request.tpi_mode === filterMode;
      return matchesSearch && matchesMode;
    });
  }, [tpiRequests, searchQuery, filterMode]);

  const stats = useMemo(() => {
    const spot = filteredRequests.filter((r) => r.tpi_mode === "SPOT").length;
    const resident = filteredRequests.filter(
      (r) => r.tpi_mode === "RESIDENT",
    ).length;
    const pending = filteredRequests.filter(
      (r) => r.status === "NEW" || r.status === "INSPECTOR_ASSIGNED",
    ).length;
    const completed = filteredRequests.filter(
      (r) =>
        r.status === "INSPECTION_COMPLETED" ||
        r.status === "REPORT_ISSUED" ||
        r.status === "CLOSED",
    ).length;

    return {
      spot,
      resident,
      pending,
      completed,
      total: filteredRequests.length,
    };
  }, [filteredRequests]);

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
          You do not have permission to view TPI requests.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header & Stats */}
      <div
        className={`relative px-6 py-4 border-b ${isDark ? "border-slate-700/50 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900" : "border-slate-200/70 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isDark ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/20"}`}
            >
              🏭
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                TPI Requests
              </h2>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                Third Party Inspection Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canSearch && (
              <FloatingSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search TPI requests..."
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
                <span>➕</span> New TPI Request
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: "📋", color: "slate" },
            { label: "Spot", value: stats.spot, icon: "📍", color: "indigo" },
            {
              label: "Resident",
              value: stats.resident,
              icon: "🏢",
              color: "emerald",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: "⏳",
              color: "amber",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: "✅",
              color: "emerald",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl p-3 border transition-all hover:scale-105 ${isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-slate-600" : "bg-white/70 border-slate-200/70 hover:border-slate-300 shadow-sm"}`}
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

      {/* Filters */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between gap-4 ${isDark ? "border-slate-700/50 bg-slate-900/30" : "border-slate-200/70 bg-slate-50/50"}`}
      >
        <div className="flex gap-1.5">
          {(["ALL", "SPOT", "RESIDENT"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                filterMode === mode
                  ? isDark
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-indigo-500 text-white shadow-md"
                  : isDark
                    ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {mode === "ALL"
                ? "📊 All"
                : mode === "SPOT"
                  ? "📍 Spot"
                  : "🏢 Resident"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-4xl mb-2 animate-pulse">⏳</div>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Loading TPI requests...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            >
              🏭
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No TPI requests found
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Create your first TPI request to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRequests.map((request) => {
              const isSpot = request.tpi_mode === "SPOT";

              // ✅ دریافت کانفیگ وضعیت
              const statusConfig = (INSPECTION_STATUS_CONFIG as any)[
                request.status
              ] ?? {
                label: request.status || "Unknown",
                labelFa: "نامشخص",
                color: "slate",
                icon: "❓",
              };

              const project = projects.find((p) => p.id === request.project_id);
              const projectName = project?.name || "Unknown Project";

              const vendor = vendors.find((v) => v.id === request.vendor_id);
              const vendorName = vendor?.name || "No Vendor";

              const firstStage =
                Array.isArray(request.stages) && request.stages.length > 0
                  ? request.stages[0]
                  : "No Stage";

              const inspectionTitle = `${projectName} - ${vendorName} - ${firstStage}`;

              return (
                <button
                  key={request.id}
                  onClick={() => onRequestClick(request)}
                  className={`group relative text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer ${
                    isDark
                      ? "bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-indigo-500/10"
                      : "bg-white border border-slate-200/70 hover:border-indigo-300 hover:shadow-indigo-500/10"
                  }`}
                >
                  <div
                    className={`h-1 bg-gradient-to-r ${isSpot ? "from-indigo-500 to-violet-600" : "from-emerald-500 to-green-600"}`}
                  />

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        {/* ✅ عنوان بازرسی */}
                        <h3
                          className={`text-sm font-bold truncate mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          title={inspectionTitle}
                        >
                          {inspectionTitle}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            tone={statusConfig.color as any}
                            className="text-[9px] font-medium"
                          >
                            {statusConfig.icon} {statusConfig.labelFa}
                          </Badge>
                          <Badge
                            tone={isSpot ? "indigo" : "emerald"}
                            className="text-[9px]"
                          >
                            {isSpot ? "📍 Spot" : "🏢 Resident"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"} space-y-1.5`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 mt-0.5"></span>
                        <span>{formatJalaliDate(request.inspection_date)}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">🎯</span>
                        <span
                          className="truncate"
                          title={formatArrayField(request.disciplines)}
                        >
                          {formatArrayField(request.disciplines)}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="shrink-0 mt-0.5">🔧</span>
                        <span
                          className="truncate text-[10px] opacity-80"
                          title={formatArrayField(request.methods)}
                        >
                          {formatArrayField(request.methods)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
