// src/shared/authorization/ui/elements/TPIElements.ts
// ═══════════════════════════════════════
// 🏭 TPI Permission Elements
// ═══════════════════════════════════════

import type { UIModuleElements } from "../types";

export const TPIElements: UIModuleElements = {
  // ═══════════════════════════════════════
  // 📋 TPI List
  // ═══════════════════════════════════════
  TPIList: {
    list_item_view: {
      id: "tpi_list_item_view",
      label: "View TPI Requests List",
      type: "page",
      requires: [],
    },
    list_item_click: {
      id: "tpi_list_item_click",
      label: "Click TPI Request Item",
      type: "action",
      requires: ["TPIList.list_item_view"],
    },
    search_box: {
      id: "tpi_search_box",
      label: "TPI Search Box",
      type: "search",
      requires: ["TPIList.list_item_view"],
    },
    filter_mode: {
      id: "tpi_filter_mode",
      label: "Filter by TPI Mode (Spot/Resident)",
      type: "filter",
      requires: ["TPIList.list_item_view"],
    },
    btn_add: {
      id: "tpi_btn_add",
      label: "Create TPI Request",
      type: "button",
      requires: ["TPIList.list_item_view"],
    },
  },

  // ═══════════════════════════════════════
  // 📝 TPI Request Form
  // ═══════════════════════════════════════
  TPIForm: {
    form_view: {
      id: "tpi_form_view",
      label: "TPI Request Form View",
      type: "section",
      requires: ["TPIList.list_item_click"],
    },
    select_project: {
      id: "tpi_form_select_project",
      label: "Select Project",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    select_mode: {
      id: "tpi_form_select_mode",
      label: "Select TPI Mode",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    select_vendor: {
      id: "tpi_form_select_vendor",
      label: "Select Vendor (Spot)",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    select_site_rep: {
      id: "tpi_form_select_site_rep",
      label: "Select Site Representative (Resident)",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    select_service_domain: {
      id: "tpi_form_select_service_domain",
      label: "Select Service Domains",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    input_scope: {
      id: "tpi_form_input_scope",
      label: "Inspection Scope",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    input_date: {
      id: "tpi_form_input_date",
      label: "Inspection Date",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    select_priority: {
      id: "tpi_form_select_priority",
      label: "Select Priority",
      type: "field",
      requires: ["TPIForm.form_view"],
    },
    btn_submit: {
      id: "tpi_form_btn_submit",
      label: "Submit TPI Request",
      type: "button",
      requires: ["TPIForm.form_view"],
    },
    btn_cancel: {
      id: "tpi_form_btn_cancel",
      label: "Cancel",
      type: "button",
      requires: ["TPIForm.form_view"],
    },
  },

  // ═══════════════════════════════════════
  // 🔍 TPI Details
  // ═══════════════════════════════════════
  TPIDetails: {
    details_view: {
      id: "tpi_details_view",
      label: "View TPI Request Details",
      type: "page",
      requires: ["TPIList.list_item_click"],
    },
    btn_edit: {
      id: "tpi_details_btn_edit",
      label: "Edit TPI Request",
      type: "button",
      requires: ["TPIDetails.details_view"],
    },
    btn_delete: {
      id: "tpi_details_btn_delete",
      label: "Delete TPI Session",
      type: "button",
      requires: ["TPIDetails.details_view"],
    },
    btn_request_package_deletion: {
      id: "tpi_details_btn_request_package_deletion",
      label: "Request TPI Package Deletion",
      type: "button",
      requires: ["TPIDetails.details_view"],
    },
    info_section: {
      id: "tpi_details_info_section",
      label: "TPI Information Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
    documents_section: {
      id: "tpi_details_documents_section",
      label: "TPI Documents Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
    inspector_section: {
      id: "tpi_details_inspector_section",
      label: "Inspector Assignment Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
    checklist_section: {
      id: "tpi_details_checklist_section",
      label: "Checklist Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
    ncr_section: {
      id: "tpi_details_ncr_section",
      label: "NCR Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
    ncr_export: {
      id: "tpi_details_ncr_export",
      label: "Export NCR / Observation DOCX",
      type: "button",
      requires: ["TPIDetails.ncr_section"],
    },
    report_section: {
      id: "tpi_details_report_section",
      label: "Report Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
    release_note_section: {
      id: "tpi_details_release_note_section",
      label: "Release Note Section",
      type: "section",
      requires: ["TPIDetails.details_view"],
    },
  },
};
