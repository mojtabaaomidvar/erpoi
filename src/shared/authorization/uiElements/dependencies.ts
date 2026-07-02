// src/shared/authorization/uiElements/dependencies.ts

/**
 * 🎯 Dependency Tree
 * 
 * منطق جدید:
 * - list_item → فقط دیدن لیست
 * - list_item_click → کلیک روی آیتم (نیاز به list_item)
 * - جزئیات/ویرایش/حذف → نیاز به list_item_click
 */

export const elementDependencies: Record<string, string[]> = {
  // ═══════════════════════════════════════
  // 👤 Client Dependencies
  // ═══════════════════════════════════════
  
  // Cards - نیاز به دیدن لیست
  'client_card_total': ['client_list_item'],
  'client_card_legal': ['client_list_item'],
  'client_card_individual': ['client_list_item'],
  
  // 🔧 FIX: list_item_click نیاز به list_item داره
  'client_list_item_click': ['client_list_item'],
  
  // Buttons - 🔧 FIX: نیاز به list_item_click (نه list_item)
  'client_btn_add': ['client_list_item'],           // Add نیاز به دیدن لیست داره
  'client_btn_export': ['client_list_item'],        // Export نیاز به دیدن لیست
  'client_btn_edit': ['client_list_item_click'],    // 🔧 Edit نیاز به کلیک
  'client_btn_delete': ['client_list_item_click'],  // 🔧 Delete نیاز به کلیک
  
  // Modals - 🔧 FIX: نیاز به button مربوطه
  'client_modal_add': ['client_btn_add'],
  'client_modal_edit': ['client_btn_edit'],
  
  // Form Fields - نیاز به modal
  'client_field_national_id': ['client_modal_add'],
  'client_field_phone': ['client_modal_add'],
  'client_field_email': ['client_modal_add'],
  'client_field_address': ['client_modal_add'],
  
  // 🔧 FIX: Stats - نیاز به list_item_click (دیدن جزئیات)
  'client_stat_contracts': ['client_list_item_click'],
  'client_stat_total_value': ['client_list_item_click'],
  'client_stat_invoiced': ['client_list_item_click'],
  'client_stat_not_invoiced': ['client_list_item_click'],
  
  // ═══════════════════════════════════════
  // 📄 Contract Dependencies
  // ═══════════════════════════════════════
  
  // Cards
  'contract_card_total': ['contract_list_item'],
  'contract_card_active': ['contract_list_item'],
  'contract_card_expiring': ['contract_list_item'],
  
  // 🔧 FIX: list_item_click
  'contract_list_item_click': ['contract_list_item'],
  'contract_list_value': ['contract_list_item'],
  
  // Buttons
  'contract_btn_add': ['contract_list_item'],
  'contract_btn_export': ['contract_list_item'],
  'contract_btn_edit': ['contract_list_item_click'],     // 🔧
  'contract_btn_delete': ['contract_list_item_click'],   // 🔧
  'contract_btn_approve': ['contract_list_item_click'],  // 🔧
  
  // Modals
  'contract_modal_add': ['contract_btn_add'],
  'contract_modal_edit': ['contract_btn_edit'],
  
  // Form Fields
  'contract_field_total_value': ['contract_modal_add'],
  'contract_field_currency': ['contract_modal_add'],
  'contract_field_tariffs': ['contract_modal_add'],
  'contract_field_financial_terms': ['contract_modal_add'],
  
  // Progress Bars - 🔧 FIX: نیاز به list_item_click
  'contract_progress_work': ['contract_list_item_click'],
  'contract_progress_invoice': ['contract_list_item_click'],
  'contract_progress_time': ['contract_list_item_click'],
  
  // Stats - 🔧 FIX: نیاز به list_item_click
  'contract_stat_total_value': ['contract_list_item_click'],
  'contract_stat_invoiced': ['contract_list_item_click'],
  'contract_stat_not_invoiced': ['contract_list_item_click'],
  
  // Tables
  'contract_table_tariffs': ['contract_list_item_click'],
  
  // ═══════════════════════════════════════
  // 💵 Invoice Dependencies
  // ═══════════════════════════════════════
  
  'invoice_card_total': ['invoice_list_item'],
  'invoice_list_item_click': ['invoice_list_item'],
  'invoice_btn_create': ['invoice_list_item'],
  'invoice_btn_export': ['invoice_list_item'],
  'invoice_stat_total': ['invoice_list_item_click'],
  
  // ═══════════════════════════════════════
  // 🔍 Inspection Dependencies
  // ═══════════════════════════════════════
  
  'inspection_card_total': ['inspection_list_item'],
  'inspection_list_item_click': ['inspection_list_item'],
  'inspection_btn_create': ['inspection_list_item'],
  'inspection_progress': ['inspection_list_item_click'],
  
  // ═══════════════════════════════════════
  // 📊 Dashboard Dependencies
  // ═══════════════════════════════════════
  
  'dashboard_stat_clients': [],
  'dashboard_stat_contracts': [],
  'dashboard_stat_invoices': [],
  'dashboard_chart_revenue': [],
  'dashboard_chart_inspections': [],
};

/**
 * 🎯 گرفتن همه dependencies یه element (recursive)
 */
export function getAllDependencies(elementId: string, visited: Set<string> = new Set()): string[] {
  if (visited.has(elementId)) return [];
  visited.add(elementId);
  
  const directDeps: string[] = elementDependencies[elementId] || [];
  const allDeps: string[] = [...directDeps];
  
  directDeps.forEach((dep: string) => {
    allDeps.push(...getAllDependencies(dep, visited));
  });
  
  return [...new Set(allDeps)];
}

/**
 * 🎯 گرفتن همه children یه element (reverse dependencies)
 */
export function getAllChildren(elementId: string, allElements: string[]): string[] {
  return allElements.filter((el: string) => {
    const deps: string[] = elementDependencies[el] || [];
    return deps.includes(elementId);
  });
}

/**
 * 🎯 چک کردن اگه dependencies فعال هستن
 */
export function checkDependencies(elementId: string, allowedElements: string[]): {
  satisfied: boolean;
  missing: string[];
} {
  const deps: string[] = elementDependencies[elementId] || [];
  const missing: string[] = deps.filter((dep: string) => !allowedElements.includes(dep));
  
  return {
    satisfied: missing.length === 0,
    missing,
  };
}