// src/features/inspector-managment/ui/InspectorList.tsx

import { useMemo } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Inspector, InspectorType, InspectorStatus } from "@/types/inspector";

const STATUS_COLORS: Record<InspectorStatus, "emerald" | "amber" | "slate" | "danger"> = {
  AVAILABLE: "emerald",
  ON_MISSION: "amber",
  ON_LEAVE: "slate",
  INACTIVE: "danger",
};

const STATUS_LABELS: Record<InspectorStatus, string> = {
  AVAILABLE: "Available",
  ON_MISSION: "On Mission",
  ON_LEAVE: "On Leave",
  INACTIVE: "Inactive",
};

interface InspectorListProps {
  inspectors: Inspector[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: InspectorType | "ALL";
  setFilterType: (filter: InspectorType | "ALL") => void;
  filterStatus: InspectorStatus | "ALL";
  setFilterStatus: (filter: InspectorStatus | "ALL") => void;
  onInspectorClick: (inspector: Inspector) => void;
  onAddClick: () => void;
  canClickItem: boolean;
  canSearch: boolean;
  canFilter: boolean;
  canAdd: boolean;
  loading?: boolean;
}

// ═══════════════════════════════════════
// 🔹 StatCard Component
// ═══════════════════════════════════════

function StatCard({
  title,
  value,
  icon,
  isDark,
  highlight = false,
}: {
  title: string;
  value: number;
  icon: string;
  isDark: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-xl border flex items-center gap-3 ${
        highlight
          ? isDark
            ? "bg-emerald-900/20 border-emerald-700"
            : "bg-emerald-50 border-emerald-200"
          : isDark
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white border-slate-200"
      }`}
    >
      <div className={`text-2xl p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
        {icon}
      </div>
      <div>
        <div className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          {value}
        </div>
        <div className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {title}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 🔹 InspectorRow Component
// ═══════════════════════════════════════

function InspectorRow({
  inspector,
  isDark,
  onClick,
  canClick,
}: {
  inspector: Inspector;
  isDark: boolean;
  onClick: () => void;
  canClick: boolean;
}) {
  return (
    <div
      className={`px-4 py-3 flex items-center justify-between transition-colors ${
        canClick
          ? "hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
          : "cursor-not-allowed opacity-60"
      }`}
      onClick={canClick ? onClick : undefined}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
            isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {inspector.name_en
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              {inspector.name_en}
            </h3>
            <Badge
              tone={inspector.inspector_type === "ICS_MEMBER" ? "indigo" : "amber"}
              className="text-[9px]"
            >
              {inspector.inspector_type === "ICS_MEMBER" ? "ICS" : "FL"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              📞 {inspector.phone || "N/A"}
            </span>
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>•</span>
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              ⭐ {inspector.rating.toFixed(1)}
            </span>
            {inspector.resume_url && (
              <>
                <span className={isDark ? "text-slate-500" : "text-slate-400"}>•</span>
                <span className="text-[10px]">📎</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Badge tone={STATUS_COLORS[inspector.status]} className="text-[10px]">
        {STATUS_LABELS[inspector.status]}
      </Badge>
    </div>
  );
}

// ═══════════════════════════════════════
// 🔹 Main Component
// ═══════════════════════════════════════

export function InspectorList({
  inspectors,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onInspectorClick,
  onAddClick,
  canClickItem,
  canSearch,
  canFilter,
  canAdd,
  loading = false,
}: InspectorListProps) {
  const { isDark } = useTheme();

  // 🔧 محاسبات فیلتر و آمار
  const filteredInspectors = useMemo(() => {
    return inspectors.filter((insp) => {
      const matchType = filterType === "ALL" || insp.inspector_type === filterType;
      const matchStatus = filterStatus === "ALL" || insp.status === filterStatus;
      const matchSearch =
        insp.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (insp.name_fa && insp.name_fa.includes(searchQuery)) ||
        insp.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchType && matchStatus && matchSearch;
    });
  }, [inspectors, filterType, filterStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: inspectors.length,
      ics_member: inspectors.filter((i) => i.inspector_type === "ICS_MEMBER").length,
      freelance: inspectors.filter((i) => i.inspector_type === "FREELANCE").length,
      available: inspectors.filter((i) => i.status === "AVAILABLE").length,
    }),
    [inspectors],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] p-4 gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} icon="👥" isDark={isDark} />
        <StatCard title="ICS Members" value={stats.ics_member} icon="🏢" isDark={isDark} />
        <StatCard title="Freelance" value={stats.freelance} icon="🎒" isDark={isDark} />
        <StatCard title="Available" value={stats.available} icon="✅" isDark={isDark} highlight />
      </div>

      {/* Toolbar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
          isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex gap-2">
          {canSearch && (
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            />
          )}
        </div>

        <div className="flex gap-2">
          {canFilter && (
            <>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className={`px-3 py-2 rounded-lg text-sm border outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="ALL">All Types</option>
                <option value="ICS_MEMBER">ICS Member</option>
                <option value="FREELANCE">Freelance</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className={`px-3 py-2 rounded-lg text-sm border outline-none ${
                  isDark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ON_MISSION">On Mission</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </>
          )}

          {canAdd && (
            <Button variant="primary" onClick={onAddClick}>
              ➕ Add Inspector
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        className={`flex-1 overflow-y-auto rounded-xl border ${
          isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>
        ) : filteredInspectors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="text-4xl mb-2">🔍</span>
            <p>No inspectors found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredInspectors.map((insp) => (
              <InspectorRow
                key={insp.id}
                inspector={insp}
                isDark={isDark}
                onClick={() => onInspectorClick(insp)}
                canClick={canClickItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}