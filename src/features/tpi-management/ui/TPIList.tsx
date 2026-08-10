// src/features/tpi-management/ui/TPIList.tsx
import { useState, useEffect, useMemo } from "react";
import { Badge, Button } from "@design-system";
import { Clock3, LockKeyhole } from "lucide-react";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import { INSPECTION_STATUS_CONFIG } from "@/features/inspection-management/constants";
import type { TPIRequest, TPIMode } from "../domain/types";
import { projectAppService } from "@/features/project-management";
import type { Project } from "@/features/project-management/domain/types";
import { vendorAppService } from "@/features/tpi-management/application/VendorApplicationService";
import type { Vendor } from "@/features/tpi-management/domain/types";
import { clientAppService } from "@/features/client-management/application";
import type { Client } from "@/features/client-management/domain/models/Client";
import { formatJalaliDate } from "@/shared/utils/dateUtils";
import {
  formatArrayField,
  formatArrayWithLimit,
} from "@/shared/utils/formatUtils";

// ==========================================
// Sub-Component: TPI Request Card
// ==========================================
interface TPIRequestCardProps {
  request: TPIRequest;
  clientName: string;
  projectName: string;
  vendorName: string;
  isDeletionPending: boolean;
  onClick: (request: TPIRequest) => void;
}

function TPIRequestCard({
  request,
  clientName,
  projectName,
  vendorName,
  isDeletionPending,
  onClick,
}: TPIRequestCardProps) {
  const { isDark } = useTheme();
  const isSpot = request.tpi_mode === "SPOT";

  // Safe type access for status config
  const statusConfig = (INSPECTION_STATUS_CONFIG as Record<string, any>)[
    request.status
  ] ?? {
    labelFa: request.status || "Unknown",
    color: "slate",
    icon: "❓",
  };

  const firstStage =
    Array.isArray(request.stages) && request.stages.length > 0
      ? request.stages[0]
      : "No Stage";
  const inspectionTitle = `${clientName} - ${projectName} - ${vendorName} - ${firstStage}`;

  return (
    <button
      onClick={() => onClick(request)}
      aria-label={
        isDeletionPending
          ? `${inspectionTitle}. Deletion request pending; package locked.`
          : inspectionTitle
      }
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
            <h3
              className={`text-sm font-bold truncate mb-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              title={inspectionTitle}
            >
              {inspectionTitle}
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {isDeletionPending && (
                <Badge tone="amber" className="text-[9px] font-medium">
                  <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                  Deletion Pending
                </Badge>
              )}
              <Badge
                tone={statusConfig.color}
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
            <span className="shrink-0 mt-0.5">📅</span>
            <span>{formatJalaliDate(request.inspection_date)}</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">🎯</span>
            <span
              className="truncate"
              title={formatArrayField(request.disciplines)}
            >
              {formatArrayWithLimit(request.disciplines, 2)}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5">🔧</span>
            <span
              className="truncate text-[10px] opacity-80"
              title={formatArrayField(request.methods)}
            >
              {formatArrayWithLimit(request.methods, 2)}
            </span>
          </div>

          {isDeletionPending && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-[10px] font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Locked pending manager decision
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ==========================================
// Sub-Component: Skeleton Card for List
// ==========================================
function TPIRequestCardSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden border animate-pulse ${
        isDark
          ? "bg-slate-800/50 border-slate-700/50"
          : "bg-white border-slate-200/70"
      }`}
    >
      <div className={`h-1 ${isDark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className="p-4 space-y-3">
        {/* Title Placeholder */}
        <div
          className={`h-5 rounded w-3/4 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
        {/* Badges Placeholder */}
        <div className="flex gap-2">
          <div
            className={`h-4 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
          <div
            className={`h-4 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
        </div>
        {/* Info Rows Placeholder */}
        <div className="space-y-2 pt-2">
          <div
            className={`h-3 rounded w-1/2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
          <div
            className={`h-3 rounded w-2/3 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
          <div
            className={`h-3 rounded w-1/3 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main Component: TPI List
// ==========================================
interface TPIListProps {
  tpiRequests: TPIRequest[];
  pendingDeletionPackageIds: ReadonlySet<string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterMode: TPIMode | "ALL";
  setFilterMode: (mode: TPIMode | "ALL") => void;
  onRequestClick: (request: TPIRequest) => void;
  onAddClick: () => void;
  loading?: boolean;
}

export function TPIList({
  tpiRequests,
  pendingDeletionPackageIds,
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

  const canViewList = canAccessElement("tpi_list_item_view");
  const canAdd = canAccessElement("tpi_btn_add");
  const canSearch = canAccessElement("tpi_search_box");

  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [isRefDataLoading, setIsRefDataLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsRefDataLoading(true);
      try {
        const [projectsData, vendorsData, clientsData] = await Promise.all([
          projectAppService.getAllProjects(),
          vendorAppService.getAll(),
          clientAppService.getAll(),
        ]);
        setProjects(projectsData);
        setVendors(vendorsData);
        setClients(clientsData);
      } catch (err) {
        console.error("Failed to load reference data", err);
      } finally {
        setIsRefDataLoading(false);
      }
    };
    loadData();
  }, []);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) =>
      map.set(c.id, c.name_en || c.name_fa || "Unknown Client"),
    );
    return map;
  }, [clients]);

  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((p) => map.set(p.id, p.name || "Unknown Project"));
    return map;
  }, [projects]);

  const vendorMap = useMemo(() => {
    const map = new Map<string, string>();
    vendors.forEach((v) => map.set(v.id, v.name || "No Vendor"));
    return map;
  }, [vendors]);

  const filteredRequests = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return tpiRequests.filter((request) => {
      const matchesSearch =
        !searchQuery ||
        formatArrayField(request.methods).toLowerCase().includes(searchLower) ||
        formatArrayField(request.disciplines)
          .toLowerCase()
          .includes(searchLower) ||
        (request.id || "").toLowerCase().includes(searchLower);

      const matchesMode =
        filterMode === "ALL" || request.tpi_mode === filterMode;
      return matchesSearch && matchesMode;
    });
  }, [tpiRequests, searchQuery, filterMode]);

  const stats = useMemo(() => {
    return filteredRequests.reduce(
      (acc, r) => {
        acc.total++;
        if (r.tpi_mode === "SPOT") acc.spot++;
        else if (r.tpi_mode === "RESIDENT") acc.resident++;

        if (r.status === "NEW" || r.status === "INSPECTOR_ASSIGNED")
          acc.pending++;
        else if (
          ["INSPECTION_COMPLETED", "REPORT_ISSUED", "CLOSED"].includes(r.status)
        )
          acc.completed++;

        return acc;
      },
      { spot: 0, resident: 0, pending: 0, completed: 0, total: 0 },
    );
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
        {loading || isRefDataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <TPIRequestCardSkeleton key={i} isDark={isDark} />
            ))}
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
            {filteredRequests.map((request) => (
              <TPIRequestCard
                key={request.id}
                request={request}
                clientName={
                  clientMap.get(request.client_id) || "Unknown Client"
                }
                projectName={
                  projectMap.get(request.project_id) || "Unknown Project"
                }
                vendorName={
                  request.vendor_id
                    ? vendorMap.get(request.vendor_id) || "No Vendor"
                    : "No Vendor"
                }
                isDeletionPending={pendingDeletionPackageIds.has(request.id)}
                onClick={onRequestClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
