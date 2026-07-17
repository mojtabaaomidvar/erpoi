// src/features/contract-management/ui/ContractList.tsx

import { useMemo } from "react";
import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { showToast } from "@shared/ui/ToastContainer";
import { FloatingSearch } from "@shared/ui/FloatingSearch";
import type { Contract } from "@entities/contract/types";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateDaysProgress,
  calculateDaysLeft,
  getContractFinancialStatus,
  isExpiringSoon,
  getDaysProgressColor,
} from "@entities/contract/services/contractCalculations";
import type { ActionPriority } from "../utils/contractPriority";

interface ContractListProps {
  contracts: Contract[];
  filteredContracts: Contract[];
  contractPriorities?: Map<string, ActionPriority>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: "ALL" | "CONTRACT" | "WORK_ORDER";
  setTypeFilter: (type: "ALL" | "CONTRACT" | "WORK_ORDER") => void;
  statusFilter: "ALL" | "ACTIVE" | "NOT_STARTED" | "NEEDS_REVIEW" | "COMPLETED";
  setStatusFilter: (
    status: "ALL" | "ACTIVE" | "NOT_STARTED" | "NEEDS_REVIEW" | "COMPLETED",
  ) => void;
  selectedContract: Contract | null;
  setSelectedContract: (contract: Contract) => void;
  onAddClick: () => void;
  onEditDraft?: (contract: Contract) => void;
  onExport: () => void;
  loading?: boolean;
}

export function ContractList({
  contracts,
  filteredContracts,
  contractPriorities,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  selectedContract,
  setSelectedContract,
  onAddClick,
  onEditDraft,
  onExport,
  loading = false,
}: ContractListProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  //  دسترسی
  const canViewItems = canAccessElement("contract_list_item_view");
  const canClickItem = canAccessElement("contract_list_item_click");
  const canSearch = canAccessElement("contract_search_box");
  const canFilterType = canAccessElement("contract_filter_type");
  const canFilterStatus = canAccessElement("contract_filter_status");
  const canStatusBadge = canAccessElement("contract_ status_badge");
  const canViewFinancial = canAccessElement("contract_list_value");
  const canDate = canAccessElement("contract_dates");
  const canProgressBar = canAccessElement("contract_progress_bar");
  const canAdd = canAccessElement("contract_btn_add");
  const canExport = canAccessElement("contract_btn_export");

  const sortedContracts = useMemo(() => {
    return filteredContracts;
  }, [filteredContracts]);

  // 🔐 هندلر کلیک: فقط در صورتی اجازه می‌دهد که canClickItem فعال باشد
  const handleContractClick = (contract: Contract) => {
    if (contract.status === "DRAFT") {
      if (onEditDraft) {
        onEditDraft(contract);
      } else {
        showToast(
          "warning",
          "Action Required",
          "Please use the edit option for drafts",
        );
      }
      return;
    }

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
      {/* Header */}
      <div
        className={`relative px-5 py-4 border-b ${
          isDark
            ? "border-slate-700/50 bg-gradient-to-r from-indigo-900/30 via-slate-900 to-violet-900/30"
            : "border-slate-200/70 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50"
        }`}
      >
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
              <p
                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {contracts.length} total
              </p>
            </div>
          </div>

          {/* 🔐 Conditional Buttons */}
          <div className="flex gap-1.5">
            {canSearch && (
              <FloatingSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search contracts..."
                icon="🔍"
              />
            )}
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
                title="Add Contract"
                className="transition-all hover:scale-105 shadow-md shadow-slate-700/50"
              >
                ➕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 🔐 Conditional Filter Tabs (Type) */}
      {canFilterType && (
        <div
          className={`px-4 py-2.5 border-b ${isDark ? "border-slate-700/50 bg-slate-900/30" : "border-slate-200/70 bg-slate-50/50"}`}
        >
          <div className="flex gap-1.5">
            {(["ALL", "CONTRACT", "WORK_ORDER"] as const).map((t) => {
              const count =
                t === "ALL"
                  ? contracts.length
                  : t === "CONTRACT"
                    ? contracts.filter((c) => c.type === "CONTRACT").length
                    : contracts.filter((c) => c.type === "WORK_ORDER").length;

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

      {/* 🔐 Conditional Filter Tabs (Status) */}
      {canFilterStatus && (
        <div
          className={`px-4 py-2 border-b ${isDark ? "border-slate-700/50" : "border-slate-200/70"}`}
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
              else if (t === "ACTIVE")
                count = baseFiltered.filter(
                  (c) => getContractFinancialStatus(c) === "active",
                ).length;
              else if (t === "NOT_STARTED")
                count = baseFiltered.filter(
                  (c) => getContractFinancialStatus(c) === "not_started",
                ).length;
              else if (t === "NEEDS_REVIEW")
                count = baseFiltered.filter(
                  (c) => getContractFinancialStatus(c) === "needs_review",
                ).length;
              else if (t === "COMPLETED")
                count = baseFiltered.filter(
                  (c) => getContractFinancialStatus(c) === "completed",
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

      {/* Contract List Content */}
      <div className="flex-1 overflow-y-auto">
        {/* 🔐 ۳. اگر دسترسی View نداشت، پیام Access Denied نشان بده */}
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
              You do not have permission to view the contract list.
            </p>
          </div>
        ) : sortedContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
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
            {sortedContracts.map((contract) => {
              const isSelected = selectedContract?.id === contract.id;
              const isDraft = contract.status === "DRAFT";
              const financialStatus = getContractFinancialStatus(contract);
              const expiringInfo = isExpiringSoon(contract);
              const daysProgress = calculateDaysProgress(contract);
              const daysLeft = calculateDaysLeft(contract.end_date);
              const isExpired = daysLeft < 0;
              const notStarted = daysProgress === null || daysProgress === 0;
              const priority = contractPriorities?.get(contract.id);
              const hasAction =
                priority && priority.level > 0 && priority.level <= 4;

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
                    isDraft
                      ? isSelected
                        ? isDark
                          ? "bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-dashed border-slate-500 shadow-lg"
                          : "bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-dashed border-slate-400 shadow-lg"
                        : isDark
                          ? "bg-slate-800/40 border-2 border-dashed border-slate-600 hover:border-slate-400 hover:bg-slate-800/60"
                          : "bg-slate-50 border-2 border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100"
                      : isSelected
                        ? isDark
                          ? "bg-gradient-to-r from-indigo-900/50 to-violet-900/50 border border-indigo-500/50 shadow-lg shadow-indigo-500/20"
                          : "bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-300/50 shadow-lg shadow-indigo-500/10"
                        : isDark
                          ? "bg-slate-800/30 border border-transparent hover:bg-slate-800/60 hover:border-slate-700/50 hover:shadow-md"
                          : "bg-white/50 border border-transparent hover:bg-white hover:border-slate-200/70 hover:shadow-md"
                  } ${!isDraft && hasAction && priority?.color === "amber" ? "border-l-4 border-l-amber-500" : ""} ${!isDraft && hasAction && priority?.color === "rose" ? "border-l-4 border-l-rose-500" : ""} ${!isDraft && hasAction && priority?.color === "indigo" ? "border-l-4 border-l-indigo-500" : ""}`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${
                        isDraft
                          ? isDark
                            ? "bg-slate-400"
                            : "bg-slate-500"
                          : "bg-indigo-500"
                      }`}
                    />
                  )}

                  {/* Draft Badge */}
                  {isDraft && (
                    <div
                      className={`flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-md text-[10px] font-bold w-fit ${
                        isDark
                          ? "bg-slate-700 text-slate-200 border border-slate-600"
                          : "bg-slate-200 text-slate-700 border border-slate-300"
                      }`}
                    >
                      <span className="text-sm">✏️</span>
                      <span>Draft - In Progress</span>
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${
                          isDark
                            ? "bg-slate-600 text-slate-300"
                            : "bg-white text-slate-600"
                        }`}
                      >
                        Click to continue
                      </span>
                    </div>
                  )}

                  {/* Action Badge */}
                  {!isDraft && hasAction && (
                    <div
                      className={`flex items-center gap-1 mb-2 px-2 py-0.5 rounded text-[10px] font-semibold w-fit ${
                        priority?.color === "amber"
                          ? isDark
                            ? "bg-amber-900/50 text-amber-300"
                            : "bg-amber-100 text-amber-700"
                          : priority?.color === "rose"
                            ? isDark
                              ? "bg-rose-900/50 text-rose-300"
                              : "bg-rose-100 text-rose-700"
                            : isDark
                              ? "bg-indigo-900/50 text-indigo-300"
                              : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      <span>{priority?.icon}</span>
                      <span>{priority?.label}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          tone={
                            contract.type === "CONTRACT" ? "indigo" : "amber"
                          }
                          className={`text-[9px] ${isDraft ? "opacity-60" : ""}`}
                        >
                          {contract.type === "CONTRACT"
                            ? "📄 Contract"
                            : "📦 Work Order"}
                        </Badge>
                        <span
                          className={`font-mono text-[11px] truncate ${
                            isDraft
                              ? isDark
                                ? "text-slate-500"
                                : "text-slate-500"
                              : isDark
                                ? "text-slate-400"
                                : "text-slate-600"
                          }`}
                        >
                          {contract.contract_no}
                        </span>
                      </div>
                      <h3
                        className={`text-sm font-bold truncate ${
                          isDraft
                            ? isDark
                              ? "text-slate-300 italic"
                              : "text-slate-600 italic"
                            : isDark
                              ? "text-slate-100"
                              : "text-slate-900"
                        }`}
                      >
                        {contract.contract_title ||
                          (isDraft ? "Untitled Draft" : "")}
                      </h3>
                      <p
                        className={`text-[11px] truncate ${
                          isDraft
                            ? isDark
                              ? "text-slate-500"
                              : "text-slate-500"
                            : isDark
                              ? "text-slate-400"
                              : "text-slate-600"
                        }`}
                      >
                        {contract.client_name}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 ml-2">
                      {isDraft ? (
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${
                            isDark
                              ? "bg-slate-700 text-slate-300 border border-slate-600"
                              : "bg-slate-200 text-slate-700 border border-slate-300"
                          }`}
                        >
                          <span>📝</span>
                          <span>Draft</span>
                        </div>
                      ) : contract.status === "COMPLETED" ? (
                        <Badge tone="slate" className="text-[10px]">
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
                        <Badge tone="amber" className="text-[10px]">
                          ⏳ Not Started
                        </Badge>
                      ) : financialStatus === "needs_review" ? (
                        <Badge tone="amber" className="text-[10px]">
                          ⚠️ Review
                        </Badge>
                      ) : (
                        <Badge tone="emerald" className="text-[10px]">
                          🟢 Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Footer Info Section */}
                  {isDraft ? (
                    <div
                      className={`mt-2 p-2 rounded-lg ${
                        isDark
                          ? "bg-slate-900/50 border border-slate-700"
                          : "bg-white border border-slate-200"
                      }`}
                    >
                      {/* 🔧 Conditional Date for Draft */}
                      {canDate && (
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={
                              isDark ? "text-slate-400" : "text-slate-600"
                            }
                          >
                            📅 {contract.start_date || "No start date"} →{" "}
                            {contract.end_date || "No end date"}
                          </span>
                        </div>
                      )}

                      {/* Value for Draft (Always visible or based on financial permission if needed) */}
                      <div className="flex items-center justify-end text-xs">
                        <span
                          className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {contract.total_value > 0
                            ? formatCurrency(
                                contract.total_value,
                                contract.currency,
                              )
                            : "—"}
                        </span>
                      </div>

                      <div
                        className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${
                          isDark ? "text-slate-500" : "text-slate-500"
                        }`}
                      >
                        <span>⚠️</span>
                        <span>
                          This contract is not yet submitted for approval
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 🔧 Conditional Date & Value for Active Contracts */}
                      {(canDate || canViewFinancial) && (
                        <div className="flex items-center justify-between text-xs mt-2">
                          {canDate ? (
                            <span
                              className={
                                isDark ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              📅 {contract.start_date} → {contract.end_date}
                            </span>
                          ) : (
                            <span></span> // Spacer to keep value aligned if date is hidden
                          )}

                          {canViewFinancial ? (
                            <span
                              className={`font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                            >
                              {formatCurrency(
                                contract.total_value,
                                contract.currency,
                              )}
                            </span>
                          ) : (
                            <span
                              className={`font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              🔒 Locked
                            </span>
                          )}
                        </div>
                      )}

                      {/* 🔧 Conditional Progress Bar */}
                      {canProgressBar &&
                        contract.status !== "COMPLETED" &&
                        daysProgress !== null && (
                          <div className="mt-2">
                            <div
                              className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${getDaysProgressColor(daysProgress)}`}
                                style={{
                                  width: `${Math.min(daysProgress, 100)}%`,
                                }}
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
                                  notStarted
                                    ? isDark
                                      ? "text-amber-400"
                                      : "text-amber-600"
                                    : isExpired
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
                                {notStarted
                                  ? "⏳ Not Started"
                                  : isExpired
                                    ? `${Math.abs(daysLeft)} days overdue`
                                    : daysLeft === 0
                                      ? "Expires today"
                                      : `${daysLeft} days left`}
                                {!notStarted && (
                                  <span
                                    className={`ml-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                  >
                                    ({daysProgress.toFixed(0)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                    </>
                  )}
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
            Showing {sortedContracts.length} agreements
          </span>
        </div>
      </div>
    </div>
  );
}
