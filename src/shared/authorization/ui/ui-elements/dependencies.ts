// src/shared/authorization/uiElements/dependencies.ts

export const elementDependencies: Record<string, string[]> = {
  // ═══════════════════════════════════════
  // 👤 Client Dependencies
  // ═══════════════════════════════════════
  // List
  client_list_item_click: ["client_list_item_view"],
  client_search_box: ["client_list_item_view"],
  client_filter_type: ["client_list_item_view"],
  client_total_agreement_badge: ["client_list_item_view"],
  client_btn_add: ["client_list_item_view"],
  client_btn_export: ["client_list_item_view"],
  client_total_agreement_value_badge: ["client_list_item_view"],

  // Details
  client_btn_edit: ["client_list_item_click"],
  client_btn_delete: ["client_list_item_click"],
  client_emails_dropdown: ["client_list_item_click"],
  client_contacts_dropdown: ["client_list_item_click"],
  client_stat_agreements: ["client_total_agreement_badge"],
  client_stat_value_agreements: ["client_total_agreement_value_badge"],
  client_stat_invoiced: ["client_total_agreement_value_badge"],
  client_stat_uninvoiced: ["client_total_agreement_value_badge"],
  client_agreements_section: ["client_list_item_click"],
  client_agreement_value: [
    "client_agreements_section",
    "client_total_agreement_value_badge",
  ],
  client_contract_dates: ["client_agreements_section"],
  client_agreement_progress_work: [
    "client_agreements_section",
    "client_contract_dates",
  ],
  client_agreement_progress_invoice: [
    "client_agreements_section",
    "client_stat_invoiced",
  ],

  // ContractDetailsModal
  client_info_section: ["client_agreements_section"],
  client_info_start_date: [
    "client_agreements_section",
    "client_contract_dates",
  ],
  client_info_end_date: ["client_agreements_section", "client_contract_dates"],
  client_info_total_value: [
    "client_agreements_section",
    "client_total_agreement_value_badge",
    "client_agreement_value",
  ],
  client_info_performed_work: [
    "client_agreements_section",
    "client_agreement_progress_work",
  ],
  client_info_invoiced: ["client_agreement_progress_invoice"],
  client_info_not_invoiced: [
    "client_agreements_section",
    "lient_info_total_value",
  ],
  client_progress_work: [
    "client_agreements_section",
    "client_agreement_progress_work",
  ],
  client_progress_invoice: [
    "client_agreements_section",
    "client_agreement_progress_invoice",
  ],
  client_progress_time: ["client_agreements_section", "client_contract_dates"],
  client_reminder_section: ["client_agreements_section"],
  client_tariffs_section: ["client_agreements_section"],
  client_tariff_col_performed: [
    "client_agreements_section",
    "client_tariffs_section",
  ],
  client_tariff_col_total_value: [
    "client_agreements_section",
    "client_tariffs_section",
  ],
  client_tariff_col_invoiced: [
    "client_agreements_section",
    "client_tariffs_section",
  ],

  // ═══════════════════════════════════════
  // 📄 Contract Dependencies
  // ═══════════════════════════════════════

  // 🔹 ContractList
  contract_list_item_click: ["contract_list_item_view"],
  contract_search_box: ["contract_list_item_view"],
  contract_filter_type: ["contract_list_item_view"],
  contract_filter_status: ["contract_list_item_view"],
  contract_status_badge: ["contract_list_item_view"],
  contract_list_value: ["contract_list_item_view"],
  contract_progress_bar: ["contract_list_item_view"],
  contract_contract_dates: ["contract_list_item_view"],

  // 🔹 ContractDetails - Header Buttons
  contract_btn_edit: ["contract_list_item_click"],
  contract_btn_delete: ["contract_list_item_click"],
  contract_btn_approve: ["contract_list_item_click"],
  contract_btn_close: ["contract_list_item_click"],

  // 🔹 ContractDetails - Info Section
  contract_info_section: ["contract_list_item_click"],
  info_start_date: ["contract_list_item_click"],
  info_end_date: ["contract_list_item_click"],

  // 🔹 ContractDetails - Stats Cards
  contract_stat_total_value: ["contract_info_section"],
  contract_stat_performed_work: ["contract_info_section"],
  contract_stat_invoiced: ["contract_info_section"],
  contract_stat_not_invoiced: ["contract_info_section"],

  // 🔹 ContractDetails - Progress Bars
  contract_progress_work: ["contract_info_section"],
  contract_progress_invoice: ["contract_info_section"],
  contract_progress_time: ["contract_info_section"],

  // 🔹 ContractDetails - Reminder
  contract_reminder_section: ["contract_info_section"],

  // 🔹 ContractDetails - Tariffs
  contract_tariffs_section: ["contract_info_section"],

  // ═══════════════════════════════════════
  // 💵 Invoice Dependencies
  // ═══════════════════════════════════════

  invoice_card_total: ["invoice_list_item"],
  invoice_list_item_click: ["invoice_list_item"],
  invoice_btn_create: ["invoice_list_item"],
  invoice_btn_export: ["invoice_list_item"],
  invoice_stat_total: ["invoice_list_item_click"],

  // ═══════════════════════════════════════
  // 🔍 Inspection Dependencies
  // ═══════════════════════════════════════

  inspection_card_total: ["inspection_list_item"],
  inspection_list_item_click: ["inspection_list_item"],
  inspection_btn_create: ["inspection_list_item"],
  inspection_progress: ["inspection_list_item_click"],

  // ═══════════════════════════════════════
  // 📊 Dashboard Dependencies
  // ═══════════════════════════════════════

  dashboard_stat_clients: [],
  dashboard_stat_contracts: [],
  dashboard_stat_invoices: [],
  dashboard_chart_revenue: [],
  dashboard_chart_inspections: [],
};
/**
 * 🔗 گرفتن تمام dependencies زنجیره‌ای (recursive)
 * مثال: client_btn_edit → client_list_item_click → client_list_item
 */
export function getAllDependenciesChain(
  elementId: string,
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(elementId)) return [];
  visited.add(elementId);
  const directDeps: string[] = elementDependencies[elementId] || [];
  const allDeps: string[] = [...directDeps];
  directDeps.forEach((dep: string) => {
    allDeps.push(...getAllDependenciesChain(dep, visited));
  });
  return [...new Set(allDeps)];
}

export function checkDependenciesChain(
  elementId: string,
  allowedElements: string[],
): {
  satisfied: boolean;
  missing: string[];
  chain: string[];
} {
  const chain = getAllDependenciesChain(elementId);
  const missing = chain.filter((dep) => !allowedElements.includes(dep));
  return { satisfied: missing.length === 0, missing, chain };
}

export function getAllChildren(
  elementId: string,
  allElements: string[],
): string[] {
  return allElements.filter((el: string) => {
    const deps: string[] = elementDependencies[el] || [];
    return deps.includes(elementId);
  });
}

export function getAllChildrenChain(
  elementId: string,
  allElements: string[],
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(elementId)) return [];
  visited.add(elementId);
  const directChildren = getAllChildren(elementId, allElements);
  const allChildren: string[] = [...directChildren];
  directChildren.forEach((child) => {
    allChildren.push(...getAllChildrenChain(child, allElements, visited));
  });
  return [...new Set(allChildren)];
}

export function checkDependencies(
  elementId: string,
  allowedElements: string[],
): {
  satisfied: boolean;
  missing: string[];
} {
  const deps: string[] = elementDependencies[elementId] || [];
  const missing: string[] = deps.filter(
    (dep: string) => !allowedElements.includes(dep),
  );
  return { satisfied: missing.length === 0, missing };
}
