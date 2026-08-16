// src/shared/authorization/ui/elements/ResidentElements.ts
// ═══════════════════════════════════════
// 🏢 Resident Inspection Permission Elements
// ═══════════════════════════════════════

import type { UIModuleElements } from "../types";

export const ResidentElements: UIModuleElements = {
  // ═══════════════════════════════════════
  // 📋 Resident Engagement List
  // ═══════════════════════════════════════
  ResidentList: {
    list_item_view: {
      id: "resident_list_item_view",
      label: "View Resident Engagements List",
      type: "page",
      requires: [],
    },
    list_item_click: {
      id: "resident_list_item_click",
      label: "Open Resident Engagement Details",
      type: "action",
      requires: ["ResidentList.list_item_view"],
    },
    search_box: {
      id: "resident_search_box",
      label: "Search Resident Engagements",
      type: "search",
      requires: ["ResidentList.list_item_view"],
    },
    filter_status: {
      id: "resident_filter_status",
      label: "Filter by Engagement Status",
      type: "filter",
      requires: ["ResidentList.list_item_view"],
    },
    btn_add: {
      id: "resident_btn_add",
      label: "Create Resident Engagement",
      type: "button",
      requires: ["ResidentList.list_item_view"],
    },
  },

  // ═══════════════════════════════════════
  // 📝 Engagement Form
  // ═══════════════════════════════════════
  ResidentForm: {
    form_view: {
      id: "resident_form_view",
      label: "Resident Engagement Form",
      type: "section",
      requires: ["ResidentList.btn_add"],
    },
    btn_submit: {
      id: "resident_form_btn_submit",
      label: "Submit Engagement Form",
      type: "button",
      requires: ["ResidentForm.form_view"],
    },
  },

  // ═══════════════════════════════════════
  // 🔍 Engagement Details
  // ═══════════════════════════════════════
  ResidentDetails: {
    details_view: {
      id: "resident_details_view",
      label: "View Engagement Details",
      type: "page",
      requires: ["ResidentList.list_item_click"],
    },
    btn_edit: {
      id: "resident_details_btn_edit",
      label: "Edit Engagement",
      type: "button",
      requires: ["ResidentDetails.details_view"],
    },
    // Lifecycle actions — destructive/state-changing, separately gated
    btn_activate: {
      id: "resident_details_btn_activate",
      label: "Activate Engagement",
      type: "button",
      requires: ["ResidentDetails.details_view"],
    },
    btn_suspend: {
      id: "resident_details_btn_suspend",
      label: "Suspend Engagement",
      type: "button",
      requires: ["ResidentDetails.details_view"],
    },
    btn_complete: {
      id: "resident_details_btn_complete",
      label: "Complete Engagement",
      type: "button",
      requires: ["ResidentDetails.details_view"],
    },
    btn_close: {
      id: "resident_details_btn_close",
      label: "Close Engagement",
      type: "button",
      requires: ["ResidentDetails.details_view"],
    },
    // Section gates
    team_section: {
      id: "resident_details_team_section",
      label: "Team / Assignments Section",
      type: "section",
      requires: ["ResidentDetails.details_view"],
    },
    activities_section: {
      id: "resident_details_activities_section",
      label: "Daily Activities Section",
      type: "section",
      requires: ["ResidentDetails.details_view"],
    },
    quality_section: {
      id: "resident_details_quality_section",
      label: "Quality Issues Section",
      type: "section",
      requires: ["ResidentDetails.details_view"],
    },
    // Quality issues may contain sensitive vendor-related findings
    quality_create: {
      id: "resident_details_quality_create",
      label: "Raise Quality Issue",
      type: "button",
      requires: ["ResidentDetails.quality_section"],
    },
    reports_section: {
      id: "resident_details_reports_section",
      label: "Periodic Reports Section",
      type: "section",
      requires: ["ResidentDetails.details_view"],
    },
    report_submit: {
      id: "resident_details_report_submit",
      label: "Submit Periodic Report",
      type: "button",
      requires: ["ResidentDetails.reports_section"],
    },
    report_approve: {
      id: "resident_details_report_approve",
      label: "Approve Periodic Report",
      type: "button",
      requires: ["ResidentDetails.reports_section"],
    },
    // Man-days may have billing implications — separately gated
    mandays_section: {
      id: "resident_details_mandays_section",
      label: "Man-Days / Timesheet Section",
      type: "section",
      requires: ["ResidentDetails.details_view"],
    },
  },
};
