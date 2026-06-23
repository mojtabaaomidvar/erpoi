// src/views/contracts/components/ContractDetails.tsx
import { useMemo } from 'react';
import { Button, Badge, Card } from '../../../design-system';
import { cn } from '../../../lib/cn';
import { useTheme } from '../../../contexts/ThemeContext';
import type { Contract, TariffLine } from '../../../types/contract';
import { contractTariffs } from '../../../data/mockData';
import { formatCurrency } from '../../../lib/formatters';
import {
  calculateProgressFromTariffs,
  calculateInvoiceProgress,
  calculateDaysProgress,
  calculateDaysLeft,
  getDaysUntilStart,
  getContractFinancialStatus,
  getAdjustmentReminder,
  isExpiringSoon,
  getProgressColor,
  getProgressTextClass,
  getProgressTextColor,
  getDaysProgressColor,
  getInvoicedPercentage,
} from '../../../lib/contractCalculations';

interface ContractDetailsProps {
  contract: Contract | null;
  onClose: () => void;
  onEdit: () => void;
  onRequestComplete: (contract: Contract) => void;
  userRole: 'admin' | 'user';
}

export function ContractDetails({
  contract,
  onClose,
  onEdit,
  onRequestComplete,
  userRole,
}: ContractDetailsProps) {
  const { isDark } = useTheme();

  const selectedTariffs = useMemo(() => {
    if (!contract) return [];
    return contractTariffs.filter((t) => t.contract_id === contract.id);
  }, [contract]);

  const totalPerformedWork = useMemo(() => {
    if (!contract) return 0;
    return selectedTariffs.reduce((sum, t) => {
      const rate = typeof t.rate === 'string' ? Number(t.rate.replace(/,/g, '')) || 0 : (t.rate || 0);
      const consumed = t.consumed_quantity || 0;
      return sum + (rate * consumed);
    }, 0);
  }, [contract, selectedTariffs]);

  // حالت خالی - وقتی قراردادی انتخاب نشده
  if (!contract) {
    return (
      <div className={`flex-1 flex items-center justify-center relative overflow-hidden min-h-[600px] ${
        isDark
          ? 'bg-gradient-to-br from-slate-800 via-card to-indigo-950/30'
          : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${isDark ? '%23ffffff' : '%23000000'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="text-center z-10 relative">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 blur-2xl opacity-40 animate-pulse" />
            <div className={`relative inline-flex items-center justify-center w-44 h-44 rounded-full shadow-2xl shadow-indigo-500/30 border-4 ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-white'
            }`}>
              <img src="/images/logo.png" alt="ICS Logo" className="w-36 h-36 object-contain" />
            </div>
          </div>

          <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            OFFSHORE & ENERGY DEPARTMENT INSPECTION PLATFORM
          </h2>
          <p className={`text-base max-w-md mx-auto leading-relaxed ${isDark ? 'text-secondary' : 'text-slate-500'}`}>
            Select a contract from the list to view details, tariffs, and progress information
          </p>

          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>📄</div>
              <span className={`text-xs font-medium ${isDark ? 'text-secondary' : 'text-slate-500'}`}>Contracts</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>📊</div>
              <span className={`text-xs font-medium ${isDark ? 'text-secondary' : 'text-slate-500'}`}>Tariffs</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-amber-900/50' : 'bg-amber-100'}`}>📈</div>
              <span className={`text-xs font-medium ${isDark ? 'text-secondary' : 'text-slate-500'}`}>Progress</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // حالت نمایش جزئیات قرارداد
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
      <div className={`border-b border-theme px-6 py-4 ${
        isDark
          ? 'bg-gradient-to-r from-slate-800 to-card'
          : 'bg-gradient-to-r from-slate-50 to-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary">Contract Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`transition-colors ${
              isDark ? 'text-muted hover:text-rose-400 hover:bg-rose-900/30' : 'text-muted hover:text-rose-600 hover:bg-rose-50'
            }`}
          >✕ Close Panel</Button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-lg font-bold">📄</div>
            <div>
              <h3 className="text-xl font-bold text-primary truncate min-w-0 max-w-[450px]" title={contract.contract_title}>
                {contract.contract_title}
              </h3>
              <p className="text-sm text-secondary font-mono">{contract.contract_no} • {contract.client_name}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge tone={contract.type === 'CONTRACT' ? 'indigo' : 'amber'}>
                  {contract.type === 'CONTRACT' ? '📄 Contract' : '📦 Work Order'}
                </Badge>
                {contract.status === 'COMPLETED' ? (
                  <Badge tone="slate">✓ Completed</Badge>
                ) : financialStatus === 'needs_review' ? (
                  <div className="flex items-center gap-2">
                    <Badge tone="amber" className="gap-1">
                      <span>⚠️</span>
                      <span>Needs Financial Review</span>
                    </Badge>
                    {userRole === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRequestComplete(contract)}
                        className={`gap-1 text-xs ${
                          isDark ? 'border-amber-600 text-amber-300 hover:bg-amber-900/30' : 'border-amber-300 text-amber-700 hover:bg-amber-50'
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
          <Button
            variant="outline"
            size="md"
            onClick={onEdit}
            disabled={contract.status === 'COMPLETED' || financialStatus === 'completed'}
            className={`gap-2 shadow-sm ${
              (contract.status === 'COMPLETED' || financialStatus === 'completed')
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            title={
              (contract.status === 'COMPLETED' || financialStatus === 'completed')
                ? 'Completed contracts cannot be edited'
                : 'Edit contract'
            }
          >
            <span>✏️</span> Edit
          </Button>
        </div>
      </div>

      {/* یادآوری تعدیل */}
      {reminder.show && (
        <div className={`rounded-lg border-2 p-4 ${
          reminder.mode === 'TBD'
            ? (isDark ? 'border-amber-600 bg-amber-950/40' : 'border-amber-400 bg-amber-50')
            : (isDark ? 'border-indigo-600 bg-indigo-950/40' : 'border-indigo-400 bg-indigo-50')
        }`}>
          <div className="flex items-start gap-3">
            <div className="text-2xl">{reminder.mode === 'TBD' ? '⏳' : '📊'}</div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold mb-1 ${
                reminder.mode === 'TBD'
                  ? (isDark ? 'text-amber-200' : 'text-amber-900')
                  : (isDark ? 'text-indigo-200' : 'text-indigo-900')
              }`}>
                Price Adjustment Reminder
              </h4>
              <p className={`text-xs mb-2 ${
                reminder.mode === 'TBD'
                  ? (isDark ? 'text-amber-300' : 'text-amber-800')
                  : (isDark ? 'text-indigo-300' : 'text-indigo-800')
              }`}>
                {reminder.mode === 'TBD'
                  ? `Adjustment percentage needs to be determined. Effective date: ${reminder.effectiveDate}`
                  : `Adjustment will be applied. Effective date: ${reminder.effectiveDate}`
                }
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Days until effective: </span>
                  <span className={`font-bold ${
                    reminder.daysUntil <= 7 ? 'text-rose-500' :
                    reminder.daysUntil <= 15 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {reminder.daysUntil} days
                  </span>
                </div>
                {reminder.mode === 'FIXED' && reminder.percentage > 0 && (
                  <div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Percentage: </span>
                    <span className="font-bold text-indigo-500">{reminder.percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* محتوای قابل اسکرول */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <div className="space-y-6">
          {/* اطلاعات قرارداد */}
          <div className={`rounded-lg border border-theme p-4 bg-muted/30`}>
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">📋 Contract Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Internal Contract No.</div>
                <div className="font-mono text-xs text-primary">{contract.contract_no}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">External Contract No.</div>
                <div className="font-mono text-xs text-primary">{contract.external_contract_no || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Currency</div>
                <div className="text-xs text-primary">{contract.currency}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Start Date</div>
                <div className="text-xs text-primary">{contract.start_date}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">End Date</div>
                <div className="text-xs text-primary">{contract.end_date}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Total Value</div>
                <div className="text-xs font-semibold text-accent-emerald">{formatCurrency(contract.total_value, contract.currency)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Total Performed Works</div>
                <div className="text-xs font-semibold text-accent-emerald">{formatCurrency(totalPerformedWork, contract.currency)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Invoiced</div>
                <div className="text-xs font-semibold text-accent-indigo">
                  {formatCurrency(selectedTariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-secondary font-semibold mb-1">Not Invoiced</div>
                <div className="text-xs font-semibold text-accent-rose">
                  {(() => {
                    const totalInvoiced = selectedTariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0);
                    const notInvoiced = Math.max(0, totalPerformedWork - totalInvoiced);
                    return formatCurrency(notInvoiced, contract.currency);
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* کارت‌های پیشرفت */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <Card className={`rounded-lg border p-4 ${isDark ? 'border-slate-500 bg-slate-800/30' : 'border-slate-200'}`}>
              <div className="text-xs text-secondary">Total Performed Work (%)</div>
              {(() => {
                const workProgress = calculateProgressFromTariffs(contract);
                return (
                  <>
                    <div className={`text-lg font-bold ${getProgressTextClass(workProgress)}`}>
                      {workProgress.toFixed(2)}%
                    </div>
                    <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full ${getProgressColor(workProgress)}`}
                        style={{ width: `${Math.min(workProgress, 100)}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </Card>

            <Card className={`rounded-lg border p-4 ${isDark ? 'border-slate-500 bg-slate-800/30' : 'border-slate-200'}`}>
              <div className="text-xs text-secondary">Total Invoiced (%)</div>
              {(() => {
                const spent = calculateInvoiceProgress(contract);
                return (
                  <>
                    <div className={`text-lg font-bold ${getProgressTextColor(spent)}`}>
                      {spent.toFixed(1)}%
                      {spent > 100 && <span className="text-xs ml-1">(Over)</span>}
                    </div>
                    <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full ${getProgressColor(spent)}`}
                        style={{ width: `${Math.min(spent, 100)}%` }}
                      />
                    </div>
                  </>
                );
              })()}
            </Card>

            <Card className={`rounded-lg border p-4 ${isDark ? 'border-slate-500 bg-slate-800/30' : 'border-slate-200'}`}>
              {notStarted ? (
                <>
                  <div className="text-xs text-secondary">Status</div>
                  <div className="text-lg font-bold text-amber-600">⏳ Not Started</div>
                  <div className="text-[10px] text-amber-500 mt-0.5">Starts in {daysUntilStart} days</div>
                </>
              ) : contract.status === 'COMPLETED' ? (
                <>
                  <div className="text-xs text-secondary">Status</div>
                  <div className="text-lg font-bold text-slate-600">✓ Completed</div>
                </>
              ) : needsFinancialReview ? (
                <>
                  <div className="text-xs text-secondary mb-2">Financial Status</div>
                  <div className="text-lg font-bold text-amber-600 mb-2">⚠️ Needs Review</div>
                  <button
                    onClick={() => userRole === 'admin' && onRequestComplete(contract)}
                    disabled={userRole !== 'admin'}
                    className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                      userRole === 'admin'
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm cursor-pointer'
                        : (isDark ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60')
                    }`}
                    title={userRole !== 'admin' ? 'Only managers can approve completion' : 'Click to mark as completed'}
                  >
                    {userRole === 'admin' ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span>✓</span>
                        <span>Mark as Completed</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <span>🔒</span>
                        <span>Manager Approval Required</span>
                      </span>
                    )}
                  </button>
                </>
              ) : daysLeft < 0 ? (
                <>
                  <div className="text-xs text-secondary">Status</div>
                  <div className="text-lg font-bold text-rose-600">{Math.abs(daysLeft)} days overdue</div>
                </>
              ) : daysLeft === 0 ? (
                <>
                  <div className="text-xs text-secondary">Time Remaining</div>
                  <div className="text-lg font-bold text-amber-600">Today (Expires)</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-secondary">Time Remaining</div>
                  <div className="text-lg font-bold text-emerald-600">{daysLeft} days remaining</div>
                </>
              )}
            </Card>
          </div>

          {/* جدول تعرفه‌ها */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3">
              Tariff Lines & Consumption ({selectedTariffs.length})
            </h3>
            {selectedTariffs.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">
                No tariff lines defined for this contract
              </div>
            ) : (
              <div className={`overflow-x-auto rounded-lg border border-theme`}>
                <table className="w-full text-left text-xs">
                  <thead className={`bg-muted text-[9px] uppercase tracking-wide text-secondary`}>
                    <tr>
                      <th className="px-3 py-2 font-medium">Description</th>
                      <th className="px-3 py-2 font-medium">Unit</th>
                      <th className="px-3 py-2 font-medium text-right">Rate</th>
                      <th className="px-3 py-2 font-medium text-center">Performed Work</th>
                      <th className="px-3 py-2 font-medium text-right">Total Value of Performed Works</th>
                      <th className="px-3 py-2 font-medium text-right">Total Invoiced</th>
                    </tr>
                  </thead>
                  <tbody className={isDark ? 'divide-y divide-slate-700' : 'divide-y divide-slate-100'}>
                    {selectedTariffs.map((tariff) => {
                      const value = tariff.consumed_quantity * (typeof tariff.rate === 'string' ? Number(tariff.rate.replace(/,/g, '')) || 0 : (tariff.rate || 0));
                      const invoiced = (tariff as any).invoiced || 0;
                      return (
                        <tr key={tariff.id} className={isDark ? 'hover:bg-muted/60' : 'hover:bg-muted/60'}>
                          <td className="px-3 py-2 font-medium text-primary">{tariff.description}</td>
                          <td className="px-3 py-2 text-[9px]">
                            <Badge tone="indigo">{tariff.unit.replace('_', ' ')}</Badge>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{formatCurrency(tariff.rate, contract.currency)}</td>
                          <td className="px-3 py-2 text-center font-mono">{tariff.consumed_quantity}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-accent-emerald">
                            {formatCurrency(value, contract.currency)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-accent-indigo">
                            {formatCurrency(invoiced)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className={isDark ? 'bg-muted border-t-2 border-slate-600' : 'bg-slate-100 border-t-2 border-slate-300'}>
                    <tr>
                      <td colSpan={3} className="px-3 py-2.5 text-sm font-bold text-left uppercase tracking-wider text-primary">💰 Total</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-primary"></td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-accent-emerald">
                        {formatCurrency(selectedTariffs.reduce((sum, t) => {
                          const rate = typeof t.rate === 'string' ? Number(t.rate.replace(/,/g, '')) || 0 : (t.rate || 0);
                          return sum + ((t.consumed_quantity || 0) * rate);
                        }, 0))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-accent-indigo">
                        {formatCurrency(selectedTariffs.reduce((sum, t) => sum + ((t as any).invoiced || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}