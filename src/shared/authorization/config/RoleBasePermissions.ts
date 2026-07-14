// src/shared/authorization/config/RoleBasePermissions.ts

function entityActions(entity: string, actions: string[]): string[] {
  return actions.map((action) => `${entity}_${action}`);
}

export const ROLE_BASE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*:*"],

  manager: [
    // ═══════════════════════════════════════
    // 👥 Clients
    // ═══════════════════════════════════════
    ...entityActions("client", [
      // ClientList
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "total_agreement_badge",
      "total_agreement_value_badge",
      "btn_add",
      "btn_export",
      // ClientDeatails
      "btn_edit",
      "btn_delete",
      "emails_dropdown",
      "contacts_dropdown",
      "stat_agreements",
      "stat_value_agreements",
      "stat_invoiced",
      "stat_uninvoiced",
      "agreements_section",
      "agreement_value",
      "agreement_progress_work",
      "agreement_progress_invoice",
      "contract_dates",
      // ContractDetailsModal
      "info_section",
      "info_start_date",
      "info_end_date",
      "info_total_value",
      "info_performed_work",
      "info_invoiced",
      "info_not_invoiced",
      "progress_work",
      "progress_invoice",
      "progress_time",
      "reminder_section",
      "tariffs_section",
      "tariff_col_performed",
      "tariff_col_total_value",
      "tariff_col_invoiced",
    ]),

    // ═══════════════════════════════════════
    // 📄 Contracts
    // ═══════════════════════════════════════
    ...entityActions("contract", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "filter_status",
      "status_badge",
      "list_value",
      "progress_bar",
      "contract_dates",
      "btn_add",
      "btn_export",
      "btn_edit",
      "btn_delete",
      "btn_approve",
      "btn_close",
      "info_section",
      "info_start_date",
      "info_end_date",
      "stat_total_value",
      "stat_performed_work",
      "stat_invoiced",
      "stat_not_invoiced",
      "progress_work",
      "progress_invoice",
      "progress_time",
      "reminder_section",
      "table_tariffs",
      "modal_add",
      "modal_edit",
      "field_type",
      "field_client",
      "field_title",
      "field_service_description",
      "field_dates",
      "field_contract_no",
      "field_total_value",
      "field_currency",
      "field_tariffs",
      "field_financial_terms",
      "field_adjustment",
      "field_modification",
      "field_guarantee",
      "field_good_performance",
      "field_insurance",
      "field_attachments",
      "field_description",
      "field_source_type",
      "field_letter",
      "field_email_source",
    ]),

    // ═══════════════════════════════════════
    // 📝 Amendments & Others
    // ═══════════════════════════════════════
    ...entityActions("amendment", ["view", "create", "approve", "reject"]),
    "user_view", // اگر user هم آندرلاین است
    "report_view",
  ],

  expert: [
    // ═══════════════════════════════════════
    // 👥 Clients
    // ═══════════════════════════════════════
    ...entityActions("client", [
      // ClientList
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "total_agreement_badge",
      "btn_add",
      // ClientDeatails
      "btn_edit",
      "emails_dropdown",
      "contacts_dropdown",
      "stat_agreements",
      "agreements_section",
      "agreement_progress_work",
      "contract_dates",
      // ContractDetailsModal
      "info_section",
      "info_start_date",
      "info_end_date",
      "progress_time",
      "reminder_section",
      "tariffs_section",
    ]),

    // ═══════════════════════════════════════
    // 📄 Contracts
    // ═══════════════════════════════════════
    ...entityActions("contract", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "status_badge",
      "contract_dates",
      "btn_add",
      "info_section",
      "info_start_date",
      "info_end_date",
      "stat_performed_work",
      "stat_not_invoiced",
      "progress_work",
      "table_tariffs",
    ]),

    // ═══════════════════════════════════════
    // 📝 Amendments & Others
    // ═══════════════════════════════════════
    ...entityActions("amendment", ["view", "create"]),
  ],

  coordinator: [
    ...entityActions("contract", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "filter_status",
      "status_badge",
      "list_value",
      "progress_bar",
      "contract_dates",
      "btn_close",
      "info_section",
      "info_start_date",
      "info_end_date",
      "stat_total_value",
      "stat_performed_work",
      "stat_invoiced",
      "stat_not_invoiced",
      "progress_work",
      "progress_invoice",
      "progress_time",
      "reminder_section",
      "table_tariffs",
    ]),
    ...entityActions("client", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "total_agreement_badge",
      "emails_dropdown",
      "contacts_dropdown",
      "agreements_section",
      "stat_agreements",
      "stat_value_agreements",
      "stat_invoiced",
      "stat_uninvoiced",
      "agreements_tabs",
      "contract_item",
      "agreement_value",
      "agreement_progress_work",
      "agreement_progress_invoice",
      "contract_dates",
      "contract_value",
      "contract_progress_work",
      "contract_progress_invoice",
      "time_remaining",
      "tariffs_section",
      "tariffs_table",
      "tariffs_financial",
      "tariffs_totals",
    ]),
    ...entityActions("inspection", ["view", "create", "assign", "update"]),
  ],

  inspector: [
    ...entityActions("inspection", ["view", "update"]),
    ...entityActions("contract", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "filter_status",
      "status_badge",
      "progress_bar",
      "contract_dates",
      "btn_close",
      "info_section",
      "info_start_date",
      "info_end_date",
      "progress_work",
      "progress_invoice",
      "progress_time",
    ]),
  ],

  viewer: [
    ...entityActions("contract", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "filter_status",
      "status_badge",
      "progress_bar",
      "contract_dates",
      "btn_close",
      "info_section",
      "info_start_date",
      "info_end_date",
      "progress_work",
      "progress_invoice",
      "progress_time",
    ]),
    ...entityActions("client", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "total_agreement_badge",
      "emails_dropdown",
      "contacts_dropdown",
      "agreements_section",
      "stat_agreements",
      "agreements_tabs",
      "contract_item",
      "contract_dates",
    ]),
  ],
};

/**
 * دریافت Base Permissions یک نقش
 */
export function getBasePermissions(role: string): string[] {
  return ROLE_BASE_PERMISSIONS[role] || [];
}

/**
 * بررسی آیا یک permission جزو Base است یا نه
 */
export function isBasePermission(role: string, permission: string): boolean {
  const basePermissions = getBasePermissions(role);
  if (basePermissions.includes("*:*")) return true;
  return basePermissions.includes(permission);
}

/**
 * دریافت توضیحات Base Permissions برای UI
 */
export function getBasePermissionsInfo(role: string): {
  count: number;
  permissions: string[];
  isFullAccess: boolean;
} {
  const base = getBasePermissions(role);
  return {
    count: base.length,
    permissions: base,
    isFullAccess: base.includes("*:*"),
  };
}

/**
 * لیست همه entity های موجود
 */
export function getAllEntities(): string[] {
  const entities = new Set<string>();
  Object.values(ROLE_BASE_PERMISSIONS).forEach((permissions) => {
    permissions.forEach((perm) => {
      if (perm !== "*:*") {
        const entity = perm.split(":")[0];
        entities.add(entity);
      }
    });
  });
  return Array.from(entities).sort();
}
