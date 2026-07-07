// src/features/contract-management/ui/ContractList.tsx

import { useMemo } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { showToast } from "@shared/ui/ToastContainer";
import type { Contract } from "@entities/contract/types";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateDaysProgress,
  calculateDaysLeft,
  getDaysUntilStart,
  getContractFinancialStatus,
  isExpiringSoon,
  getDaysProgressColor,
} from "@entities/contract/services/contractCalculations";

interface ContractListProps {
  contracts: Contract[];
  filteredContracts: Contract[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: "ALL" | "CONTRACT" | "WORK_ORDER";
  setTypeFilter: (type: "ALL" | "CONTRACT" | "WORK_ORDER") => void;
  statusFilter: "ALL" | "ACTIVE" | "NOT_STARTED" | "NEEDS_REVIEW" | "COMPLETED";
  setStatusFilter: (
    status: "ALL" | "ACTIVE" | "NOT_STARTED" | "NEEDS_REVIEW" | "COMPLETED",
  ) => void;
  sortBy: "date" | "value" | "status";
  setSortBy: (sort: "date" | "value" | "status") => void;
  selectedContract: Contract | null;
  setSelectedContract: (contract: Contract) => void;
  onAddClick: () => void;
  onExport: () => void;
  loading?: boolean;
}

// 🔧 Skeleton Component
function ContractSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`px-4 py-3 border-b animate-pulse ${isDark ? "border-slate-700" : "border-slate-100"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`h-5 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            />
            <div
              className={`h-4 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            />
          </div>
          <div
            className={`h-4 w-3/4 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
          <div
            className={`h-3 w-1/2 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
        </div>
        <div
          className={`h-5 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div
          className={`h-3 w-32 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
        <div
          className={`h-3 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
      </div>
      <div
        className={`mt-2 h-1.5 w-full rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
      />
    </div>
  );
}

export function ContractList({
  contracts,
  filteredContracts,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  selectedContract,
  setSelectedContract,
  onAddClick,
  onExport,
  loading = false,
}: ContractListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  // 🔐 Element-Level Access
  const canClickItem = canAccessElement("contract_list_item_click");
  const canSearch = canAccessElement("contract_search_box");
  const canSort = canAccessElement("contract_sort_select");
  const canFilterType = canAccessElement("contract_filter_type");
  const canFilterStatus = canAccessElement("contract_filter_status");
  const canStatusBadge = canAccessElement("contract_status_badge");
  const canListValue = canAccessElement("contract_list_value");
  const canProgressBar = canAccessElement("contract_progress_bar");
  const canContractDates = canAccessElement("contract_dates");
  const canAdd = canAccessElement("contract_btn_add");
  const canExport = canAccessElement("contract_btn_export");

  const handleContractClick = (contract: Contract) => {
    if (!canClickItem) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to view contract details",
      );
      return;
    }
    setSelectedContract(contract);
  };

  return (
    <div
      className={`col-span-1 lg:col-span-4 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl shadow-black/30"
          : "bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 border border-slate-200/70 shadow-xl shadow-slate-200/50"
      }`}
    >
      {/* Header با Gradient */}
      <div
        className={`relative px-5 py-4 border-b ${
          isDark
            ? "border-slate-700/50 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-violet-900/30"
            : "border-slate-200/70 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50"
        }`}
      >
        {/* Pattern Background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? "%23ffffff" : "%23000000"}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                isDark
                  ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20"
              }`}
            >
              📄
            </div>
            <div>
              <h2
                className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Agreements
              </h2>
            </div>
          </div>
          <div className="flex gap-1.5">
            {canExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExport}
                title="Export to Excel"
                className="transition-all hover:scale-105 shadow-md shadow-slate-700/50"
              >
                📊
              </Button>
            )}
            {canAdd && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onAddClick}
                title="Add Agreement"
                className="transition-all hover:scale-105 shadow-md shadow-slate-700/50"
              >
                ➕
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        {canSearch && (
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 ${
                isDark
                  ? "bg-slate-800/50 border border-slate-700/50 text-slate-100 placeholder-slate-500 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                  : "bg-white/70 border border-slate-200/70 text-slate-900 placeholder-slate-400 focus:ring-indigo-500/30 focus:border-indigo-300 shadow-sm"
              }`}
            />
          </div>
        )}
      </div>

      {/* Type Filter Tabs */}
      {canFilterType && (
        <div
          className={`px-4 py-2.5 border-b ${
            isDark
              ? "border-slate-700/50 bg-slate-900/30"
              : "border-slate-200/70 bg-slate-50/50"
          }`}
        >
          <div className="flex gap-1.5">
            {(["ALL", "CONTRACT", "WORK_ORDER"] as const).map((t) => {
              const count =
                t === "ALL"
                  ? contracts.length
                  : contracts.filter((c) => c.type === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    typeFilter === t
                      ? isDark
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
                      : isDark
                        ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                        : "bg-white/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                  }`}
                >
                  {t === "ALL"
                    ? `All (${count})`
                    : t === "CONTRACT"
                      ? `📄 Contracts (${count})`
                      : `📦 W/Orders (${count})`}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Filter Tabs */}
      {canFilterStatus && (
        <div
          className={`px-4 py-2 border-b ${
            isDark ? "border-slate-700/50" : "border-slate-200/70"
          }`}
        >
          <div className="flex gap-1.5">
            {(
              [
                "ALL",
                "ACTIVE",
                "NOT_STARTED",
                "NEEDS_REVIEW",
                "COMPLETED",
              ] as const
            ).map((t) => {
              const baseFiltered =
                typeFilter === "ALL"
                  ? contracts
                  : contracts.filter((c) => c.type === typeFilter);
              let count = 0;
              if (t === "ALL") count = baseFiltered.length;
              else
                count = baseFiltered.filter(
                  (c) =>
                    getContractFinancialStatus(c) ===
                    t.toLowerCase().replace("_", "_"),
                ).length;

              return (
                <button
                  key={t}
                  onClick={() => setStatusFilter(t)}
                  className={`flex-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                    statusFilter === t
                      ? isDark
                        ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isDark
                        ? "text-slate-400 hover:bg-slate-800/50"
                        : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t === "ALL"
                    ? "All"
                    : t === "ACTIVE"
                      ? "🟢"
                      : t === "NOT_STARTED"
                        ? "⏳"
                        : t === "NEEDS_REVIEW"
                          ? "⚠️"
                          : "✓"}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort */}
      {canSort && (
        <div
          className={`px-4 py-2 border-b ${
            isDark ? "border-slate-700/50" : "border-slate-200/70"
          }`}
        >
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={`w-full rounded-lg px-3 py-1.5 text-[11px] transition-all focus:ring-2 ${
              isDark
                ? "bg-slate-800/50 border border-slate-700/50 text-slate-300 focus:ring-indigo-500/50"
                : "bg-white/70 border border-slate-200/70 text-slate-700 focus:ring-indigo-500/30 shadow-sm"
            }`}
          >
            <option value="date">📅 Sort by Date</option>
            <option value="value">💰 Sort by Value</option>
            <option value="status">🏷️ Sort by Status</option>
          </select>
        </div>
      )}

      {/* Contract List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <ContractSkeleton isDark={isDark} />
            <ContractSkeleton isDark={isDark} />
            <ContractSkeleton isDark={isDark} />
            <ContractSkeleton isDark={isDark} />
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${
                isDark ? "bg-slate-800/50" : "bg-slate-100"
              }`}
            >
              📄
            </div>
            <p
              className={`text-sm font-medium mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No contracts found
            </p>
            <p
              className={`text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {filteredContracts.map((contract) => {
              const isSelected = selectedContract?.id === contract.id;
              const financialStatus = getContractFinancialStatus(contract);
              const expiringInfo = isExpiringSoon(contract);
              const daysProgress = calculateDaysProgress(contract);
              const daysLeft = calculateDaysLeft(contract.end_date);
              const isExpired = daysLeft < 0;

              return (
                <button
                  key={contract.id}
                  onClick={() => handleContractClick(contract)}
                  disabled={!canClickItem}
                  className={`group relative w-full text-left rounded-xl p-3 transition-all duration-200 ${
                    !canClickItem
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? isDark
                        ? "bg-gradient-to-r from-indigo-900/50 to-violet-900/50 border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                        : "bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-300/50 shadow-lg shadow-indigo-500/10"
                      : isDark
                        ? "bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50 hover:shadow-md"
                        : "bg-white/50 border border-transparent hover:bg-white hover:border-slate-200/70 hover:shadow-md"
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${
                        isDark ? "bg-indigo-500" : "bg-indigo-500"
                      }`}
                    />
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          tone={
                            contract.type === "CONTRACT" ? "indigo" : "amber"
                          }
                          className="text-[9px]"
                        >
                          {contract.type === "CONTRACT"
                            ? "📄 Contract"
                            : "📦 Work Order"}
                        </Badge>
                        <span
                          className={`font-mono text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {contract.contract_no}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                      >
                        {contract.contract_title}
                      </h3>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {contract.client_name}
                      </p>
                    </div>

                    {/* Status Badge */}
                    {canStatusBadge && (
                      <div className="shrink-0 ml-2">
                        {contract.status === "COMPLETED" ? (
                          <Badge tone="slate" className="text-[9px]">
                            ✓ Completed
                          </Badge>
                        ) : expiringInfo.expiring ? (
                          <Badge
                            tone="danger"
                            className="text-[9px] gap-1 animate-pulse"
                          >
                            <span>⚠️</span>
                            <span>Expiring</span>
                          </Badge>
                        ) : financialStatus === "not_started" ? (
                          <Badge tone="amber" className="text-[9px]">
                            ⏳ Not Started
                          </Badge>
                        ) : financialStatus === "needs_review" ? (
                          <Badge tone="amber" className="text-[9px]">
                            ⚠️ Review
                          </Badge>
                        ) : (
                          <Badge tone="emerald" className="text-[9px]">
                            🟢 Active
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dates & Value */}
                  <div className="flex items-center justify-between text-[11px]">
                    {canContractDates && (
                      <span
                        className={isDark ? "text-slate-400" : "text-slate-500"}
                      >
                        📅 {contract.start_date} → {contract.end_date}
                      </span>
                    )}
                    {canListValue && (
                      <span
                        className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                      >
                        {formatCurrency(
                          contract.total_value,
                          contract.currency,
                        )}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {canProgressBar && contract.status !== "COMPLETED" && (
                    <div className="mt-2">
                      <div
                        className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getDaysProgressColor(daysProgress)}`}
                          style={{ width: `${Math.min(daysProgress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span
                          className={
                            isDark ? "text-slate-500" : "text-slate-400"
                          }
                        >
                          Time Progress
                        </span>
                        <span
                          className={`font-semibold ${
                            isExpired
                              ? isDark
                                ? "text-rose-400"
                                : "text-rose-600"
                              : daysLeft <= 30
                                ? isDark
                                  ? "text-amber-400"
                                  : "text-amber-600"
                                : isDark
                                  ? "text-emerald-400"
                                  : "text-emerald-600"
                          }`}
                        >
                          {isExpired
                            ? `${Math.abs(daysLeft)} days overdue`
                            : daysLeft === 0
                              ? "Expires today"
                              : `${daysLeft} days left`}
                          <span
                            className={`ml-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            ({daysProgress.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Arrow Icon */}
                  <div
                    className={`absolute right-3 top-1/2 -translate-y-1/2 shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? isDark
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-indigo-500/20 text-indigo-600"
                        : isDark
                          ? "bg-slate-700/50 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300"
                          : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                    }`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div
        className={`px-4 py-2.5 border-t ${
          isDark
            ? "border-slate-700/50 bg-slate-900/50"
            : "border-slate-200/70 bg-slate-50/50"
        }`}
      >
        <div className="flex items-center justify-between text-[10px]">
          <span className={isDark ? "text-slate-400" : "text-slate-600"}>
            Showing {filteredContracts.length} of {contracts.length} contracts
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                Active
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className={isDark ? "text-slate-400" : "text-slate-600"}>
                Expiring
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
