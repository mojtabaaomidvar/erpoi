// src/shared/authorization/ui/elements/InspectorElements.ts

import type { UIModuleElements } from "../types";

export const InspectorElements: UIModuleElements = {
  InspectorList: {
    list_view: {
      id: "inspector_list_view",
      label: "View Inspector List",
      type: "page",
      requires: [],
    },
    list_item_click: {
      id: "inspector_list_item_click",
      label: "Clickable Inspector Item",
      type: "action",
      requires: ["InspectorList.list_view"],
    },
    btn_add: {
      id: "inspector_btn_add",
      label: "Create Inspector",
      type: "button",
      requires: ["InspectorList.list_view"],
    },
    btn_edit: {
      id: "inspector_btn_edit",
      label: "Edit Inspector",
      type: "button",
      requires: ["InspectorList.list_item_click"],
    },
    btn_delete: {
      id: "inspector_btn_delete",
      label: "Delete Inspector",
      type: "button",
      requires: ["InspectorList.list_item_click"],
    },
    btn_assign: {
      id: "inspector_btn_assign",
      label: "Assign Inspector",
      type: "button",
      requires: ["InspectorList.list_item_click"],
    },
    search_box: {
      id: "inspector_search_box",
      label: "Search Inspectors",
      type: "filter",
      requires: ["InspectorList.list_view"],
    },
    filter_specialty: {
      id: "inspector_filter_specialty",
      label: "Filter by Specialty",
      type: "filter",
      requires: ["InspectorList.list_view"],
    },
    filter_availability: {
      id: "inspector_filter_availability",
      label: "Filter by Availability",
      type: "filter",
      requires: ["InspectorList.list_view"],
    },
    filter_type: {
      id: "inspector_filter_availability",
      label: "Filter by Availability",
      type: "filter",
      requires: ["InspectorList.list_view"],
    },
  },
  InspectorDetails: {
    details_view: {
      id: "inspector_details_view",
      label: "View Inspector Details",
      type: "page",
      requires: ["InspectorList.list_item_click"],
    },
    info_section: {
      id: "inspector_details_info",
      label: "Inspector Information",
      type: "section",
      requires: ["InspectorDetails.details_view"],
    },
    certifications_section: {
      id: "inspector_details_certifications",
      label: "Certifications Section",
      type: "section",
      requires: ["InspectorDetails.details_view"],
    },
    assignments_section: {
      id: "inspector_details_assignments",
      label: "Assignments Section",
      type: "section",
      requires: ["InspectorDetails.details_view"],
    },
    stats_section: {
      id: "inspector_details_stats",
      label: "Inspector Statistics",
      type: "section",
      requires: ["InspectorDetails.details_view"],
    },
    download_resume: {
      id: "inspector_download_resume",
      label: "Inspector Resume",
      type: "section",
      requires: ["InspectorDetails.details_view"],
    },
  },
  InspectorAssignment: {
    assignment_modal: {
      id: "inspector_assignment_modal",
      label: "Inspector Assignment Modal",
      type: "dialog",
      requires: ["InspectorList.btn_assign"],
    },
    select_inspector: {
      id: "inspector_assignment_select",
      label: "Select Inspector",
      type: "field",
      requires: ["InspectorAssignment.assignment_modal"],
    },
    confirm_assignment: {
      id: "inspector_assignment_confirm",
      label: "Confirm Assignment",
      type: "button",
      requires: ["InspectorAssignment.assignment_modal"],
    },
  },
};
