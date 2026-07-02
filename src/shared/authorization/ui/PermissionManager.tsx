// src/shared/authorization/ui/PermissionManager.tsx
// 🎯 پنل ادمین برای مدیریت Mapping بین Permission ها و UI Elements
// 💾 استفاده از IndexedDB به جای localStorage
// 🎨 Floating Action Bar برای Save/Cancel

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { db } from '@shared/database';
import type { DBPermissionMapping, DBUIElement } from '@shared/database/types';
import { FloatingActionBar } from '@shared/ui/FloatingActionBar';
import { confirmDialog } from '@shared/ui/ConfirmDialog';
import { showToast } from '@shared/ui/ToastContainer';

// 🎯 Default UI Elements (اگه در DB نباشن)
const DEFAULT_UI_ELEMENTS: Omit<DBUIElement, 'id'>[] = [
  // Clients Module
  { name: 'Total Clients Card', type: 'card', entity: 'client', module: 'clients', component: 'ClientList' },
  { name: 'Legal Clients Card', type: 'card', entity: 'client', module: 'clients', component: 'ClientList' },
  { name: 'Individual Clients Card', type: 'card', entity: 'client', module: 'clients', component: 'ClientList' },
  { name: 'Add Client Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientList' },
  { name: 'Export Clients Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientList' },
  { name: 'Edit Client Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientDetails' },
  { name: 'Delete Client Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientDetails' },
  { name: 'Add Client Modal', type: 'modal', entity: 'client', module: 'clients', component: 'ClientForm' },
  { name: 'Edit Client Modal', type: 'modal', entity: 'client', module: 'clients', component: 'ClientEditModal' },
  { name: 'National ID Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
  { name: 'Phone Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
  { name: 'Email Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
  { name: 'Address Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
  { name: 'Client List Item', type: 'list_item', entity: 'client', module: 'clients', component: 'ClientList' },
  { name: 'Client Contracts Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },
  { name: 'Client Total Value Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },
  { name: 'Client Invoiced Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },
  { name: 'Client Not Invoiced Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },

  // Contracts Module
  { name: 'Total Contracts Card', type: 'card', entity: 'contract', module: 'contracts', component: 'ContractList' },
  { name: 'Active Contracts Card', type: 'card', entity: 'contract', module: 'contracts', component: 'ContractList' },
  { name: 'Expiring Contracts Card', type: 'card', entity: 'contract', module: 'contracts', component: 'ContractList' },
  { name: 'Add Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractList' },
  { name: 'Export Contracts Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractList' },
  { name: 'Edit Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Delete Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Approve Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Add Contract Modal', type: 'modal', entity: 'contract', module: 'contracts', component: 'ContractForm' },
  { name: 'Edit Contract Modal', type: 'modal', entity: 'contract', module: 'contracts', component: 'ContractForm' },
  { name: 'Total Value Field', type: 'form_field', entity: 'contract', module: 'contracts', component: 'ContractForm' },
  { name: 'Currency Field', type: 'form_field', entity: 'contract', module: 'contracts', component: 'ContractForm' },
  { name: 'Tariffs Section', type: 'section', entity: 'contract', module: 'contracts', component: 'ContractForm' },
  { name: 'Financial Terms Section', type: 'section', entity: 'contract', module: 'contracts', component: 'ContractForm' },
  { name: 'Work Progress Bar', type: 'progress_bar', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Invoice Progress Bar', type: 'progress_bar', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Time Progress Bar', type: 'progress_bar', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Total Value Stat', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Invoiced Stat', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Not Invoiced Stat', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Tariffs Table', type: 'table_column', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
  { name: 'Contract List Item', type: 'list_item', entity: 'contract', module: 'contracts', component: 'ContractList' },
  { name: 'Contract Value in List', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractList' },

  // Invoices Module
  { name: 'Total Invoices Card', type: 'card', entity: 'invoice', module: 'invoices', component: 'InvoiceList' },
  { name: 'Create Invoice Button', type: 'button', entity: 'invoice', module: 'invoices', component: 'InvoiceList' },
  { name: 'Export Invoices Button', type: 'button', entity: 'invoice', module: 'invoices', component: 'InvoiceList' },
  { name: 'Total Invoice Amount', type: 'stat', entity: 'invoice', module: 'invoices', component: 'InvoiceDetails' },

  // Inspections Module
  { name: 'Total Inspections Card', type: 'card', entity: 'inspection', module: 'inspections', component: 'InspectionList' },
  { name: 'Create Inspection Button', type: 'button', entity: 'inspection', module: 'inspections', component: 'InspectionList' },
  { name: 'Inspection Progress', type: 'progress_bar', entity: 'inspection', module: 'inspections', component: 'InspectionDetails' },

  // Dashboard Module
  { name: 'Dashboard Clients Stat', type: 'stat', entity: 'client', module: 'dashboard', component: 'Dashboard' },
  { name: 'Dashboard Contracts Stat', type: 'stat', entity: 'contract', module: 'dashboard', component: 'Dashboard' },
  { name: 'Dashboard Invoices Stat', type: 'stat', entity: 'invoice', module: 'dashboard', component: 'Dashboard' },
  { name: 'Revenue Chart', type: 'chart', entity: 'invoice', module: 'dashboard', component: 'Dashboard' },
  { name: 'Inspections Chart', type: 'chart', entity: 'inspection', module: 'dashboard', component: 'Dashboard' },
];

// 🎯 Default Permission Mappings
const DEFAULT_MAPPINGS: Omit<DBPermissionMapping, 'updatedAt'>[] = [
  // Client Permissions
  { permission: 'client:create', allowedElements: ['client_btn_add', 'client_modal_add', 'client_field_national_id', 'client_field_phone', 'client_field_email', 'client_field_address'], deniedElements: [] },
  { permission: 'client:read', allowedElements: ['client_card_total', 'client_card_legal', 'client_card_individual', 'client_list_item', 'client_field_national_id', 'client_field_phone', 'client_field_email', 'client_field_address', 'client_stat_contracts', 'dashboard_stat_clients'], deniedElements: [] },
  { permission: 'client:update', allowedElements: ['client_btn_edit', 'client_modal_edit', 'client_field_national_id', 'client_field_phone', 'client_field_email', 'client_field_address'], deniedElements: [] },
  { permission: 'client:delete', allowedElements: ['client_btn_delete'], deniedElements: [] },
  { permission: 'client:export', allowedElements: ['client_btn_export'], deniedElements: [] },
  { permission: 'client:view_all', allowedElements: ['client_card_total', 'client_card_legal', 'client_card_individual', 'client_list_item'], deniedElements: [] },
  { permission: 'client:view_own', allowedElements: ['client_card_total', 'client_list_item'], deniedElements: [] },

  // Contract Permissions
  { permission: 'contract:create', allowedElements: ['contract_btn_add', 'contract_modal_add', 'contract_field_total_value', 'contract_field_currency', 'contract_field_tariffs', 'contract_field_financial_terms'], deniedElements: [] },
  { permission: 'contract:read', allowedElements: ['contract_card_total', 'contract_card_active', 'contract_card_expiring', 'contract_list_item', 'contract_progress_work', 'contract_progress_time', 'contract_stat_total_value', 'contract_table_tariffs', 'contract_stat_invoiced', 'contract_stat_not_invoiced', 'contract_progress_invoice', 'contract_list_value', 'dashboard_stat_contracts'], deniedElements: [] },
  { permission: 'contract:update', allowedElements: ['contract_btn_edit', 'contract_modal_edit', 'contract_field_total_value', 'contract_field_currency', 'contract_field_tariffs', 'contract_field_financial_terms'], deniedElements: [] },
  { permission: 'contract:delete', allowedElements: ['contract_btn_delete'], deniedElements: [] },
  { permission: 'contract:export', allowedElements: ['contract_btn_export'], deniedElements: [] },
  { permission: 'contract:approve', allowedElements: ['contract_btn_approve'], deniedElements: [] },
  { permission: 'contract:view_all', allowedElements: ['contract_card_total', 'contract_card_active', 'contract_card_expiring', 'contract_list_item'], deniedElements: [] },
  { permission: 'contract:view_own', allowedElements: ['contract_card_total', 'contract_list_item'], deniedElements: [] },

  // Invoice Permissions
  { permission: 'invoice:create', allowedElements: ['invoice_btn_create'], deniedElements: [] },
  { permission: 'invoice:read', allowedElements: ['invoice_card_total', 'invoice_stat_total', 'dashboard_stat_invoices', 'dashboard_chart_revenue'], deniedElements: [] },
  { permission: 'invoice:export', allowedElements: ['invoice_btn_export'], deniedElements: [] },
  { permission: 'invoice:view_all', allowedElements: ['invoice_card_total'], deniedElements: [] },
  { permission: 'invoice:view_own', allowedElements: ['invoice_card_total'], deniedElements: [] },

  // Inspection Permissions
  { permission: 'inspection:create', allowedElements: ['inspection_btn_create'], deniedElements: [] },
  { permission: 'inspection:read', allowedElements: ['inspection_card_total', 'inspection_progress', 'dashboard_chart_inspections'], deniedElements: [] },
  { permission: 'inspection:view_all', allowedElements: ['inspection_card_total'], deniedElements: [] },
  { permission: 'inspection:view_own', allowedElements: ['inspection_card_total'], deniedElements: [] },
];

export function PermissionManager() {
  const { isDark } = useTheme();
  
  // 🎯 State
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [uiElements, setUiElements] = useState<DBUIElement[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFromDB = async () => {
    setLoading(true);
    try {
      // Load UI Elements
      let elements = await db.getAllUIElements();
      if (elements.length === 0) {
        // Initialize with defaults
        for (const el of DEFAULT_UI_ELEMENTS) {
          await db.createUIElement(el);
        }
        elements = await db.getAllUIElements();
      }
      setUiElements(elements);

      // Load Mappings
      const allMappings = await db.getAllPermissionMappings();
      if (allMappings.length === 0) {
        // Initialize with defaults
        for (const mapping of DEFAULT_MAPPINGS) {
          await db.setPermissionMapping(
            mapping.permission, 
            mapping.allowedElements, 
            mapping.deniedElements
          );
        }
        const freshMappings = await db.getAllPermissionMappings();
        const map = new Map(freshMappings.map(m => [m.permission, m]));
        setMappings(map);
      } else {
        const map = new Map(allMappings.map(m => [m.permission, m]));
        setMappings(map);
      }
    } catch (error: any) {
      console.error('Failed to load from DB:', error);
      showToast('error', 'Load Failed', error.message || 'Failed to load data from database');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Load from DB
  useEffect(() => {
    loadFromDB();
  }, []);
  
  // 🎯 Computed
  const entities = useMemo(() => [...new Set(uiElements.map(el => el.entity))].sort(), [uiElements]);
  const modules = useMemo(() => [...new Set(uiElements.map(el => el.module))].sort(), [uiElements]);
  const types = useMemo(() => [...new Set(uiElements.map(el => el.type))].sort(), [uiElements]);

  const allMappingsArray = useMemo(() => Array.from(mappings.values()).sort((a, b) => a.permission.localeCompare(b.permission)), [mappings]);

  const filteredElements = useMemo(() => {
    return uiElements.filter(el => {
      if (filterEntity && el.entity !== filterEntity) return false;
      if (filterModule && el.module !== filterModule) return false;
      if (filterType && el.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) ||
          el.name.toLowerCase().includes(q) ||
          el.component?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [uiElements, filterEntity, filterModule, filterType, searchQuery]);

  // 🎯 Check if there are pending changes
  const hasChanges = useMemo(() => pendingChanges.size > 0, [pendingChanges]);

  const selectedMapping = useMemo(() => {
    if (!selectedPermission) return null;
    return pendingChanges.get(selectedPermission) || mappings.get(selectedPermission) || null;
  }, [selectedPermission, pendingChanges, mappings]);

  // 🎯 Toggle یه UI Element برای permission انتخاب شده
  const handleToggleElement = useCallback((elementId: string) => {
    if (!selectedPermission) return;

    const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
    const currentAllowed = currentMapping?.allowedElements || [];
    const currentDenied = currentMapping?.deniedElements || [];

    const isAllowed = currentAllowed.includes(elementId);

    let newAllowed: string[];
    if (isAllowed) {
      newAllowed = currentAllowed.filter(id => id !== elementId);
    } else {
      newAllowed = [...currentAllowed, elementId];
    }

    const newMapping: DBPermissionMapping = {
      permission: selectedPermission,
      allowedElements: newAllowed,
      deniedElements: currentDenied,
      updatedAt: new Date().toISOString(),
    };

    setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  }, [selectedPermission, mappings, pendingChanges]);

  // 🎯 Save به دیتابیس
  const handleSave = useCallback(async () => {
    try {
      for (const [permission, mapping] of pendingChanges.entries()) {
        await db.setPermissionMapping(
          permission, 
          mapping.allowedElements, 
          mapping.deniedElements
        );
      }
      
      // Update mappings state
      setMappings(prev => {
        const newMap = new Map(prev);
        pendingChanges.forEach((mapping, permission) => {
          newMap.set(permission, mapping);
        });
        return newMap;
      });
      
      setPendingChanges(new Map());
      showToast('success', 'Saved Successfully', `${pendingChanges.size} permission mapping(s) saved to database`);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message || 'Failed to save changes');
      throw error;
    }
  }, [pendingChanges]);

  // 🎯 Cancel تغییرات
  const handleCancel = useCallback(() => {
    setPendingChanges(new Map());
    showToast('info', 'Changes Discarded', 'All pending changes have been discarded');
  }, []);

  // 🎯 Reset به defaults
  const handleReset = async () => {
    const confirmed = await confirmDialog({
      title: '⚠️ Reset to Defaults',
      message: 'Are you sure you want to reset all permission mappings to defaults?\n\nThis will remove all custom configurations and cannot be undone.',
      confirmText: 'Yes, Reset',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      // Clear all mappings
      await db.permissionMappings.clear();
      
      // Re-initialize with defaults
      for (const mapping of DEFAULT_MAPPINGS) {
        await db.setPermissionMapping(
          mapping.permission,
          mapping.allowedElements,
          mapping.deniedElements
        );
      }
      
      // Reload from DB
      await loadFromDB();
      setPendingChanges(new Map());
      setSelectedPermission('');
      showToast('success', 'Reset Complete', 'All mappings have been reset to defaults');
    } catch (error: any) {
      showToast('error', 'Reset Failed', error.message || 'Failed to reset');
    }
  };

  // 🎯 رنگ‌های type badge
  const typeColors: Record<string, string> = {
    card: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    progress_bar: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    button: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    modal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    table_column: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    form_field: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    section: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    stat: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    chart: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    list_item: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Loading data from database...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            🛡️ Permission Mapping Manager
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Define which UI elements are accessible for each permission
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/30"
        >
          <span>🔄</span>
          <span>Reset to Defaults</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Permissions</div>
          <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{allMappingsArray.length}</div>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>UI Elements</div>
          <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{uiElements.length}</div>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Entities</div>
          <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{entities.length}</div>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Modules</div>
          <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{modules.length}</div>
        </div>
        <div className={`rounded-xl p-4 border ${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'} shadow-sm`}>
          <div className={`text-xs font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Allowed (Selected)</div>
          <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-emerald-200' : 'text-emerald-800'}`}>
            {selectedMapping?.allowedElements.length || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
        <h2 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          🔍 Filters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Permission Selector */}
          <div className="lg:col-span-2">
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Permission *
            </label>
            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDark
                  ? 'border-slate-600 bg-slate-700 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">-- Select a Permission --</option>
              {allMappingsArray.map(m => {
                const isPending = pendingChanges.has(m.permission);
                return (
                  <option key={m.permission} value={m.permission}>
                    {isPending ? '🔴 ' : ''}{m.permission} ({m.allowedElements.length} elements)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Entity Filter */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Entity
            </label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDark
                  ? 'border-slate-600 bg-slate-700 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">All Entities</option>
              {entities.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Module
            </label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDark
                  ? 'border-slate-600 bg-slate-700 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">All Modules</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                isDark
                  ? 'border-slate-600 bg-slate-700 text-slate-100'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <option value="">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search by ID, name, or component..."
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400'
                : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Main Editor */}
      {selectedPermission ? (
        <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
          {/* Editor Header */}
          <div className={`px-6 py-4 border-b ${isDark ? 'bg-indigo-900/20 border-slate-700' : 'bg-indigo-50 border-slate-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  Editing: <code className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-indigo-300' : 'bg-white text-indigo-700'}`}>{selectedPermission}</code>
                  {pendingChanges.has(selectedPermission) && (
                    <span className="ml-2 text-xs text-amber-500 font-normal">(Unsaved Changes)</span>
                  )}
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Click on elements to toggle their access for this permission
                </p>
              </div>
              <div className="flex gap-3">
                <div className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                  <span className="text-xs font-medium">✓ Allowed: </span>
                  <span className="font-bold">{selectedMapping?.allowedElements.length || 0}</span>
                </div>
                <div className={`px-3 py-1.5 rounded-lg ${isDark ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-100 text-rose-800'}`}>
                  <span className="text-xs font-medium">✗ Denied: </span>
                  <span className="font-bold">{filteredElements.length - (selectedMapping?.allowedElements.length || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elements Grid */}
          <div className={`p-4 ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
            {filteredElements.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No UI elements match your filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredElements.map(element => {
                  const isAllowed = selectedMapping?.allowedElements.includes(element.id) || false;

                  return (
                    <div
                      key={element.id}
                      onClick={() => handleToggleElement(element.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isAllowed
                          ? isDark
                            ? 'border-emerald-600 bg-emerald-900/20 hover:bg-emerald-900/30'
                            : 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100'
                          : isDark
                            ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800/70'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                            {element.name}
                          </div>
                          <div className={`text-[10px] font-mono mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {element.id}
                          </div>
                        </div>
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isAllowed
                            ? 'bg-emerald-500 text-white'
                            : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isAllowed ? '✓' : '✗'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${typeColors[element.type] || 'bg-slate-100 text-slate-700'}`}>
                          {element.type}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                          {element.entity}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                          {element.module}
                        </span>
                      </div>

                      {element.component && (
                        <div className={`text-[10px] mt-1.5 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          📦 {element.component}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border-2 border-dashed p-12 text-center ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-300 bg-slate-50'}`}>
          <div className="text-6xl mb-4">👆</div>
          <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            Select a Permission to Edit
          </h3>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Choose a permission from the dropdown above to manage its UI element access
          </p>
        </div>
      )}

      {/* All Mappings Overview */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            📋 All Permission Mappings Overview
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
              <tr>
                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Permission</th>
                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Entity</th>
                <th className={`px-4 py-3 text-center font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Allowed</th>
                <th className={`px-4 py-3 text-left font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Top Elements</th>
                <th className={`px-4 py-3 text-center font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
              {allMappingsArray.map(mapping => {
                const entity = mapping.permission.split(':')[0];
                const topElements = mapping.allowedElements.slice(0, 3);
                const isPending = pendingChanges.has(mapping.permission);
                return (
                  <tr key={mapping.permission} className={`${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} ${isPending ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <code className={`px-2 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-slate-700 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                        {mapping.permission}
                      </code>
                      {isPending && <span className="ml-2 text-xs text-amber-500">🔴</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                        {entity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        {mapping.allowedElements.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {topElements.map(id => (
                          <span key={id} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                            {id.replace(/^(client|contract|invoice|inspection)_(btn|card|stat|field|modal|progress|table|list)_/, '')}
                          </span>
                        ))}
                        {mapping.allowedElements.length > 3 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            +{mapping.allowedElements.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedPermission(mapping.permission)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* UI Elements Registry */}
      <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            📦 UI Elements Registry by Module
          </h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(
            uiElements.reduce((acc, el) => {
              if (!acc[el.module]) acc[el.module] = [];
              acc[el.module].push(el);
              return acc;
            }, {} as Record<string, DBUIElement[]>)
          ).map(([module, elements]) => (
            <div key={module} className={`border rounded-lg p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold capitalize ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  📁 {module}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                  {elements.length}
                </span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {elements.map(element => (
                  <div key={element.id} className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColors[element.type] || 'bg-slate-100'}`}>
                      {element.type}
                    </span>
                    <span className="truncate">{element.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className={`rounded-xl border p-6 ${isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50/50'}`}>
        <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
          💡 How to Use
        </h2>
        <div className={`text-sm space-y-2 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
          <p><strong>1.</strong> Select a permission from the dropdown (e.g., <code className="px-1 rounded bg-white/50 dark:bg-black/20">contract:read</code>)</p>
          <p><strong>2.</strong> Use filters to find specific UI elements (by entity, module, or type)</p>
          <p><strong>3.</strong> Click on any element card to toggle its access (green = allowed, gray = denied)</p>
          <p><strong>4.</strong> Changes are stored locally until you click <strong>Save</strong></p>
          <p><strong>5.</strong> Use <strong>Cancel</strong> to discard unsaved changes</p>
          <p><strong>6.</strong> Use "Reset to Defaults" to restore original configuration</p>
        </div>
      </div>

      {/* 🔐 Floating Action Bar */}
      <FloatingActionBar
        onSave={handleSave}
        onCancel={handleCancel}
        hasChanges={hasChanges}
        saveLabel="Save to Database"
        cancelLabel="Discard Changes"
      />
    </div>
  );
}