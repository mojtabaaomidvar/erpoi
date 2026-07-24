// src/shared/authorization/ui/elements/ProjectElements.ts

import type { UIModuleElements } from "../types";

export const ProjectElements: UIModuleElements = {
  ProjectList: {
    list_item_view: {
      id: "project_list_item_view",
      label: "View Project List",
      type: "action",
      requires: [],
    },
    list_item_click: {
      id: "project_list_item_click",
      label: "Click Project Item",
      type: "action",
      requires: ["ProjectList.list_item_view"],
    },
    search_box: {
      id: "project_search_box",
      label: "Search Box",
      type: "search",
      requires: ["ProjectList.list_item_view"],
    },
    filter_status: {
      id: "project_filter_status",
      label: "Status Filter Tabs",
      type: "filter",
      requires: ["ProjectList.list_item_view"],
    },
    btn_add: {
      id: "project_btn_add",
      label: "Add Project Button",
      type: "button",
      requires: ["ProjectList.list_item_view"],
    },
    btn_export: {
      id: "project_btn_export",
      label: "Export Projects Button",
      type: "button",
      requires: ["ProjectList.list_item_view"],
    },
  },

  ProjectDetails: {
    btn_edit: {
      id: "project_btn_edit",
      label: "Edit Project Button",
      type: "button",
      requires: ["ProjectList.list_item_click"],
    },
    stats_section: {
      id: "project_stats_section",
      label: "Inspection Statistics Section",
      type: "section",
      requires: ["ProjectList.list_item_click"],
    },
    stat_tpi_spot: {
      id: "project_stat_tpi_spot",
      label: "TPI Spot Inspections Stat",
      type: "statistic",
      requires: ["ProjectDetails.stats_section"],
    },
    stat_tpi_resident: {
      id: "project_stat_tpi_resident",
      label: "TPI Resident Inspections Stat",
      type: "statistic",
      requires: ["ProjectDetails.stats_section"],
    },
    stat_mws: {
      id: "project_stat_mws",
      label: "MWS Inspections Stat",
      type: "statistic",
      requires: ["ProjectDetails.stats_section"],
    },
    stat_total_inspections: {
      id: "project_stat_total_inspections",
      label: "Total Inspections Stat",
      type: "statistic",
      requires: ["ProjectDetails.stats_section"],
    },
    stat_completed_inspections: {
      id: "project_stat_completed_inspections",
      label: "Completed Inspections Stat",
      type: "statistic",
      requires: ["ProjectDetails.stats_section"],
    },
    stat_total_man_days: {
      id: "project_stat_total_man_days",
      label: "Total Man-Days Stat",
      type: "statistic",
      requires: ["ProjectDetails.stats_section"],
    },
    progress_overall: {
      id: "project_progress_overall",
      label: "Overall Progress Bar",
      type: "progress",
      requires: ["ProjectDetails.stats_section"],
    },
    info_pm: {
      id: "project_info_pm",
      label: "Project Manager Display",
      type: "information",
      requires: ["ProjectDetails.team_section"],
    },
    info_coordinator: {
      id: "project_info_coordinator",
      label: "Coordinator Display",
      type: "information",
      requires: ["ProjectDetails.team_section"],
    },
  },

  ProjectForm: {
    form_view: {
      id: "project_form_view",
      label: "Project Form View",
      type: "section",
      requires: ["ProjectList.btn_add", "ProjectDetails.btn_edit"],
    },
  },
};
