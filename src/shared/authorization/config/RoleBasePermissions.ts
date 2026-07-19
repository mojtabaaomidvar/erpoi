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

    // ═══════════════════════════════════════
    // 📝 Inpsectors
    // ═══════════════════════════════════════
    ...entityActions("inspector", [
      "list_view",
      "list_item_click",
      "btn_add",
      "btn_edit",
      "btn_delete",
      "details_view",
      "details_download_resume",
    ]),

    // ═══════════════════════════════════════
    // 📁 Projects
    // ═══════════════════════════════════════
    ...entityActions("project", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_status",
      "btn_add",
      "btn_edit",
      "btn_delete",
      "details_view",
    ]),

    // ═══════════════════════════════════════
    // 🔍 Inspections
    // ═══════════════════════════════════════
    ...entityActions("inspection", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_status",
      "filter_priority",
      "status_badge",
      "priority_badge",
      "btn_add",
      "btn_edit",
      "btn_delete",
      "btn_export",
      "info_section",
      "document_section",
      "document_upload",
      "document_approve",
      "document_reject",
      "inspector_assignment",
      "assign_inspector",
      "checklist_section",
      "checklist_add",
      "ncr_section",
      "ncr_create",
      "report_section",
      "report_generate",
    ]),
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
    ...entityActions("contract", []),

    // ═══════════════════════════════════════
    // 📝 Amendments & Others
    // ═══════════════════════════════════════
    ...entityActions("amendment", []),

    // ═══════════════════════════════════════
    // 📝 Inpsectors
    // ═══════════════════════════════════════
    ...entityActions("inspector", []),
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
