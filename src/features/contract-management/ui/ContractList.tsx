// src/features/contract-management/ui/ContractList.tsx

import { Button, Badge } from '@design-system';
import { useTheme } from '@app/providers/ThemeProvider';
import { usePermission } from '@shared/authorization/hooks/usePermission';
import { PermissionGuard } from '@shared/authorization/ui/PermissionGuard';
import { usePermissionMapping } from '@shared/authorization/hooks/usePermissionMapping';
import { showToast } from '@shared/ui/ToastContainer';
import type { Contract } from '@entities/contract/types';
import { formatCurrency } from '@shared/lib/formatters';
import {
  calculateProgressFromTariffs,
  calculateDaysProgress,
  calculateDaysLeft,
  getDaysUntilStart,
  getContractFinancialStatus,
  isExpiringSoon,
  getDaysProgressColor,
} from '@entities/contract/services/contractCalculations';

interface ContractListProps {
  contracts: Contract[];
  filteredContracts: Contract[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: 'ALL' | 'CONTRACT' | 'WORK_ORDER';
  setTypeFilter: (type: 'ALL' | 'CONTRACT' | 'WORK_ORDER') => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'NOT_STARTED' | 'NEEDS_REVIEW' | 'COMPLETED';
  setStatusFilter: (status: 'ALL' | 'ACTIVE' | 'NOT_STARTED' | 'NEEDS_REVIEW' | 'COMPLETED') => void;
  sortBy: 'date' | 'value' | 'status';
  setSortBy: (sort: 'date' | 'value' | 'status') => void;
  selectedContract: Contract | null;
  setSelectedContract: (contract: Contract) => void;
  onAddClick: () => void;
  onExport: () => void;
  canCreate?: boolean;
  canExport?: boolean;
  canRead?: boolean;
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
  canCreate = true,
  canExport = true,
  canRead = true,
}: ContractListProps) {
  const { isDark } = useTheme();
  
  const { canAny } = usePermission();
  const canViewFinancial = canAny(['contract:read', 'contract:view_all', 'contract:view_own']);
  
  const { canAccessElement } = usePermissionMapping();

  const handleContractClick = (contract: Contract) => {
    if (!canRead) {
      showToast('error', 'Access Denied', 'You do not have permission to view contracts');
      return;
    }
    
    if (!canAccessElement('contract_list_item_click')) {
      showToast('error', 'Access Denied', 'You do not have permission to view contract details');
      return;
    }
    
    setSelectedContract(contract);
  };

  const canFilterType = canAccessElement('contract_filter_type');
  const canFilterStatus = canAccessElement('contract_filter_status');
  const canSearch = canAccessElement('contract_search_box');
  const canSort = canAccessElement('contract_sort_select');

  return (
    <div className={`col-span-1 lg:col-span-4 relative flex flex-col rounded-xl panel-3d overflow-hidden transition-all duration-300 ease-in-out max-h-[50vh] lg:max-h-none ${
      isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200/70'}`}>
      
      <PermissionGuard 
        elementId="contract_list_item_view" 
        fallback={
          <div className="p-8 text-center">
            <div className="text-4xl mb-2">🔒</div>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              You don't have permission to view contracts
            </p>
          </div>
        }
      >
        <div className={`relative z-10 border-b px-4 py-4 space-y-3 ${
          isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
          
          {/* 🔗 contract_search_box */}
          <div className={`flex items-center gap-3 ${!canSearch ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="relative flex-1">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Contract No, ..."
                disabled={!canSearch}
                className={`w-full rounded-lg py-2 pl-9 pr-8 text-sm input-themed ${
                  !canSearch ? 'cursor-not-allowed' : ''
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'value' | 'status')}
                disabled={!canSort}
                className={`appearance-none text-xs rounded-md border pl-2 pr-6 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer ${
                  isDark ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                } ${!canSort ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <option value="date">Latest First</option>
                <PermissionGuard elementId="contract_stat_total_value" fallback={null}>
                  {canViewFinancial && <option value="value">Highest Value</option>}
                </PermissionGuard>
                <option value="status">By Status</option>
              </select>
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>▼</span>
            </div>
          </div>

                    {/* 🔗 contract_filter_type */}
          <div className={`flex gap-1 rounded-lg border p-0.5 text-xs ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          } ${!canFilterType ? 'opacity-50 pointer-events-none' : ''}`}>
            {(['ALL', 'CONTRACT', 'WORK_ORDER'] as const).map((t) => {
              const count = t === 'ALL' ? contracts.length : t === 'CONTRACT' ? contracts.filter(c => c.type === 'CONTRACT').length : contracts.filter(c => c.type === 'WORK_ORDER').length;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  disabled={!canFilterType}
                  className={`flex-1 rounded px-1 py-1.5 font-medium transition-all whitespace-nowrap ${
                    typeFilter === t
                      ? (isDark 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 border border-indigo-500'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm')
                      : (isDark 
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
                  } ${!canFilterType ? 'cursor-not-allowed' : ''}`}
                >
                  {/* 🔧 FIX: اگه دسترسی نداره، count رو نشون نده */}
                  {t === 'ALL' ? (canFilterType ? `All (${count})` : 'All') : 
                   t === 'CONTRACT' ? (canFilterType ? `📄 (${count})` : '📄') : 
                   (canFilterType ? `📦 (${count})` : '📦')}
                </button>
              );
            })}
          </div>

                    {/* 🔗 contract_filter_status */}
          <div className={`flex gap-1 rounded-lg border p-1 text-xs ${
            isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          } ${!canFilterStatus ? 'opacity-50 pointer-events-none' : ''}`}>
            {(['ALL', 'ACTIVE', 'NOT_STARTED', 'NEEDS_REVIEW', 'COMPLETED'] as const).map((t) => {
              const baseFiltered = typeFilter === 'ALL' ? contracts : contracts.filter(c => c.type === typeFilter);
              let count = 0;
              
              if (t === 'ALL') count = baseFiltered.length;
              else if (t === 'ACTIVE') count = baseFiltered.filter(c => getContractFinancialStatus(c) === 'active').length;
              else if (t === 'NOT_STARTED') count = baseFiltered.filter(c => getContractFinancialStatus(c) === 'not_started').length;
              else if (t === 'NEEDS_REVIEW') count = baseFiltered.filter(c => getContractFinancialStatus(c) === 'needs_review').length;
              else if (t === 'COMPLETED') count = baseFiltered.filter(c => getContractFinancialStatus(c) === 'completed').length;
              
              return (
                <button
                  key={t}
                  onClick={() => setStatusFilter(t)}
                  disabled={!canFilterStatus}
                  className={`flex-1 rounded px-1 py-1.5 font-medium transition-all whitespace-nowrap ${
                    statusFilter === t
                      ? (isDark 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 border border-emerald-500'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm')
                      : (isDark 
                          ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                  } ${!canFilterStatus ? 'cursor-not-allowed' : ''}`}
                >
                  {/* 🔧 FIX: اگه دسترسی نداره، count رو نشون نده */}
                  {t === 'ALL' ? (canFilterStatus ? `All (${count})` : 'All') : 
                   t === 'ACTIVE' ? (canFilterStatus ? `🟢 (${count})` : '🟢') : 
                   t === 'NOT_STARTED' ? (canFilterStatus ? `⏳ (${count})` : '⏳') : 
                   t === 'NEEDS_REVIEW' ? (canFilterStatus ? `⚠️ (${count})` : '⚠️') : 
                   (canFilterStatus ? `✓ (${count})` : '✓')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contract List */}
        <div className="flex-1 overflow-y-auto pb-24">
          {filteredContracts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>No contracts found</p>
            </div>
          ) : (
            filteredContracts.map((contract) => {
              const canClick = canAccessElement('contract_list_item_click');
              
              return (
                <div
                  key={contract.id}
                  onClick={() => handleContractClick(contract)}
                  className={`flex flex-col gap-2 px-4 py-3 border-b transition-colors ${
                    canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                  } ${
                    isDark ? 'border-slate-700' : 'border-slate-100'
                  } ${
                    selectedContract?.id === contract.id
                      ? (isDark ? 'bg-indigo-900/30 border-l-4 border-l-indigo-400' : 'bg-indigo-50 border-l-4 border-l-indigo-500')
                      : (isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50')
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tone={contract.type === 'CONTRACT' ? 'indigo' : 'amber'}>
                          {contract.type === 'CONTRACT' ? '📄 Contract' : '📦 Work Order'}
                        </Badge>
                        <span className={`font-mono text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {contract.contract_no}
                        </span>
                      </div>
                      <div className={`text-sm font-medium truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {contract.contract_title}
                      </div>
                      <div className={`text-xs truncate ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {contract.client_name}
                      </div>
                    </div>
                    
                    {/* 🔗 contract_status_badge */}
                    <PermissionGuard elementId="contract_status_badge" fallback={null}>
                      {(() => {
                        const financialStatus = getContractFinancialStatus(contract);
                        const expiringInfo = isExpiringSoon(contract);
                        
                        if (contract.status === 'COMPLETED') {
                          return <Badge tone="slate">✓ Completed</Badge>;
                        }
                        
                        if (expiringInfo.expiring) {
                          return (
                            <Badge tone="danger" className="gap-1 animate-pulse">
                              <span>⚠️</span>
                              <span>Expiring Soon</span>
                            </Badge>
                          );
                        }
                        
                        if (financialStatus === 'not_started') {
                          return (
                            <Badge tone="amber" className="gap-1">
                              <span>⏳</span>
                              <span>Not Started</span>
                            </Badge>
                          );
                        }
                        
                        if (financialStatus === 'needs_review') {
                          return (
                            <Badge tone="amber" className="gap-1">
                              <span>⚠️</span>
                              <span>Needs Review</span>
                            </Badge>
                          );
                        }
                        
                        return <Badge tone="emerald">🟢 Active</Badge>;
                      })()}
                    </PermissionGuard>
                  </div>
                  
                  {/* 🔗 contract_dates */}
                  <PermissionGuard elementId="contract_dates" fallback={null}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                        {contract.start_date} → {contract.end_date}
                      </span>
                      {/* 🔗 contract_list_value */}
                      <PermissionGuard elementId="contract_list_value" fallback={
                        <span className={`font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          🔒 Locked
                        </span>
                      }>
                        {canViewFinancial ? (
                          <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {formatCurrency(contract.total_value, contract.currency)}
                          </span>
                        ) : (
                          <span className={`font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            🔒 Locked
                          </span>
                        )}
                      </PermissionGuard>
                    </div>
                  </PermissionGuard>

                  {(() => {
                    const financialStatus = getContractFinancialStatus(contract);
                    
                    if (contract.status === 'COMPLETED' || financialStatus === 'completed') {
                      return (
                        <div className="mt-1">
                          {/* 🔗 contract_progress_bar */}
                          <PermissionGuard elementId="contract_progress_bar" fallback={null}>
                            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isDark ? 'bg-slate-500' : 'bg-slate-400'}`}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </PermissionGuard>
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                              Time Progress
                            </span>
                            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              ✓ Completed
                            </span>
                          </div>
                        </div>
                      );
                    }
                  
                    if (financialStatus === 'not_started') {
                      const daysUntilStart = getDaysUntilStart(contract.start_date);
                      return (
                        /* 🔗 contract_progress_bar */
                        <PermissionGuard elementId="contract_progress_bar" fallback={null}>
                          <div className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
                            isDark ? 'border-amber-700 bg-amber-900/20 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            <div className="flex items-center gap-2">
                              <span>⏳</span>
                              <span className="font-medium">Starts in {daysUntilStart} days</span>
                            </div>  
                          </div>
                        </PermissionGuard>
                      );
                    }
                    
                    const daysProgress = calculateDaysProgress(contract);
                    const daysLeft = calculateDaysLeft(contract.end_date);
                    const isExpired = daysLeft < 0;
                    
                    return (
                      <div className="mt-1">
                        {/* 🔗 contract_progress_bar */}
                        <PermissionGuard elementId="contract_progress_bar" fallback={null}>
                          <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getDaysProgressColor(daysProgress)}`}
                              style={{ width: `${Math.min(daysProgress, 100)}%` }}
                            />
                          </div>
                        </PermissionGuard>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Time Progress
                          </span>
                          {/* 🔗 contract_progress_bar */}
                          <PermissionGuard elementId="contract_progress_bar" fallback={
                            <span className={`font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              🔒
                            </span>
                          }>
                            <span className={`font-semibold ${
                              isExpired 
                                ? (isDark ? 'text-rose-400' : 'text-rose-600')
                                : daysLeft <= 30 
                                  ? (isDark ? 'text-amber-400' : 'text-amber-600')
                                  : (isDark ? 'text-emerald-400' : 'text-emerald-600')
                            }`}>
                              {isExpired 
                                ? `${Math.abs(daysLeft)} days overdue` 
                                : daysLeft === 0 
                                  ? 'Expires today'
                                  : `${daysLeft} days left`}
                              <span className={`ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                ({daysProgress.toFixed(0)}%)
                              </span>
                            </span>
                          </PermissionGuard>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </PermissionGuard>

      {/* Gradient Fade */}
      <div className={`absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t pointer-events-none z-10 ${
        isDark 
          ? 'from-slate-900 via-slate-900/95 to-slate-900/0'
          : 'from-white via-white/95 to-white/0'}`} />
      
      {/* Action Buttons */}
      <div className="absolute bottom-5 left-0 right-0 px-4 z-20 flex gap-2">
        {/* 🔗 contract_btn_add */}
        <PermissionGuard elementId="contract_btn_add" fallback={null}>
          <Button
            variant="primary"
            size="md"
            onClick={onAddClick}
            className={`flex-1 justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 ${
              isDark 
                ? 'border border-indigo-400/30 shadow-[0_8px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.6)]'
                : 'shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30'}`}
          >
            <span>➕</span> 
            {typeFilter === 'ALL' ? 'Add New Agreement' : 
             typeFilter === 'CONTRACT' ? 'Add New Contract' : 'Add New Work Order'}
          </Button>
        </PermissionGuard>

        {/* 🔗 contract_btn_export */}
        <PermissionGuard elementId="contract_btn_export" fallback={null}>
          <Button
            variant="secondary"
            size="md"
            onClick={onExport}
            className={`transition-all duration-300 hover:-translate-y-0.5 ${
              isDark 
                ? 'border border-slate-700 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.5)]'
                : 'shadow-lg shadow-slate-300/50 hover:shadow-xl hover:shadow-slate-400/50'}`}
            title="Export to Excel"
          >
            📥
          </Button>
        </PermissionGuard>
      </div>
    </div>
  );
}