// src/shared/authorization/ui/elements/InspectionElements.ts

import type { UIModuleElements } from "../types";

export const InspectionElements: UIModuleElements = {
  InspectionList: {
    list_item_view: {
      id: "inspection_list_item_view",
      label: "View Inspection Requests List",
      type: "page",
      requires: [],
    },
    list_item_click: {
      id: "inspection_list_item_click",
      label: "Clickable Inspection Request",
      type: "action",
      requires: ["InspectionList.list_item_view"],
    },
    btn_add: {
      id: "inspection_btn_add",
      label: "Create Inspection Request",
      type: "button",
      requires: ["InspectionList.list_item_view"],
    },
    btn_execute: {
      id: "inspection_btn_execute",
      label: "Execute Inspection",
      type: "button",
      requires: ["InspectionList.list_item_click"],
    },
    search_box: {
      id: "inspection_search_box",
      label: "Search Inspections",
      type: "filter",
      requires: ["InspectionList.list_item_view"],
    },
    filter_status: {
      id: "inspection_filter_status",
      label: "Filter by Status",
      type: "filter",
      requires: ["InspectionList.list_item_view"],
    },
    filter_category: {
      id: "inspection_filter_category",
      label: "Filter by Category",
      type: "filter",
      requires: ["InspectionList.list_item_view"],
    },
    filter_project: {
      id: "inspection_filter_project",
      label: "Filter by Project",
      type: "filter",
      requires: ["InspectionList.list_item_view"],
    },
    filter_priority: {
      id: "inspection_filter_priority",
      label: "Inspection Priority Filter",
      type: "filter",
      requires: ["InspectionList.list_item_view"],
    },
  },
  InspectionDetails: {
    details_view: {
      id: "inspection_details_view",
      label: "View Inspection Details",
      type: "page",
      requires: ["InspectionList.list_item_click"],
    },
    info_section: {
      id: "inspection_details_info",
      label: "Inspection Information",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    btn_edit: {
      id: "inspection_btn_edit",
      label: "Edit Inspection Request",
      type: "button",
      requires: ["InspectionList.list_item_click"],
    },
    btn_delete: {
      id: "inspection_btn_delete",
      label: "Delete Inspection Request",
      type: "button",
      requires: ["InspectionList.list_item_click"],
    },
    documents_section: {
      id: "inspection_details_documents",
      label: "Document Review Section",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    documents_upload: {
      id: "inspection_details_documents_upload",
      label: "Upload Document",
      type: "button",
      requires: ["InspectionDetails.documents_section"],
    },
    documents_approve: {
      id: "inspection_details_documents_approve",
      label: "Approve Document",
      type: "button",
      requires: ["InspectionDetails.documents_section"],
    },
    documents_reject: {
      id: "inspection_details_documents_reject",
      label: "Reject Document",
      type: "button",
      requires: ["InspectionDetails.documents_section"],
    },
    checklist_section: {
      id: "inspection_details_checklist",
      label: "Checklist Section",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    checklist_edit: {
      id: "inspection_details_checklist_edit",
      label: "Edit Checklist",
      type: "button",
      requires: ["InspectionDetails.checklist_section"],
    },
    checklist_submit: {
      id: "inspection_details_checklist_submit",
      label: "Submit Checklist",
      type: "button",
      requires: ["InspectionDetails.checklist_section"],
    },
    ncr_section: {
      id: "inspection_details_ncr",
      label: "NCR Section",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    ncr_add: {
      id: "inspection_details_ncr_add",
      label: "Add NCR",
      type: "button",
      requires: ["InspectionDetails.ncr_section"],
    },
    ncr_edit: {
      id: "inspection_details_ncr_edit",
      label: "Edit NCR",
      type: "button",
      requires: ["InspectionDetails.ncr_section"],
    },
    ncr_close: {
      id: "inspection_details_ncr_close",
      label: "Close NCR",
      type: "button",
      requires: ["InspectionDetails.ncr_section"],
    },
    certificates_section: {
      id: "inspection_details_certificates",
      label: "Certificates Section",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    certificates_verify: {
      id: "inspection_details_certificates_verify",
      label: "Verify Certificate",
      type: "button",
      requires: ["InspectionDetails.certificates_section"],
    },
    reports_section: {
      id: "inspection_details_reports",
      label: "Reports Section",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    reports_generate: {
      id: "inspection_details_reports_generate",
      label: "Generate Report",
      type: "button",

      requires: ["InspectionDetails.reports_section"],
    },
    reports_send: {
      id: "inspection_details_reports_send",
      label: "Send Report",
      type: "button",
      requires: ["InspectionDetails.reports_section"],
    },
    inspector_section: {
      id: "inspection_details_inspector",
      label: "Inspector Assignment",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
    inspector_assign: {
      id: "inspection_details_inspector_assign",
      label: "Assign Inspector to Inspection",
      type: "button",
      requires: ["InspectionDetails.inspector_section"],
    },
    progress_section: {
      id: "inspection_details_progress",
      label: "Inspection Progress",
      type: "section",
      requires: ["InspectionDetails.details_view"],
    },
  },
};
