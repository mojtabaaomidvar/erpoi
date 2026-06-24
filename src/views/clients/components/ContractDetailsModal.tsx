// src/views/clients/components/ContractDetailsModal.tsx
import { useMemo } from 'react';
import { Button, Badge, Card, Modal } from '../../../design-system';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Contract, TariffLine } from '../../../types/contract';
import { contractTariffs } from '../../../data/mockData';
import { formatCurrency } from '../../../lib/formatters';
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysLeft,
  getProgressTextClass,
  getProgressBgClass,
  isExpiringSoon,
} from '../../../lib/contractCalculations';

interface ContractDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
}

export function ContractDetailsModal({
  isOpen,
  onClose,
  contract,
}: ContractDetailsModalProps) {
  const { isDark } = useTheme();

  const tariffs = useMemo(() => {
    if (!contract) return [];
    return contractTariffs.filter((t) => t.contract_id === contract.id);
  }, [contract]);

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
  
  // 🔑 بررسی انقضای قرارداد
  const expiringInfo = useMemo(() => {
    if (!contract) return { expiring: false, daysLeft: 0 };
    return isExpiringSoon(contract);
  }, [contract]);

  if (!contract) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Contract Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge tone={contract.type === 'CONTRACT' ? 'indigo' : 'amber'}>
                {contract.type}
              </Badge>
              <Badge
                tone={contract.status === 'ACTIVE' ? 'emerald' : 'slate'}
              >
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
              className={`text-lg font-bold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {contract.contract_title}
            </h2>
            <div
              className={`text-sm mt-1 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {contract.contract_no} • {contract.client_name}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-xs ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Total Value
            </div>
            <div
              className={`text-xl font-bold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {formatCurrency(contract.total_value)}
            </div>
          </div>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 card-3d">
            <div
              className={`text-xs mb-1 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Performed Work Progress
            </div>
            <div
              className={`text-lg font-bold ${getProgressTextClass(workProgress, isDark)}`}
            >
              {workProgress.toFixed(2)}%
            </div>
            <div
              className={`mt-2 h-1.5 rounded-full overflow-hidden ${
                isDark ? 'bg-slate-700' : 'bg-slate-200'
              }`}
            >
              <div
                className={`h-full rounded-full ${getProgressBgClass(workProgress, isDark)}`}
                style={{ width: `${Math.min(workProgress, 100)}%` }}
              />
            </div>
          </Card>

          <Card className="p-4 card-3d">
            <div
              className={`text-xs mb-1 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Invoice Progress of Performed Works
            </div>
            <div
              className={`text-lg font-bold ${getProgressTextClass(invoiceProgress, isDark)}`}
            >
              {invoiceProgress.toFixed(2)}%
            </div>
            <div
              className={`mt-2 h-1.5 rounded-full overflow-hidden ${
                isDark ? 'bg-slate-700' : 'bg-slate-200'
              }`}
            >
              <div
                className={`h-full rounded-full ${getProgressBgClass(invoiceProgress, isDark)}`}
                style={{ width: `${Math.min(invoiceProgress, 100)}%` }}
              />
            </div>
          </Card>

           <Card className={`p-4 border ${
            expiringInfo.expiring
              ? isDark
                ? 'bg-rose-950/30 border-rose-700 animate-pulse shadow-lg shadow-rose-500/20'
                : 'bg-rose-50 border-rose-300 animate-pulse shadow-lg shadow-rose-500/20'
              : isDark
                ? 'bg-slate-800/50 border-slate-700'
                : 'bg-white border-slate-200'
          }`}>
            <div className={`text-xs mb-1 ${
              expiringInfo.expiring
                ? isDark ? 'text-rose-300' : 'text-rose-700'
                : isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {expiringInfo.expiring ? '⚠️ Time Remaining' : 'Time Remaining'}
            </div>
            {daysLeft < 0 ? (
              <div className={`text-lg font-bold ${
                expiringInfo.expiring
                  ? isDark ? 'text-rose-400' : 'text-rose-600'
                  : 'text-rose-600'
              }`}>
                {Math.abs(daysLeft)} days overdue
              </div>
            ) : daysLeft === 0 ? (
              <div className={`text-lg font-bold ${
                expiringInfo.expiring
                  ? isDark ? 'text-rose-400' : 'text-rose-600'
                  : 'text-amber-600'
              }`}>
                Today (Expires)
              </div>
            ) : (
              <div className={`text-lg font-bold ${
                expiringInfo.expiring
                  ? isDark ? 'text-rose-400' : 'text-rose-600'
                  : 'text-emerald-600'
              }`}>
                {daysLeft} days remaining
              </div>
            )}
          </Card>

        </div>

        {/* Tariff Table */}
        <div>
          <h3
            className={`text-sm font-semibold mb-3 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            Details
          </h3>
          {tariffs.length === 0 ? (
            <div
              className={`text-center py-8 text-sm ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              No tariff lines defined for this contract
            </div>
          ) : (
            <div
              className={`overflow-x-auto rounded-lg border ${
                isDark ? 'border-slate-700' : 'border-slate-200'
              }`}
            >
              <table className="w-full text-left text-xs">
                <thead
                  className={`${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'
                  } text-[10px] uppercase tracking-wide`}
                >
                  <tr>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 font-medium text-right">Rate</th>
                    <th className="px-3 py-2 font-medium text-center">
                      Total Performed Work
                    </th>
                    <th className="px-3 py-2 font-medium text-right">
                      Total Value of Performed Works
                    </th>
                    <th className="px-3 py-2 font-medium text-right">
                      Total Invoiced
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={
                    isDark ? 'divide-y divide-slate-700' : 'divide-y divide-slate-100'
                  }
                >
                  {tariffs.map((tariff) => {
                    const progress = tariff.consumed_quantity;
                    const value =
                      tariff.consumed_quantity *
                      (typeof tariff.rate === 'string'
                        ? Number(tariff.rate.replace(/,/g, '')) || 0
                        : tariff.rate || 0);
                    const invoiced = (tariff as any).invoiced || 0;
                    return (
                      <tr
                        key={tariff.id}
                        className={
                          isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50/60'
                        }
                      >
                        <td
                          className={`px-3 py-2 font-medium ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}
                        >
                          {tariff.description}
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone="indigo">
                            {tariff.unit.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(tariff.rate, contract.currency)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {progress}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatCurrency(value, contract.currency)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-indigo-600">
                          {formatCurrency(invoiced)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot
                  className={
                    isDark
                      ? 'bg-slate-800 border-t-2 border-slate-600'
                      : 'bg-slate-100 border-t-2 border-slate-300'
                  }
                >
                  <tr>
                    <td
                      colSpan={3}
                      className={`px-3 py-2.5 text-sm font-bold text-left uppercase tracking-wider ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      💰 Total
                    </td>
                    <td
                      className={`px-3 py-2.5 text-center font-mono font-bold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    ></td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(
                        tariffs.reduce(
                          (sum, t) =>
                            sum +
                            (t.consumed_quantity || 0) *
                              (typeof t.rate === 'string'
                                ? Number(t.rate.replace(/,/g, '')) || 0
                                : t.rate || 0),
                          0
                        ),
                        contract.currency
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-indigo-700">
                      {formatCurrency(
                        tariffs.reduce(
                          (sum, t) => sum + ((t as any).invoiced || 0),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}