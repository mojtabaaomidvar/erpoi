// src/features/inspector-managment/ui/InspectorList.tsx
import { useMemo } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Inspector, InspectorType, InspectorStatus } from "../domain";
import type { Inspection } from "@/features/inspection-management/domain/types";
import { InspectorElements } from "@shared/authorization/ui/elements/InspectorElements";
import { usePermissionMapping } from "@/shared/authorization";

const STATUS_COLORS: Record<
  InspectorStatus,
  "emerald" | "amber" | "slate" | "danger"
> = {
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
  filteredInspectors: Inspector[];
  stats: {
    total: number;
    ics_member: number;
    freelance: number;
    available: number;
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: InspectorType | "ALL";
  setFilterType: (filter: InspectorType | "ALL") => void;
  filterStatus: InspectorStatus | "ALL";
  setFilterStatus: (filter: InspectorStatus | "ALL") => void;
  onInspectorClick: (inspector: Inspector) => void;
  onAddClick: () => void;
  loading?: boolean;
  // ✅ Prop جدید: برنامه‌های آینده بازرس‌ها (کلید: inspector_id)
  upcomingAssignments?: Record<string, Inspection[]>;
}

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
      className={`p-3 rounded-xl border flex items-center gap-3 ${highlight ? (isDark ? "bg-emerald-900/20 border-emerald-700" : "bg-emerald-50 border-emerald-200") : isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
    >
      <div
        className={`text-2xl p-2 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
      >
        {icon}
      </div>
      <div>
        <div
          className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          {value}
        </div>
        <div
          className={`text-[10px] font-medium uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

// ✅ کامپوننت کمکی برای نمایش نشانگر برنامه‌های آینده
function UpcomingAssignmentsBadge({
  assignments,
  isDark,
}: {
  assignments: Inspection[];
  isDark: boolean;
}) {
  // مرتب‌سازی بر اساس تاریخ (زودترین ابتدا)
  const sorted = [...assignments].sort((a, b) => {
    if (!a.execution_date) return 1;
    if (!b.execution_date) return -1;
    return a.execution_date.localeCompare(b.execution_date);
  });

  const visible = sorted.slice(0, 2);
  const remaining = sorted.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {visible.map((assignment, idx) => (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isDark
              ? "bg-indigo-900/30 text-indigo-300 border border-indigo-800/50"
              : "bg-indigo-50 text-indigo-700 border border-indigo-200"
          }`}
          title={
            assignment.location ? `📍 ${assignment.location}` : "Inspection"
          }
        >
          📅{" "}
          {new Date(assignment.execution_date!).toLocaleDateString(
            "fa-IR-u-nu-latn",
          )}
        </span>
      ))}
      {remaining > 0 && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isDark
              ? "bg-slate-700 text-slate-300"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}

function InspectorRow({
  inspector,
  isDark,
  onClick,
  canClick,
  upcomingAssignments,
}: {
  inspector: Inspector;
  isDark: boolean;
  onClick: () => void;
  canClick: boolean;
  upcomingAssignments?: Inspection[];
}) {
  const hasUpcoming = upcomingAssignments && upcomingAssignments.length > 0;

  return (
    <div
      className={`px-4 py-3 flex items-center justify-between transition-colors ${canClick ? "hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer" : "cursor-not-allowed opacity-60"}`}
      onClick={canClick ? onClick : undefined}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
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
            <h3
              className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {inspector.name_en}
            </h3>
            <Badge
              tone={
                inspector.inspector_type === "ICS_MEMBER" ? "indigo" : "amber"
              }
              className="text-[9px]"
            >
              {inspector.inspector_type === "ICS_MEMBER"
                ? "ICS Member"
                : "Freelancer"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[11px] flex-wrap">
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              📞 {inspector.phone || "N/A"}
            </span>
            <span className={isDark ? "text-slate-500" : "text-slate-400"}>
              •
            </span>
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              ⭐ {inspector.rating.toFixed(1)}
            </span>
            {inspector.specialties && inspector.specialties.length > 0 && (
              <>
                <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                  •
                </span>
                <span
                  className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  🎯 {inspector.specialties.slice(0, 2).join(", ")}
                  {inspector.specialties.length > 2 &&
                    ` +${inspector.specialties.length - 2}`}
                </span>
              </>
            )}
            {inspector.resume_url && (
              <>
                <span className={isDark ? "text-slate-500" : "text-slate-400"}>
                  •
                </span>
                <span className="text-[10px]">📎</span>
              </>
            )}
          </div>
          {/* ✅ نمایش نشانگر برنامه‌های آینده */}
          {hasUpcoming && (
            <UpcomingAssignmentsBadge
              assignments={upcomingAssignments!}
              isDark={isDark}
            />
          )}
        </div>
      </div>
      {hasUpcoming && (
        <Badge tone="indigo" className="text-[9px]">
          📋 {upcomingAssignments.length} scheduled
        </Badge>
      )}
      {!hasUpcoming && inspector.status === "AVAILABLE" && (
        <Badge
          tone="emerald"
          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium"
        >
          ✅ Free
        </Badge>
      )}
      <Badge
        tone={STATUS_COLORS[inspector.status]}
        className="text-[10px] shrink-0 ml-2"
      >
        {STATUS_LABELS[inspector.status]}
      </Badge>
    </div>
  );
}

export function InspectorList({
  inspectors,
  filteredInspectors,
  stats,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onInspectorClick,
  onAddClick,
  loading = false,
  upcomingAssignments = {}, // ✅ مقدار پیش‌فرض خالی
}: InspectorListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();
  const canSearch = canAccessElement(
    InspectorElements.InspectorList.search_box.id,
  );
  const canFilter = canAccessElement(
    InspectorElements.InspectorList.filter_type.id,
  );
  const canAdd = canAccessElement(InspectorElements.InspectorList.btn_add.id);
  const canClickItem = canAccessElement(
    InspectorElements.InspectorList.list_item_click.id,
  );

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] p-4 gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.total} icon="👥" isDark={isDark} />
        <StatCard
          title="ICS Members"
          value={stats.ics_member}
          icon="🏢"
          isDark={isDark}
        />
        <StatCard
          title="Freelance"
          value={stats.freelance}
          icon="🎒"
          isDark={isDark}
        />
        <StatCard
          title="Available"
          value={stats.available}
          icon="✅"
          isDark={isDark}
          highlight
        />
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"}`}
      >
        <div className="flex gap-2">
          {canSearch && (
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"}`}
            />
          )}
        </div>
        <div className="flex gap-2">
          {canFilter && (
            <>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className={`px-3 py-2 rounded-lg text-sm border outline-none ${isDark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"}`}
              >
                <option value="ALL">All Types</option>
                <option value="ICS_MEMBER">ICS Member</option>
                <option value="FREELANCE">Freelance</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className={`px-3 py-2 rounded-lg text-sm border outline-none ${isDark ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"}`}
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

      <div
        className={`flex-1 overflow-y-auto rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"}`}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Loading...
          </div>
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
                upcomingAssignments={upcomingAssignments[insp.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
