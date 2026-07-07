// src/features/contract-management/ui/ContractDetails.tsx

import { useMemo } from "react";
import { Button, Badge, Card } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import type { Contract, TariffLine } from "@entities/contract/types";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysLeft,
  getDaysUntilStart,
  getContractFinancialStatus,
  getAdjustmentReminder,
  isExpiringSoon,
  getProgressColor,
  getProgressTextClass,
  getProgressTextColor,
} from "@entities/contract/services/contractCalculations";

interface ContractDetailsProps {
  contract: Contract | null;
  onClose: () => void;
  onEdit: () => void;
  onRequestComplete: (contract: Contract) => void;
  onViewClientContracts?: (clientId: string) => void;
}

export function ContractDetails({
  contract,
  onClose,
  onEdit,
  onRequestComplete,
  onViewClientContracts,
}: ContractDetailsProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  // 🔐 Element-Level Access
  const canBtnEdit = canAccessElement("contract_btn_edit");
  const canBtnDelete = canAccessElement("contract_btn_delete");
  const canBtnApprove = canAccessElement("contract_btn_approve");
  const canBtnClose = canAccessElement("contract_btn_close");
  const canInfoSection = canAccessElement("contract_info_section");
  const canInfoStartDate = canAccessElement("contract_info_start_date");
  const canInfoEndDate = canAccessElement("contract_info_end_date");
  const canStatTotalValue = canAccessElement("contract_stat_total_value");
  const canStatPerformedWork = canAccessElement("contract_stat_performed_work");
  const canStatInvoiced = canAccessElement("contract_stat_invoiced");
  const canStatNotInvoiced = canAccessElement("contract_stat_not_invoiced");
  const canProgressWork = canAccessElement("contract_progress_work");
  const canProgressInvoice = canAccessElement("contract_progress_invoice");
  const canProgressTime = canAccessElement("contract_progress_time");
  const canReminderSection = canAccessElement("contract_reminder_section");
  const canTableTariffs = canAccessElement("contract_table_tariffs");

  const selectedTariffs = useMemo(() => {
    if (!contract) return [];
    return contract.tariffLines || [];
  }, [contract]);

  const totalPerformedWork = useMemo(() => {
    if (!contract) return 0;
    return selectedTariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string"
          ? Number(t.rate.replace(/,/g, "")) || 0
          : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);
  }, [contract, selectedTariffs]);

  // Empty state
  if (!contract) {
    return (
      <div
        className={`flex-1 flex items-center justify-center relative overflow-hidden min-h-[600px] ${
          isDark
            ? "bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950/30"
            : "bg-gradient-to-br from-slate-50 via-white to-indigo-50/30"
        }`}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? "%23ffffff" : "%23000000"}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="text-center z-10 relative">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-2xl opacity-40 animate-pulse" />
            <div
              className={`relative inline-flex items-center justify-center w-44 h-44 rounded-full shadow-2xl shadow-indigo-500/30 border-4 ${
                isDark
                  ? "bg-slate-800 border-slate-700"
                  : "bg-white border-white"
              }`}
            >
              <img
                src="/images/logo.png"
                alt="ICS Logo"
                className="w-36 h-36 object-contain"
              />
            </div>
          </div>
          <h2
            className={`text-3xl font-bold mb-3 ${isDark ? "text-slate-200" : "text-slate-700"}`}
          >
            OFFSHORE & ENERGY DEPARTMENT INSPECTION PLATFORM
          </h2>
          <p
            className={`text-base max-w-md mx-auto leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Select a contract from the list to view details, tariffs, and
            progress information
          </p>
        </div>
      </div>
    );
  }

  const financialStatus = getContractFinancialStatus(contract);
  const expiringInfo = isExpiringSoon(contract);
  const reminder = getAdjustmentReminder(contract);
  const daysUntilStart = getDaysUntilStart(contract.start_date);
  const daysLeft = calculateDaysLeft(contract.end_date);
  const isExpired = daysLeft < 0;
  const isFullyInvoiced = contract.invoiced >= contract.total_value;
  const needsFinancialReview = isExpired && !isFullyInvoiced;
  const notStarted = daysUntilStart > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {/* Header */}
      <div
        className={`relative px-6 py-4 border-b ${
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

        <div className="relative flex items-center justify-between mb-4">
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Contract Details
          </h2>
          {canBtnClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`transition-colors ${
                isDark
                  ? "text-slate-400 hover:text-rose-400 hover:bg-rose-900/30"
                  : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              }`}
            >
              ✕ Close Panel
            </Button>
          )}
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
              📄
            </div>
            <div>
              <h3
                className="text-xl font-bold text-primary truncate min-w-0 max-w-[450px]"
                title={contract.contract_title}
              >
                {contract.contract_title}
              </h3>
              <p className="text-sm text-secondary font-mono">
                {contract.contract_no} • {contract.client_name}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge tone={contract.type === "CONTRACT" ? "indigo" : "amber"}>
                  {contract.type === "CONTRACT"
                    ? "📄 Contract"
                    : "📦 Work Order"}
                </Badge>
                {contract.status === "COMPLETED" ? (
                  <Badge tone="slate">✓ Completed</Badge>
                ) : financialStatus === "needs_review" ? (
                  <div className="flex items-center gap-2">
                    <Badge tone="amber" className="gap-1">
                      <span>⚠️</span>
                      <span>Needs Financial Review</span>
                    </Badge>
                    {canBtnApprove && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestComplete(contract)}
                        className={`gap-1 text-xs ${
                          isDark
                            ? "border-amber-600 text-amber-300 hover:bg-amber-900/30"
                            : "border-amber-300 text-amber-700 hover:bg-amber-50"
                        }`}
                      >
                        <span>✓</span>
                        <span>Mark as Completed</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge tone="emerald">🟢 Active</Badge>
                    {expiringInfo.expiring && (
                      <Badge tone="danger" className="gap-1 animate-pulse">
                        <span>⚠️</span>
                        <span>Expiring in {expiringInfo.daysLeft} days</span>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {canBtnEdit && (
            <Button
              variant="outline"
              size="md"
              onClick={onEdit}
              disabled={
                contract.status === "COMPLETED" ||
                financialStatus === "completed"
              }
              className={`gap-2 shadow-sm transition-all hover:scale-105 ${
                contract.status === "COMPLETED" ||
                financialStatus === "completed"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <span>✏️</span> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Reminder Section */}
      {canReminderSection && reminder.show && (
        <div
          className={`mx-6 mt-4 rounded-xl border-2 p-4 ${
            reminder.mode === "TBD"
              ? isDark
                ? "border-amber-600 bg-amber-950/40"
                : "border-amber-400 bg-amber-50"
              : isDark
                ? "border-indigo-600 bg-indigo-950/40"
                : "border-indigo-400 bg-indigo-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              {reminder.mode === "TBD" ? "⏳" : "📊"}
            </div>
            <div className="flex-1">
              <h4
                className={`text-sm font-bold mb-1 ${
                  reminder.mode === "TBD"
                    ? isDark
                      ? "text-amber-200"
                      : "text-amber-900"
                    : isDark
                      ? "text-indigo-200"
                      : "text-indigo-900"
                }`}
              >
                Price Adjustment Reminder
              </h4>
              <p
                className={`text-xs mb-2 ${
                  reminder.mode === "TBD"
                    ? isDark
                      ? "text-amber-300"
                      : "text-amber-800"
                    : isDark
                      ? "text-indigo-300"
                      : "text-indigo-800"
                }`}
              >
                {reminder.mode === "TBD"
                  ? `Adjustment percentage needs to be determined. Effective date: ${reminder.effectiveDate}`
                  : `Adjustment will be applied. Effective date: ${reminder.effectiveDate}`}
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span
                    className={isDark ? "text-slate-400" : "text-slate-600"}
                  >
                    Days until effective:{" "}
                  </span>
                  <span
                    className={`font-bold ${
                      reminder.daysUntil <= 7
                        ? "text-rose-500"
                        : reminder.daysUntil <= 15
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {reminder.daysUntil} days
                  </span>
                </div>
                {reminder.mode === "FIXED" && reminder.percentage > 0 && (
                  <div>
                    <span
                      className={isDark ? "text-slate-400" : "text-slate-600"}
                    >
                      Percentage:{" "}
                    </span>
                    <span className="font-bold text-indigo-500">
                      {reminder.percentage}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="space-y-6">
          {/* Contract Information */}
          {canInfoSection && (
            <div
              className={`rounded-xl border p-4 ${
                isDark
                  ? "border-slate-700/50 bg-slate-800/30"
                  : "border-slate-200/70 bg-slate-50/50"
              }`}
            >
              <h3
                className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                📋 Contract Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 text-sm">
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Internal Contract No.
                  </div>
                  <div
                    className={`font-mono text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {contract.contract_no}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    External Contract No.
                  </div>
                  <div
                    className={`font-mono text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {contract.external_contract_no || "—"}
                  </div>
                </div>
                <div>
                  <div
                    className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Currency
                  </div>
                  <div
                    className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {contract.currency}
                  </div>
                </div>
                {canInfoStartDate && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Start Date
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {contract.start_date}
                    </div>
                  </div>
                )}
                {canInfoEndDate && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      End Date
                    </div>
                    <div
                      className={`text-xs ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      {contract.end_date}
                    </div>
                  </div>
                )}
                {canStatTotalValue && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                    >
                      Total Value
                    </div>
                    <div
                      className={`text-xs font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                    >
                      {formatCurrency(contract.total_value, contract.currency)}
                    </div>
                  </div>
                )}
                {canStatPerformedWork && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}
                    >
                      Total Performed Works
                    </div>
                    <div
                      className={`text-xs font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                    >
                      {formatCurrency(totalPerformedWork, contract.currency)}
                    </div>
                  </div>
                )}
                {canStatInvoiced && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-violet-400" : "text-violet-700"}`}
                    >
                      Invoiced
                    </div>
                    <div
                      className={`text-xs font-bold ${isDark ? "text-violet-300" : "text-violet-700"}`}
                    >
                      {formatCurrency(
                        selectedTariffs.reduce(
                          (sum, t) => sum + (t.invoiced || 0),
                          0,
                        ),
                      )}
                    </div>
                  </div>
                )}
                {canStatNotInvoiced && (
                  <div>
                    <div
                      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-rose-400" : "text-rose-700"}`}
                    >
                      Not Invoiced
                    </div>
                    <div
                      className={`text-xs font-bold ${isDark ? "text-rose-300" : "text-rose-700"}`}
                    >
                      {(() => {
                        const totalInvoiced = selectedTariffs.reduce(
                          (sum, t) => sum + (t.invoiced || 0),
                          0,
                        );
                        const notInvoiced = Math.max(
                          0,
                          totalPerformedWork - totalInvoiced,
                        );
                        return formatCurrency(notInvoiced, contract.currency);
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {canProgressWork && (
              <Card
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
              >
                <div
                  className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Total Performed Work (%)
                </div>
                {(() => {
                  const workProgress = calculateProgressFromTariffs(contract);
                  return (
                    <>
                      <div
                        className={`text-lg font-bold ${getProgressTextClass(workProgress)}`}
                      >
                        {workProgress.toFixed(2)}%
                      </div>
                      <div
                        className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                      >
                        <div
                          className={`h-full rounded-full ${getProgressColor(workProgress)}`}
                          style={{ width: `${Math.min(workProgress, 100)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </Card>
            )}

            {canProgressInvoice && (
              <Card
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
              >
                <div
                  className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Total Invoiced (%)
                </div>
                {(() => {
                  const spent = calculateInvoiceProgress(contract);
                  return (
                    <>
                      <div
                        className={`text-lg font-bold ${getProgressTextColor(spent)}`}
                      >
                        {spent.toFixed(1)}%
                        {spent > 100 && (
                          <span className="text-xs ml-1">(Over)</span>
                        )}
                      </div>
                      <div
                        className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                      >
                        <div
                          className={`h-full rounded-full ${getProgressColor(spent)}`}
                          style={{ width: `${Math.min(spent, 100)}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </Card>
            )}

            {canProgressTime && (
              <Card
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
              >
                {notStarted ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <div className="text-lg font-bold text-amber-600">
                      ⏳ Not Started
                    </div>
                    <div className="text-[10px] text-amber-500 mt-0.5">
                      Starts in {daysUntilStart} days
                    </div>
                  </>
                ) : contract.status === "COMPLETED" ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <div className="text-lg font-bold text-slate-600">
                      ✓ Completed
                    </div>
                  </>
                ) : needsFinancialReview ? (
                  <>
                    <div
                      className={`text-xs mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Financial Status
                    </div>
                    <div className="text-lg font-bold text-amber-600 mb-2">
                      ⚠️ Needs Review
                    </div>
                    {canBtnApprove ? (
                      <button
                        onClick={() => onRequestComplete(contract)}
                        className="w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all bg-amber-500 text-white hover:bg-amber-600 shadow-sm cursor-pointer"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <span>✓</span>
                          <span>Mark as Completed</span>
                        </span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                          isDark
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-60"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <span>🔒</span>
                          <span>Manager Approval Required</span>
                        </span>
                      </button>
                    )}
                  </>
                ) : daysLeft < 0 ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Status
                    </div>
                    <div className="text-lg font-bold text-rose-600">
                      {Math.abs(daysLeft)} days overdue
                    </div>
                  </>
                ) : daysLeft === 0 ? (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Time Remaining
                    </div>
                    <div className="text-lg font-bold text-amber-600">
                      Today (Expires)
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Time Remaining
                    </div>
                    <div className="text-lg font-bold text-emerald-600">
                      {daysLeft} days remaining
                    </div>
                  </>
                )}
              </Card>
            )}
          </div>

          {/* Tariffs Table */}
          {canTableTariffs ? (
            <div>
              <h3
                className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Tariff Lines & Consumption ({selectedTariffs.length})
              </h3>
              {selectedTariffs.length === 0 ? (
                <div
                  className={`text-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  No tariff lines defined for this contract
                </div>
              ) : (
                <div
                  className={`overflow-x-auto rounded-xl border ${isDark ? "border-slate-700/50" : "border-slate-200/70"}`}
                >
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`${isDark ? "bg-slate-800/50 text-slate-400" : "bg-slate-50/70 text-slate-500"} text-[10px] uppercase tracking-wide`}
                    >
                      <tr>
                        <th className="px-3 py-2 font-semibold">Description</th>
                        <th className="px-3 py-2 font-semibold">Unit</th>
                        <th className="px-3 py-2 font-semibold text-right">
                          Rate
                        </th>
                        <th className="px-3 py-2 font-semibold text-center">
                          Performed Work
                        </th>
                        <th className="px-3 py-2 font-semibold text-right">
                          Total Value
                        </th>
                        <th className="px-3 py-2 font-semibold text-right">
                          Invoiced
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={
                        isDark
                          ? "divide-y divide-slate-700/50"
                          : "divide-y divide-slate-200/70"
                      }
                    >
                      {selectedTariffs.map((tariff) => {
                        const rate =
                          typeof tariff.rate === "string"
                            ? Number(tariff.rate.replace(/,/g, "")) || 0
                            : tariff.rate || 0;
                        const value = (tariff.consumed_quantity || 0) * rate;
                        const invoiced = tariff.invoiced || 0;
                        return (
                          <tr
                            key={tariff.id}
                            className={
                              isDark
                                ? "hover:bg-slate-800/30"
                                : "hover:bg-slate-50/50"
                            }
                          >
                            <td
                              className={`px-3 py-2 font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}
                            >
                              {tariff.description}
                            </td>
                            <td className="px-3 py-2">
                              <Badge tone="indigo" className="text-[9px]">
                                {tariff.unit.replace("_", " ")}
                              </Badge>
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {formatCurrency(tariff.rate, contract.currency)}
                            </td>
                            <td
                              className={`px-3 py-2 text-center font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {tariff.consumed_quantity || 0}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                            >
                              {formatCurrency(value, contract.currency)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right font-mono font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                            >
                              {formatCurrency(invoiced)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot
                      className={
                        isDark
                          ? "bg-slate-800/50 border-t-2 border-slate-600"
                          : "bg-slate-50/70 border-t-2 border-slate-300"
                      }
                    >
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-3 py-2.5 text-sm font-bold uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-700"}`}
                        >
                          💰 Total
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          {formatCurrency(
                            selectedTariffs.reduce((sum, t) => {
                              const rate =
                                typeof t.rate === "string"
                                  ? Number(t.rate.replace(/,/g, "")) || 0
                                  : t.rate || 0;
                              return sum + (t.consumed_quantity || 0) * rate;
                            }, 0),
                            contract.currency,
                          )}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-mono font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                        >
                          {formatCurrency(
                            selectedTariffs.reduce(
                              (sum, t) => sum + (t.invoiced || 0),
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`rounded-xl border-2 border-dashed p-8 text-center ${
                isDark
                  ? "border-slate-700/50 bg-slate-800/30"
                  : "border-slate-300/70 bg-slate-50/50"
              }`}
            >
              <div className="text-4xl mb-3">🔒</div>
              <h4
                className={`text-sm font-bold mb-2 ${isDark ? "text-slate-200" : "text-slate-700"}`}
              >
                Tariff Details Locked
              </h4>
              <p
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                You need permission to view tariff details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
