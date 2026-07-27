// src/shared/authorization/config/RoleBasePermissions.ts

// ✅ تولید دسترسی به فرمت entity_action (مثال: project_list_item_view)
function entityActions(entity: string, actions: string[]): string[] {
  return actions.map((action) => `${entity}_${action}`);
}

// ✅ لیست تمام ماژول‌های (Entity) شناخته‌شده در سیستم برای استخراج هوشمند
const KNOWN_ENTITIES = [
  "client",
  "contract",
  "amendment",
  "inspector",
  "project",
  "inspection",
  "user",
  "report",
  "department",
  "permission",
];

export const ROLE_BASE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*:*"],

  manager: [
    // ═══════════════════════════════════════
    // 👥 Clients
    // ═══════════════════════════════════════
    ...entityActions("client", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "total_agreement_badge",
      "total_agreement_value_badge",
      "btn_add",
      "btn_export",
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
      // 1. List
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "filter_status",
      "status_badge",
      "list_dates",
      "list_value",
      "progress_bar",
      "contract_dates",
      "btn_add",
      "btn_export",

      // 2. Details Sections
      "info_section",
      "amendments_section",

      // 3. Details Info & Stats
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

      // 4. Actions
      "btn_edit",
      "btn_delete",
      "btn_approve",
      "btn_close",
      "btn_amend",
      "btn_doc",

      // 5. Form Fields
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
    "user_view",
    "report_view",

    // ═══════════════════════════════════════
    // 📝 Inspectors
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
    // 📁 Projects (کامل و هماهنگ با ProjectElements)
    // ═══════════════════════════════════════
    ...entityActions("project", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_status",
      "btn_add",
      "btn_export",
      "btn_edit",
      "btn_delete",
      "basic_info_section",
      "info_name",
      "info_status",
      "info_service_types",
      "info_period",
      "info_description",
      "stats_section",
      "stat_tpi_spot",
      "stat_tpi_resident",
      "stat_mws",
      "stat_total_inspections",
      "stat_completed_inspections",
      "stat_total_man_days",
      "progress_overall",
      "team_section",
      "info_pm",
      "info_coordinator",
      "form_view",
      "step1_client_select",
      "step1_contract_select",
      "step1_service_types",
      "step2_title_input",
      "step2_description_input",
      "step2_start_date",
      "step2_end_date",
      "step2_contract_period_ref",
      "step2_pm_select",
      "step2_coordinator_select",
      "step3_review_section",
      "btn_next",
      "btn_back",
      "btn_submit",
      "btn_cancel",
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
    // 👥 Clients (مشاهده‌ای)
    // ═══════════════════════════════════════
    ...entityActions("client", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_type",
      "total_agreement_badge",
      "btn_add",
      "btn_edit",
      "emails_dropdown",
      "contacts_dropdown",
      "stat_agreements",
      "agreements_section",
      "agreement_progress_work",
      "contract_dates",
      "info_section",
      "info_start_date",
      "info_end_date",
      "progress_time",
      "reminder_section",
      "tariffs_section",
    ]),

    // ═══════════════════════════════════════
    // 📁 Projects (مشاهده‌ای)
    // ═══════════════════════════════════════
    ...entityActions("project", [
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_status",
      "basic_info_section",
      "info_name",
      "info_status",
      "info_service_types",
      "info_period",
      "info_description",
      "stats_section",
      "stat_tpi_spot",
      "stat_tpi_resident",
      "stat_mws",
      "stat_total_inspections",
      "stat_completed_inspections",
      "stat_total_man_days",
      "progress_overall",
      "team_section",
      "info_pm",
      "info_coordinator",
    ]),

    // ═══════════════════════════════════════
    // 🏭 TPI (Third Party Inspection)
    // ═══════════════════════════════════════
    ...entityActions("tpi", [
      // List
      "list_item_view",
      "list_item_click",
      "search_box",
      "filter_mode",
      "btn_add",
      // Form
      "form_view",
      "select_project",
      "select_mode",
      "select_vendor",
      "select_site_rep",
      "select_service_domain",
      "input_scope",
      "input_date",
      "select_priority",
      "btn_submit",
      "btn_cancel",
      // Details
      "details_view",
      "btn_edit",
      "btn_delete",
      "info_section",
      "documents_section",
      "inspector_section",
      "checklist_section",
      "ncr_section",
      "report_section",
      "release_note_section",
    ]),

    // ═══════════════════════════════════════
    // سایر ماژول‌ها (محدود)
    // ═══════════════════════════════════════
    ...entityActions("contract", []),
    ...entityActions("amendment", []),
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
 * ✅ لیست همه entity های موجود (نسخه اصلاح‌شده و هوشمند)
 * این تابع دیگر به split کردن رشته وابسته نیست و از لیست ماژول‌های شناخته‌شده استفاده می‌کند.
 */
export function getAllEntities(): string[] {
  const entities = new Set<string>();

  Object.values(ROLE_BASE_PERMISSIONS).forEach((permissions) => {
    permissions.forEach((perm) => {
      if (perm === "*:*") return;

      // بررسی می‌کنیم این دسترسی متعلق به کدام ماژول شناخته‌شده است
      const matchedEntity = KNOWN_ENTITIES.find((entity) =>
        perm.startsWith(`${entity}_`),
      );
      if (matchedEntity) {
        entities.add(matchedEntity);
      }
    });
  });

  return Array.from(entities).sort();
}
