// src/features/client-management/ui/ContractDetailsModal.tsx

import { useMemo } from "react";
import { Button, Badge, Card, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import type { Contract, TariffLine } from "@entities/contract/types";
import { formatCurrency } from "@shared/lib/formatters";
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysLeft,
  getProgressTextClass,
  getProgressBgClass,
  isExpiringSoon,
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

  const canContractValue = canAccessElement("client_contract_value");
  const canContractProgressWork = canAccessElement(
    "client_contract_progress_work",
  );
  const canContractProgressInvoice = canAccessElement(
    "client_contract_progress_invoice",
  );
  const canTimeRemaining = canAccessElement("client_time_remaining");
  const canTariffsTable = canAccessElement("client_tariffs_table");
  const canTariffsSection = canAccessElement("client_tariffs_section");
  const canTariffsFinancial = canAccessElement("client_tariffs_financial");
  const canTariffsTotals = canAccessElement("client_tariffs_totals");

  const tariffs = useMemo(() => {
    if (!contract) return [];
    return contractTariffs.filter((t) => t.contract_id === contract.id);
  }, [contract, contractTariffs]);

  const daysLeft = useMemo(() => {
    if (!contract) return 0;
    return calculateDaysLeft(contract.end_date);
  }, [contract]);

  const workProgress = useMemo(() => {
    if (!contract) return 0;
    return calculateProgressFromTariffs(contract);
  }, [contract]);

  const invoiceProgress = useMemo(() => {
    if (!contract) return 0;
    return calculateInvoiceProgress(contract);
  }, [contract]);

  const expiringInfo = useMemo(() => {
    if (!contract) return { expiring: false, daysLeft: 0 };
    return isExpiringSoon(contract);
  }, [contract]);

  if (!contract) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contract Details" size="lg">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone={contract.type === "CONTRACT" ? "indigo" : "amber"}>
                {contract.type}
              </Badge>
              <Badge tone={contract.status === "ACTIVE" ? "emerald" : "slate"}>
                {contract.status}
              </Badge>
              {expiringInfo.expiring && (
                <Badge tone="danger" className="gap-1 animate-pulse">
                  <span>⚠️</span>
                  <span>Expiring in {expiringInfo.daysLeft} days</span>
                </Badge>
              )}
            </div>
            <h2
              className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {contract.contract_title}
            </h2>
            <div
              className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              {contract.contract_no} • {contract.client_name}
            </div>
          </div>
          {canContractValue && (
            <div className="text-right">
              <div
                className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Total Value
              </div>
              <div
                className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {formatCurrency(contract.total_value)}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {canContractProgressWork && (
            <Card
              className={`p-4 rounded-xl border ${
                isDark
                  ? "border-slate-700/50 bg-slate-800/30"
                  : "border-slate-200/70 bg-white"
              }`}
            >
              <div
                className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Performed Work Progress
              </div>
              <div
                className={`text-lg font-bold ${getProgressTextClass(workProgress)}`}
              >
                {workProgress.toFixed(2)}%
              </div>
              <div
                className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
              >
                <div
                  className={`h-full rounded-full ${getProgressBgClass(workProgress)}`}
                  style={{ width: `${Math.min(workProgress, 100)}%` }}
                />
              </div>
            </Card>
          )}

          {canContractProgressInvoice ? (
            <Card
              className={`p-4 rounded-xl border ${
                isDark
                  ? "border-slate-700/50 bg-slate-800/30"
                  : "border-slate-200/70 bg-white"
              }`}
            >
              <div
                className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Invoice Progress
              </div>
              <div
                className={`text-lg font-bold ${getProgressTextClass(invoiceProgress)}`}
              >
                {invoiceProgress.toFixed(2)}%
              </div>
              <div
                className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700/50" : "bg-slate-200/70"}`}
              >
                <div
                  className={`h-full rounded-full ${getProgressBgClass(invoiceProgress)}`}
                  style={{ width: `${Math.min(invoiceProgress, 100)}%` }}
                />
              </div>
            </Card>
          ) : (
            <Card
              className={`p-4 rounded-xl border opacity-50 ${
                isDark
                  ? "border-slate-700/50 bg-slate-800/30"
                  : "border-slate-200/70 bg-white"
              }`}
            >
              <div
                className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Invoice Progress
              </div>
              <div
                className={`text-lg font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                🔒 Locked
              </div>
            </Card>
          )}

          {canTimeRemaining && (
            <Card
              className={`p-4 rounded-xl border ${
                expiringInfo.expiring
                  ? isDark
                    ? "border-rose-700/50 bg-rose-950/30 animate-pulse shadow-lg shadow-rose-500/20"
                    : "border-rose-300/70 bg-rose-50/50 animate-pulse shadow-lg shadow-rose-500/20"
                  : isDark
                    ? "border-slate-700/50 bg-slate-800/30"
                    : "border-slate-200/70 bg-white"
              }`}
            >
              <div
                className={`text-xs mb-1 ${
                  expiringInfo.expiring
                    ? isDark
                      ? "text-rose-400"
                      : "text-rose-700"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                }`}
              >
                {expiringInfo.expiring ? "⚠️ Time Remaining" : "Time Remaining"}
              </div>
              {daysLeft < 0 ? (
                <div
                  className={`text-lg font-bold ${
                    expiringInfo.expiring
                      ? isDark
                        ? "text-rose-400"
                        : "text-rose-600"
                      : "text-rose-600"
                  }`}
                >
                  {Math.abs(daysLeft)} days overdue
                </div>
              ) : daysLeft === 0 ? (
                <div
                  className={`text-lg font-bold ${
                    expiringInfo.expiring
                      ? isDark
                        ? "text-rose-400"
                        : "text-rose-600"
                      : "text-amber-600"
                  }`}
                >
                  Today (Expires)
                </div>
              ) : (
                <div
                  className={`text-lg font-bold ${
                    expiringInfo.expiring
                      ? isDark
                        ? "text-rose-400"
                        : "text-rose-600"
                      : "text-emerald-600"
                  }`}
                >
                  {daysLeft} days remaining
                </div>
              )}
            </Card>
          )}
        </div>

        {canTariffsSection ? (
          <div>
            <h3
              className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Tariff Details
            </h3>
            {tariffs.length === 0 ? (
              <div
                className={`text-center py-8 text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                No tariff lines defined for this contract
              </div>
            ) : canTariffsTable ? (
              <div
                className={`overflow-x-auto rounded-xl border ${
                  isDark ? "border-slate-700/50" : "border-slate-200/70"
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className={`${
                      isDark
                        ? "bg-slate-800/50 text-slate-400"
                        : "bg-slate-50/70 text-slate-500"
                    } text-[10px] uppercase tracking-wide`}
                  >
                    <tr>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold">Unit</th>
                      <th className="px-3 py-2 font-semibold text-right">
                        Rate
                      </th>
                      <th className="px-3 py-2 font-semibold text-center">
                        Total Performed Work
                      </th>
                      {canTariffsFinancial && (
                        <>
                          <th className="px-3 py-2 font-semibold text-right">
                            Total Value of Performed Works
                          </th>
                          <th className="px-3 py-2 font-semibold text-right">
                            Total Invoiced
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody
                    className={
                      isDark
                        ? "divide-y divide-slate-700/50"
                        : "divide-y divide-slate-200/70"
                    }
                  >
                    {tariffs.map((tariff) => {
                      const consumed = tariff.consumed_quantity ?? 0;
                      const rate =
                        typeof tariff.rate === "string"
                          ? Number(tariff.rate.replace(/,/g, "")) || 0
                          : tariff.rate || 0;
                      const value = consumed * rate;
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
                          <td className="px-3 py-2 text-right font-mono">
                            {formatCurrency(tariff.rate, contract.currency)}
                          </td>
                          <td className="px-3 py-2 text-center font-mono">
                            {consumed}
                          </td>
                          {canTariffsFinancial && (
                            <>
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
                            </>
                          )}
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
                        colSpan={canTariffsFinancial ? 6 : 4}
                        className={`px-3 py-2.5 text-sm font-bold uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-700"}`}
                      >
                        💰 Total
                      </td>
                      {canTariffsTotals && (
                        <>
                          <td
                            className={`px-3 py-2.5 text-right font-mono font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                          >
                            {formatCurrency(
                              tariffs.reduce((sum, t) => {
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
                              tariffs.reduce(
                                (sum, t) => sum + (t.invoiced || 0),
                                0,
                              ),
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
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
                  Tariff Table Locked
                </h4>
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
          </div>
        )}
      </div>
    </Modal>
  );
}
