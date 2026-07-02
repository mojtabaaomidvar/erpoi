// src/shared/authorization/services/PermissionMappingService.ts

import type { Permission, EntityType } from '../types';
import type { UIElement, PermissionMapping, UIElementRegistry, UIElementType } from '../types/PermissionMapping';

const STORAGE_KEY = 'ics_permission_mapping';
const REGISTRY_KEY = 'ics_ui_element_registry';

class PermissionMappingService {
  private static instance: PermissionMappingService;
  private mappings: Map<string, PermissionMapping> = new Map();
  private registry: UIElementRegistry | null = null;

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultRegistry();
    this.initializeDefaultMappings();
  }

  static getInstance(): PermissionMappingService {
    if (!PermissionMappingService.instance) {
      PermissionMappingService.instance = new PermissionMappingService();
    }
    return PermissionMappingService.instance;
  }

  // ═══════════════════════════════════════
  // 📦 UI Element Registry
  // ═══════════════════════════════════════

  private initializeDefaultRegistry() {
    if (this.registry && Object.keys(this.registry.elements).length > 0) return;

    const elements: UIElement[] = [
      // 🎯 Clients Module
      { id: 'client_card_total', name: 'Total Clients Card', type: 'card', entity: 'client', module: 'clients', component: 'ClientList' },
      { id: 'client_card_legal', name: 'Legal Clients Card', type: 'card', entity: 'client', module: 'clients', component: 'ClientList' },
      { id: 'client_card_individual', name: 'Individual Clients Card', type: 'card', entity: 'client', module: 'clients', component: 'ClientList' },
      { id: 'client_btn_add', name: 'Add Client Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientList' },
      { id: 'client_btn_export', name: 'Export Clients Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientList' },
      { id: 'client_btn_edit', name: 'Edit Client Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientDetails' },
      { id: 'client_btn_delete', name: 'Delete Client Button', type: 'button', entity: 'client', module: 'clients', component: 'ClientDetails' },
      { id: 'client_modal_add', name: 'Add Client Modal', type: 'modal', entity: 'client', module: 'clients', component: 'ClientForm' },
      { id: 'client_modal_edit', name: 'Edit Client Modal', type: 'modal', entity: 'client', module: 'clients', component: 'ClientEditModal' },
      { id: 'client_field_national_id', name: 'National ID Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
      { id: 'client_field_phone', name: 'Phone Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
      { id: 'client_field_email', name: 'Email Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
      { id: 'client_field_address', name: 'Address Field', type: 'form_field', entity: 'client', module: 'clients', component: 'ClientForm' },
      { id: 'client_list_item', name: 'Client List Item', type: 'list_item', entity: 'client', module: 'clients', component: 'ClientList' },
      { id: 'client_stat_contracts', name: 'Client Contracts Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },
      { id: 'client_stat_total_value', name: 'Client Total Value Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },
      { id: 'client_stat_invoiced', name: 'Client Invoiced Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },
      { id: 'client_stat_not_invoiced', name: 'Client Not Invoiced Stat', type: 'stat', entity: 'client', module: 'clients', component: 'ClientDetails' },

      // 🎯 Contracts Module
      { id: 'contract_card_total', name: 'Total Contracts Card', type: 'card', entity: 'contract', module: 'contracts', component: 'ContractList' },
      { id: 'contract_card_active', name: 'Active Contracts Card', type: 'card', entity: 'contract', module: 'contracts', component: 'ContractList' },
      { id: 'contract_card_expiring', name: 'Expiring Contracts Card', type: 'card', entity: 'contract', module: 'contracts', component: 'ContractList' },
      { id: 'contract_btn_add', name: 'Add Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractList' },
      { id: 'contract_btn_export', name: 'Export Contracts Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractList' },
      { id: 'contract_btn_edit', name: 'Edit Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_btn_delete', name: 'Delete Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_btn_approve', name: 'Approve Contract Button', type: 'button', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_modal_add', name: 'Add Contract Modal', type: 'modal', entity: 'contract', module: 'contracts', component: 'ContractForm' },
      { id: 'contract_modal_edit', name: 'Edit Contract Modal', type: 'modal', entity: 'contract', module: 'contracts', component: 'ContractForm' },
      { id: 'contract_field_total_value', name: 'Total Value Field', type: 'form_field', entity: 'contract', module: 'contracts', component: 'ContractForm' },
      { id: 'contract_field_currency', name: 'Currency Field', type: 'form_field', entity: 'contract', module: 'contracts', component: 'ContractForm' },
      { id: 'contract_field_tariffs', name: 'Tariffs Section', type: 'section', entity: 'contract', module: 'contracts', component: 'ContractForm' },
      { id: 'contract_field_financial_terms', name: 'Financial Terms Section', type: 'section', entity: 'contract', module: 'contracts', component: 'ContractForm' },
      { id: 'contract_progress_work', name: 'Work Progress Bar', type: 'progress_bar', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_progress_invoice', name: 'Invoice Progress Bar', type: 'progress_bar', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_progress_time', name: 'Time Progress Bar', type: 'progress_bar', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_stat_total_value', name: 'Total Value Stat', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_stat_invoiced', name: 'Invoiced Stat', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_stat_not_invoiced', name: 'Not Invoiced Stat', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_table_tariffs', name: 'Tariffs Table', type: 'table_column', entity: 'contract', module: 'contracts', component: 'ContractDetails' },
      { id: 'contract_list_item', name: 'Contract List Item', type: 'list_item', entity: 'contract', module: 'contracts', component: 'ContractList' },
      { id: 'contract_list_value', name: 'Contract Value in List', type: 'stat', entity: 'contract', module: 'contracts', component: 'ContractList' },

      // 🎯 Invoices Module
      { id: 'invoice_card_total', name: 'Total Invoices Card', type: 'card', entity: 'invoice', module: 'invoices', component: 'InvoiceList' },
      { id: 'invoice_btn_create', name: 'Create Invoice Button', type: 'button', entity: 'invoice', module: 'invoices', component: 'InvoiceList' },
      { id: 'invoice_btn_export', name: 'Export Invoices Button', type: 'button', entity: 'invoice', module: 'invoices', component: 'InvoiceList' },
      { id: 'invoice_stat_total', name: 'Total Invoice Amount', type: 'stat', entity: 'invoice', module: 'invoices', component: 'InvoiceDetails' },

      // 🎯 Inspections Module
      { id: 'inspection_card_total', name: 'Total Inspections Card', type: 'card', entity: 'inspection', module: 'inspections', component: 'InspectionList' },
      { id: 'inspection_btn_create', name: 'Create Inspection Button', type: 'button', entity: 'inspection', module: 'inspections', component: 'InspectionList' },
      { id: 'inspection_progress', name: 'Inspection Progress', type: 'progress_bar', entity: 'inspection', module: 'inspections', component: 'InspectionDetails' },

      // 🎯 Dashboard Module
      { id: 'dashboard_stat_clients', name: 'Dashboard Clients Stat', type: 'stat', entity: 'client', module: 'dashboard', component: 'Dashboard' },
      { id: 'dashboard_stat_contracts', name: 'Dashboard Contracts Stat', type: 'stat', entity: 'contract', module: 'dashboard', component: 'Dashboard' },
      { id: 'dashboard_stat_invoices', name: 'Dashboard Invoices Stat', type: 'stat', entity: 'invoice', module: 'dashboard', component: 'Dashboard' },
      { id: 'dashboard_chart_revenue', name: 'Revenue Chart', type: 'chart', entity: 'invoice', module: 'dashboard', component: 'Dashboard' },
      { id: 'dashboard_chart_inspections', name: 'Inspections Chart', type: 'chart', entity: 'inspection', module: 'dashboard', component: 'Dashboard' },
    ];

    this.registry = {
      elements: {},
      byEntity: {},
      byModule: {},
      byType: {},
    };

    elements.forEach(el => {
      this.registry!.elements[el.id] = el;

      if (!this.registry!.byEntity[el.entity]) {
        this.registry!.byEntity[el.entity] = [];
      }
      this.registry!.byEntity[el.entity].push(el.id);

      if (!this.registry!.byModule[el.module]) {
        this.registry!.byModule[el.module] = [];
      }
      this.registry!.byModule[el.module].push(el.id);

      if (!this.registry!.byType[el.type]) {
        this.registry!.byType[el.type] = [];
      }
      this.registry!.byType[el.type].push(el.id);
    });

    this.saveRegistryToStorage();
  }

  // ═══════════════════════════════════════
  // 🔗 Permission Mappings
  // ═══════════════════════════════════════

  private initializeDefaultMappings() {
    if (this.mappings.size > 0) return;

    // 🎯 Client Permissions
    this.setMapping('client:create' as Permission, [
      'client_btn_add', 'client_modal_add', 'client_field_national_id',
      'client_field_phone', 'client_field_email', 'client_field_address'
    ]);

    this.setMapping('client:read' as Permission, [
      'client_card_total', 'client_card_legal', 'client_card_individual',
      'client_list_item', 'client_field_national_id', 'client_field_phone',
      'client_field_email', 'client_field_address', 'client_stat_contracts'
    ]);

    this.setMapping('client:update' as Permission, [
      'client_btn_edit', 'client_modal_edit', 'client_field_national_id',
      'client_field_phone', 'client_field_email', 'client_field_address'
    ]);

    this.setMapping('client:delete' as Permission, ['client_btn_delete']);
    this.setMapping('client:export' as Permission, ['client_btn_export']);

    this.setMapping('client:view_all' as Permission, [
      'client_card_total', 'client_card_legal', 'client_card_individual', 'client_list_item'
    ]);

    this.setMapping('client:view_own' as Permission, [
      'client_card_total', 'client_list_item'
    ]);

    // 🎯 Contract Permissions
    this.setMapping('contract:create' as Permission, [
      'contract_btn_add', 'contract_modal_add', 'contract_field_total_value',
      'contract_field_currency', 'contract_field_tariffs', 'contract_field_financial_terms'
    ]);

    this.setMapping('contract:read' as Permission, [
      'contract_card_total', 'contract_card_active', 'contract_card_expiring',
      'contract_list_item', 'contract_progress_work', 'contract_progress_time',
      'contract_stat_total_value', 'contract_table_tariffs',
      'contract_stat_invoiced', 'contract_stat_not_invoiced',
      'contract_progress_invoice', 'contract_list_value'
    ]);

    this.setMapping('contract:update' as Permission, [
      'contract_btn_edit', 'contract_modal_edit', 'contract_field_total_value',
      'contract_field_currency', 'contract_field_tariffs', 'contract_field_financial_terms'
    ]);

    this.setMapping('contract:delete' as Permission, ['contract_btn_delete']);
    this.setMapping('contract:export' as Permission, ['contract_btn_export']);
    this.setMapping('contract:approve' as Permission, ['contract_btn_approve']);

    this.setMapping('contract:view_all' as Permission, [
      'contract_card_total', 'contract_card_active', 'contract_card_expiring', 'contract_list_item'
    ]);

    this.setMapping('contract:view_own' as Permission, [
      'contract_card_total', 'contract_list_item'
    ]);

    // 🎯 Invoice Permissions
    this.setMapping('invoice:create' as Permission, ['invoice_btn_create']);
    this.setMapping('invoice:read' as Permission, ['invoice_card_total', 'invoice_stat_total']);
    this.setMapping('invoice:export' as Permission, ['invoice_btn_export']);
    this.setMapping('invoice:view_all' as Permission, ['invoice_card_total']);
    this.setMapping('invoice:view_own' as Permission, ['invoice_card_total']);

    // 🎯 Inspection Permissions
    this.setMapping('inspection:create' as Permission, ['inspection_btn_create']);
    this.setMapping('inspection:read' as Permission, ['inspection_card_total', 'inspection_progress']);
    this.setMapping('inspection:view_all' as Permission, ['inspection_card_total']);
    this.setMapping('inspection:view_own' as Permission, ['inspection_card_total']);

    // 🎯 Dashboard
    this.setMapping('client:read' as Permission, ['dashboard_stat_clients']);
    this.setMapping('contract:read' as Permission, ['dashboard_stat_contracts']);
    this.setMapping('invoice:read' as Permission, ['dashboard_stat_invoices', 'dashboard_chart_revenue']);
    this.setMapping('inspection:read' as Permission, ['dashboard_chart_inspections']);

    this.saveToStorage();
  }

  setMapping(permission: Permission, allowedElements: string[], deniedElements?: string[]) {
    const existing = this.mappings.get(permission);
    if (existing) {
      existing.allowedElements = [...new Set(allowedElements)];
      if (deniedElements) {
        existing.deniedElements = [...new Set(deniedElements)];
      }
    } else {
      this.mappings.set(permission, { permission, allowedElements, deniedElements });
    }
    this.saveToStorage();
  }

  getMapping(permission: Permission): PermissionMapping | undefined {
    return this.mappings.get(permission);
  }

  getAllMappings(): PermissionMapping[] {
    return Array.from(this.mappings.values());
  }

  // ═══════════════════════════════════════
  // 📦 Registry Access
  // ═══════════════════════════════════════

  getRegistry(): UIElementRegistry {
    return this.registry!;
  }

  getElement(id: string): UIElement | undefined {
    return this.registry?.elements[id];
  }

  getElementsByEntity(entity: EntityType): UIElement[] {
    const ids = this.registry?.byEntity[entity] || [];
    return ids.map(id => this.registry!.elements[id]).filter(Boolean);
  }

  getElementsByModule(module: string): UIElement[] {
    const ids = this.registry?.byModule[module] || [];
    return ids.map(id => this.registry!.elements[id]).filter(Boolean);
  }

  getElementsByType(type: UIElementType): UIElement[] {
    const ids = this.registry?.byType[type] || [];
    return ids.map(id => this.registry!.elements[id]).filter(Boolean);
  }

  // ═══════════════════════════════════════
  // 💾 Storage
  // ═══════════════════════════════════════

  private saveToStorage() {
    const data = Array.from(this.mappings.entries());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const entries = JSON.parse(data);
        this.mappings = new Map(entries);
      }
    } catch (error) {
      console.error('[PermissionMappingService] Failed to load:', error);
    }

    try {
      const registryData = localStorage.getItem(REGISTRY_KEY);
      if (registryData) {
        this.registry = JSON.parse(registryData);
      }
    } catch (error) {
      console.error('[PermissionMappingService] Failed to load registry:', error);
    }
  }

  private saveRegistryToStorage() {
    if (this.registry) {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(this.registry));
    }
  }

  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REGISTRY_KEY);
    this.mappings.clear();
    this.registry = null;
    this.initializeDefaultRegistry();
    this.initializeDefaultMappings();
  }
}

export const permissionMappingService = PermissionMappingService.getInstance();