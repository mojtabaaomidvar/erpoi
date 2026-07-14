// src/features/client-management/ui/ContractDetailsModal.tsx

import { useMemo, useState } from "react";
import { Button, Badge, Card, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import type { Contract, TariffLine } from "@/types/contract";
import { formatCurrency } from "@shared/lib/formatters";
import { AnimatedCollapse } from "@shared/ui/AnimatedCollapse";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysLeft,
  calculateDaysProgress,
  getDaysUntilStart,
  getContractFinancialStatus,
  getAdjustmentReminder,
  isExpiringSoon,
  getProgressColor,
  getProgressTextClass,
  getProgressTextColor,
  jalaaliToGregorianDate,
} from "@entities/contract/services/contractCalculations";

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  contractTariffs?: TariffLine[];
}

export function ContractDetailsModal({
  isOpen,
  onClose,
  contract,
  contractTariffs = [],
}: ContractDetailsModalProps) {
  const { isDark } = useTheme();
  const { canAccessElement } = usePermissionMapping();

  // ═══════════════════════════════════════
  // 🔐 Element-Level Access (بخش‌های اصلی)
  // ═══════════════════════════════════════
  const canInfoSection = canAccessElement("client_info_section");
  const canInfoStartDate = canAccessElement("client_info_start_date");
  const canInfoEndDate = canAccessElement("client_info_end_date");
  const canInfoTotalValue = canAccessElement("client_info_total_value");
  const canInfoPerformedWork = canAccessElement("client_info_performed_work");
  const canInfoInvoiced = canAccessElement("client_info_invoiced");
  const canInfoNotInvoiced = canAccessElement("client_info_not_invoiced");
  const canProgressWork = canAccessElement("client_progress_work");
  const canProgressInvoice = canAccessElement("client_progress_invoice");
  const canProgressTime = canAccessElement("client_progress_time");
  const canReminderSection = canAccessElement("client_reminder_section");
  const canTariffSection = canAccessElement("client_tariffs_section");

  // 🔐 NEW: دسترسی در سطح ستون‌های جدول تعرفه

  const canColPerformed = canAccessElement("client_tariff_col_performed");
  const canColTotalValue = canAccessElement("client_tariff_col_total_value");
  const canColInvoiced = canAccessElement("client_tariff_col_invoiced");

  // ═══════════════════════════════════════
  // 🧮 State & Computed Values
  // ═══════════════════════════════════════
  const [isArchivedCollapsed, setIsArchivedCollapsed] = useState(true);
  const [isFutureCollapsed, setIsFutureCollapsed] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedTariffs = useMemo(() => {
    if (!contract) return [];
    if (contract.tariffLines && contract.tariffLines.length > 0)
      return contract.tariffLines;
    return contractTariffs.filter((t) => t.contract_id === contract.id);
  }, [contract, contractTariffs]);

  const activeTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validFrom = jalaaliToGregorianDate(t.valid_from);
      const validTo = jalaaliToGregorianDate(t.valid_to);
      if (validFrom && validFrom > today) return false;
      if (validTo && validTo < today) return false;
      return true;
    });
  }, [selectedTariffs, today]);

  const futureTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validFrom = jalaaliToGregorianDate(t.valid_from);
      return !!(validFrom && validFrom > today);
    });
  }, [selectedTariffs, today]);

  const archivedTariffs = useMemo(() => {
    return selectedTariffs.filter((t) => {
      const validTo = jalaaliToGregorianDate(t.valid_to);
      return !!(validTo && validTo < today);
    });
  }, [selectedTariffs, today]);

  const archivedTariffsByVersion = useMemo(() => {
    const grouped = new Map<number, TariffLine[]>();
    archivedTariffs.forEach((tariff) => {
      const version = tariff.version || 1;
      if (!grouped.has(version)) grouped.set(version, []);
      grouped.get(version)!.push(tariff);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([version, tariffs]) => ({ version, tariffs }));
  }, [archivedTariffs]);

  const futureTariffsByVersion = useMemo(() => {
    const grouped = new Map<number, TariffLine[]>();
    futureTariffs.forEach((tariff) => {
      const version = tariff.version || 1;
      if (!grouped.has(version)) grouped.set(version, []);
      grouped.get(version)!.push(tariff);
    });
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([version, tariffs]) => ({ version, tariffs }));
  }, [futureTariffs]);

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

  if (!contract) return null;

  const financialStatus = getContractFinancialStatus(contract);
  const expiringInfo = isExpiringSoon(contract);
  const reminder = getAdjustmentReminder(contract);
  const daysUntilStart = getDaysUntilStart(contract.start_date);
  const daysLeft = calculateDaysLeft(contract.end_date);
  const isExpired = daysLeft < 0;
  const isFullyInvoiced = contract.invoiced >= contract.total_value;
  const needsFinancialReview = isExpired && !isFullyInvoiced;
  const notStarted = daysUntilStart > 0;
  const daysProgress = calculateDaysProgress(contract);

  // ═══════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📄 Contract Details"
      size="xl"
    >
      <div className="space-y-6">
        {/* ═══════════════════════════════════════ */}
        {/* 🔹 HEADER (اطلاعات پایه همیشه نمایش داده می‌شوند) */}
        {/* ═══════════════════════════════════════ */}
        <div
          className={`rounded-2xl border p-4 animate-scaleIn ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-2xl font-bold shadow-lg shadow-indigo-500/30">
              📄
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary">
                {contract.contract_title}
              </h3>
              <p className="text-sm text-secondary font-mono">
                {contract.contract_no} • {contract.client_name}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge tone={contract.type === "CONTRACT" ? "indigo" : "amber"}>
                  {contract.type === "CONTRACT"
                    ? "📄 Contract"
                    : "📦 Work Order"}
                </Badge>
                {contract.status === "COMPLETED" ? (
                  <Badge tone="slate">✓ Completed</Badge>
                ) : financialStatus === "needs_review" ? (
                  <Badge tone="amber" className="gap-1">
                    <span>⚠️</span>
                    <span>Needs Financial Review</span>
                  </Badge>
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
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 🔹 REMINDER SECTION */}
        {/* ═══════════════════════════════════════ */}
        {canReminderSection && reminder.show && (
          <div
            className={`rounded-xl border-2 p-4 animate-fadeIn ${reminder.mode === "TBD" ? (isDark ? "border-amber-600 bg-amber-950/40" : "border-amber-400 bg-amber-50") : isDark ? "border-indigo-600 bg-indigo-950/40" : "border-indigo-400 bg-indigo-50"}`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {reminder.mode === "TBD" ? "⏳" : "📊"}
              </div>
              <div className="flex-1">
                <h4
                  className={`text-sm font-bold mb-1 ${reminder.mode === "TBD" ? (isDark ? "text-amber-200" : "text-amber-900") : isDark ? "text-indigo-200" : "text-indigo-900"}`}
                >
                  Price Adjustment Reminder
                </h4>
                <p
                  className={`text-xs mb-2 ${reminder.mode === "TBD" ? (isDark ? "text-amber-300" : "text-amber-800") : isDark ? "text-indigo-300" : "text-indigo-800"}`}
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
                      className={`font-bold ${reminder.daysUntil <= 7 ? "text-rose-500" : reminder.daysUntil <= 15 ? "text-amber-500" : "text-emerald-500"}`}
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

        {/* ═══════════════════════════════════════ */}
        {/* 🔹 CONTRACT INFORMATION */}
        {/* ═══════════════════════════════════════ */}
        {canInfoSection && (
          <div
            className={`rounded-xl border p-4 animate-fadeIn ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
          >
            <h3
              className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              📋 Contract Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
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
              {canInfoTotalValue && (
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
              {canInfoPerformedWork && (
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
              {canInfoInvoiced && (
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
                        (sum, t) => sum + ((t as any).invoiced || 0),
                        0,
                      ),
                    )}
                  </div>
                </div>
              )}
              {canInfoNotInvoiced && (
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
                        (sum, t) => sum + ((t as any).invoiced || 0),
                        0,
                      );
                      return formatCurrency(
                        Math.max(0, totalPerformedWork - totalInvoiced),
                        contract.currency,
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* 🔹 PROGRESS CARDS (Granular Control) */}
        {/* ═══════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {canProgressWork && (
            <Card
              className={`rounded-xl border p-4 animate-fadeIn ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/70 bg-white"}`}
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
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(workProgress)}`}
                        style={{ width: `${Math.min(workProgress, 100)}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </Card>
          )}
        </div>
        {/* ═══════════════════════════════════════ */}
        {/* 🔹 TARIFFS TABLE (با کنترل ستون به ستون) */}
        {/* ═══════════════════════════════════════ */}
        {canTariffSection ? (
          <div className="animate-fadeIn">
            <h3
              className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Tariff Lines & Consumption
            </h3>

            {/* Active Tariffs */}
            {activeTariffs.length > 0 && (
              <div className="mb-6">
                <h4
                  className={`text-xs font-semibold mb-2 flex items-center gap-2 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
                >
                  <span>✓</span>
                  <span>Active Tariffs (Current)</span>
                </h4>
                <div
                  className={`overflow-x-auto rounded-xl border-2 ${isDark ? "border-emerald-700/50" : "border-emerald-200"}`}
                >
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`${isDark ? "bg-emerald-900/20 text-emerald-400" : "bg-emerald-50 text-emerald-700"} text-[10px] uppercase tracking-wide`}
                    >
                      <tr>
                        <th className="px-3 py-2 font-semibold text-left">
                          Description
                        </th>
                        <th className="px-3 py-2 font-semibold text-left">
                          Unit
                        </th>
                        <th className="px-3 py-2 font-semibold text-left">
                          Rate
                        </th>
                        {canColPerformed && (
                          <th className="px-3 py-2 font-semibold text-left">
                            Performed
                          </th>
                        )}
                        {canColTotalValue && (
                          <th className="px-3 py-2 font-semibold text-left">
                            Total Value
                          </th>
                        )}
                        {canColInvoiced && (
                          <th className="px-3 py-2 font-semibold text-left">
                            Invoiced
                          </th>
                        )}
                        <th className="px-3 py-2 font-semibold text-left">
                          Valid From
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
                      {activeTariffs.map((tariff) => {
                        const rate =
                          typeof tariff.rate === "string"
                            ? Number(tariff.rate.replace(/,/g, "")) || 0
                            : tariff.rate || 0;
                        const value = (tariff.consumed_quantity || 0) * rate;
                        const invoiced = (tariff as any).invoiced || 0;
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
                              <div className="flex items-left gap-2">
                                <span>{tariff.description}</span>
                                {tariff.version && tariff.version > 1 && (
                                  <span
                                    className={`inline-flex items-left px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                                  >
                                    v{tariff.version}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-3 py-2 ">
                              <Badge
                                tone="indigo"
                                className="text-[9px] text-left"
                              >
                                {tariff.unit.replace("_", " ")}
                              </Badge>
                            </td>

                            <td
                              className={`px-3 py-2 text-left font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              {formatCurrency(tariff.rate, contract.currency)}
                            </td>

                            {canColPerformed && (
                              <td
                                className={`px-3 py-2 text-left font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}
                              >
                                {tariff.consumed_quantity || 0}
                              </td>
                            )}
                            {canColTotalValue && (
                              <td
                                className={`px-3 py-2 text-left font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                              >
                                {formatCurrency(value, contract.currency)}
                              </td>
                            )}
                            {canColInvoiced && (
                              <td
                                className={`px-3 py-2 text-left font-mono font-bold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                              >
                                {formatCurrency(invoiced)}
                              </td>
                            )}

                            <td
                              className={`px-3 py-2 text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {tariff.valid_from ? (
                                <span className="flex items-left gap-1">
                                  <span>📅</span>
                                  <span>{tariff.valid_from}</span>
                                </span>
                              ) : (
                                <span
                                  className={
                                    isDark ? "text-slate-500" : "text-slate-400"
                                  }
                                >
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Future Tariffs */}
            {futureTariffsByVersion.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setIsFutureCollapsed(!isFutureCollapsed)}
                  className={`w-full flex items-left justify-between mb-2 px-3 py-2 rounded-lg transition-all hover:scale-[1.01] ${isDark ? "bg-amber-900/20 hover:bg-amber-900/30 text-amber-300" : "bg-amber-50 hover:bg-amber-100 text-amber-700"}`}
                >
                  <div className="flex items-left gap-2">
                    <span>⏳</span>
                    <span className="text-xs font-semibold">
                      Future Tariffs (Scheduled)
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? "bg-amber-900/50 text-amber-400" : "bg-amber-200 text-amber-800"}`}
                    >
                      {futureTariffs.length}
                    </span>
                  </div>
                  <div className="flex items-left gap-2">
                    <span
                      className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                    >
                      {isFutureCollapsed ? "Show" : "Hide"}
                    </span>
                    <span
                      className={`transition-transform duration-300 ${isFutureCollapsed ? "" : "rotate-180"}`}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                <AnimatedCollapse isOpen={!isFutureCollapsed}>
                  {futureTariffsByVersion.map(({ version, tariffs }, index) => (
                    <div
                      key={version}
                      className="mb-4 animate-fadeIn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <h5
                        className={`text-[10px] font-bold mb-1 px-2 ${isDark ? "text-amber-400" : "text-amber-700"}`}
                      >
                        Version {version}
                      </h5>
                      <div
                        className={`overflow-x-auto rounded-xl border ${isDark ? "border-amber-700/50" : "border-amber-200"}`}
                      >
                        <table className="w-full text-left text-xs">
                          <thead
                            className={`${isDark ? "bg-amber-900/20 text-amber-400" : "bg-amber-50 text-amber-700"} text-[10px] uppercase tracking-wide`}
                          >
                            <tr>
                              <th className="px-3 py-2 font-semibold text-left">
                                Description
                              </th>

                              <th className="px-3 py-2 font-semibold text-left">
                                Unit
                              </th>

                              <th className="px-3 py-2 font-semibold text-left">
                                Rate
                              </th>

                              <th className="px-3 py-2 font-semibold text-left">
                                Valid From
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
                            {tariffs.map((tariff: TariffLine) => (
                              <tr
                                key={tariff.id}
                                className={
                                  isDark
                                    ? "hover:bg-slate-800/30"
                                    : "hover:bg-slate-50/50"
                                }
                              >
                                <td
                                  className={`px-3 py-2 font-medium ${isDark ? "text-amber-200" : "text-amber-900"}`}
                                >
                                  {tariff.description}
                                </td>

                                <td className="px-3 py-2">
                                  <Badge tone="amber" className="text-[9px]">
                                    {tariff.unit.replace("_", " ")}
                                  </Badge>
                                </td>

                                <td
                                  className={`px-3 py-2 text-left font-mono ${isDark ? "text-amber-300" : "text-amber-700"}`}
                                >
                                  {formatCurrency(
                                    tariff.rate,
                                    contract.currency,
                                  )}
                                </td>

                                <td
                                  className={`px-3 py-2 text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
                                >
                                  <span className="flex items-left gap-1">
                                    <span>📅</span>
                                    <span>{tariff.valid_from}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </AnimatedCollapse>
              </div>
            )}

            {/* Archived Tariffs */}
            {archivedTariffsByVersion.length > 0 && (
              <div>
                <button
                  onClick={() => setIsArchivedCollapsed(!isArchivedCollapsed)}
                  className={`w-full flex items-left justify-between mb-2 px-3 py-2 rounded-lg transition-all hover:scale-[1.01] ${isDark ? "bg-slate-800/50 hover:bg-slate-800 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  <div className="flex items-center gap-2">
                    <span>📦</span>
                    <span className="text-xs font-semibold">
                      Archived Tariffs - Previous Versions
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"}`}
                    >
                      {archivedTariffs.length}
                    </span>
                  </div>
                  <div className="flex items-left gap-2">
                    <span
                      className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {isArchivedCollapsed ? "Show" : "Hide"}
                    </span>
                    <span
                      className={`transition-transform duration-300 ${isArchivedCollapsed ? "" : "rotate-180"}`}
                    >
                      ▼
                    </span>
                  </div>
                </button>

                <AnimatedCollapse isOpen={!isArchivedCollapsed}>
                  {archivedTariffsByVersion.map(
                    ({ version, tariffs }, index) => (
                      <div
                        key={version}
                        className="mb-4 animate-fadeIn"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <h5
                          className={`text-[10px] font-bold mb-1 px-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                        >
                          Version {version}
                        </h5>
                        <div
                          className={`overflow-x-auto rounded-xl border opacity-75 ${isDark ? "border-slate-700/50" : "border-slate-200/70"}`}
                        >
                          <table className="w-full text-left text-xs">
                            <thead
                              className={`${isDark ? "bg-slate-800/50 text-slate-400" : "bg-slate-50/70 text-slate-500"} text-[10px] uppercase tracking-wide`}
                            >
                              <tr>
                                <th className="px-3 py-2 font-semibold text-left">
                                  Description
                                </th>

                                <th className="px-3 py-2 font-semibold text-left">
                                  Unit
                                </th>

                                <th className="px-3 py-2 font-semibold text-left">
                                  Rate
                                </th>
                                {canColPerformed && (
                                  <th className="px-3 py-2 font-semibold text-left">
                                    Performed
                                  </th>
                                )}
                                {canColTotalValue && (
                                  <th className="px-3 py-2 font-semibold text-left">
                                    Total Value
                                  </th>
                                )}
                                {canColInvoiced && (
                                  <th className="px-3 py-2 font-semibold text-left">
                                    Invoiced
                                  </th>
                                )}

                                <th className="px-3 py-2 font-semibold text-left">
                                  Valid Period
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
                              {tariffs.map((tariff: TariffLine) => {
                                const rate =
                                  typeof tariff.rate === "string"
                                    ? Number(tariff.rate.replace(/,/g, "")) || 0
                                    : tariff.rate || 0;
                                const value =
                                  (tariff.consumed_quantity || 0) * rate;
                                const invoiced = (tariff as any).invoiced || 0;
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
                                      className={`px-3 py-2 font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      <div className="flex items-left gap-2">
                                        <span>{tariff.description}</span>
                                        <span
                                          className={`inline-flex items-left px-1.5 py-0.5 rounded text-[9px] font-bold ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-600"}`}
                                        >
                                          v{tariff.version}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-3 py-2">
                                      <Badge
                                        tone="slate"
                                        className="text-[9px]"
                                      >
                                        {tariff.unit.replace("_", " ")}
                                      </Badge>
                                    </td>
                                    <td
                                      className={`px-3 py-2 text-left font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                    >
                                      {formatCurrency(
                                        tariff.rate,
                                        contract.currency,
                                      )}
                                    </td>
                                    {canColPerformed && (
                                      <td
                                        className={`px-3 py-2 text-left font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                      >
                                        {tariff.consumed_quantity || 0}
                                      </td>
                                    )}
                                    {canColTotalValue && (
                                      <td
                                        className={`px-3 py-2 text-left font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                      >
                                        {formatCurrency(
                                          value,
                                          contract.currency,
                                        )}
                                      </td>
                                    )}
                                    {canColInvoiced && (
                                      <td
                                        className={`px-3 py-2 text-left font-mono ${isDark ? "text-slate-400" : "text-slate-600"}`}
                                      >
                                        {formatCurrency(invoiced)}
                                      </td>
                                    )}

                                    <td
                                      className={`px-3 py-2 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
                                    >
                                      <div className="flex items-left gap-1">
                                        <span>📅</span>
                                        <span>
                                          {tariff.valid_from || "—"} →{" "}
                                          {tariff.valid_to || "—"}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ),
                  )}
                </AnimatedCollapse>
              </div>
            )}

            {selectedTariffs.length === 0 && (
              <div
                className={`text-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                <div className="text-4xl mb-2">📭</div>
                <p>No tariff lines found for this contract</p>
              </div>
            )}
          </div>
        ) : (
          <div
            className={`rounded-xl border-2 border-dashed p-8 text-center ${isDark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-300/70 bg-slate-50/50"}`}
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
    </Modal>
  );
}
