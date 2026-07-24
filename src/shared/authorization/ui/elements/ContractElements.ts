// src/shared/authorization/ui/elements/ContractElements.ts

import type { UIModuleElements } from "../types";

export const ContractElements: UIModuleElements = {
  ContractList: {
    list_item_view: {
      id: "contract_list_item_view",
      label: "View Contract Item",
      type: "action",
      requires: [],
    },
    list_item_click: {
      id: "contract_list_item_click",
      label: "Clickable Contract Item",
      type: "action",
      requires: ["ContractList.list_item_view"],
    },
    search_box: {
      id: "contract_search_box",
      label: "Contract Search Box",
      type: "search",
      requires: ["ContractList.list_item_view"],
    },
    filter_type: {
      id: "contract_filter_type",
      label: "Contract Type Filter",
      type: "filter",
      requires: ["ContractList.list_item_view"],
    },
    filter_status: {
      id: "contract_filter_status",
      label: "Contract Status Filter",
      type: "filter",
      requires: ["ContractList.list_item_view"],
    },
    status_badge: {
      id: "contract_status_badge",
      label: "Contract Status Badge",
      type: "badge",
      requires: ["ContractList.list_item_view"],
    },
    list_value: {
      id: "contract_list_value",
      label: "Contract List Value",
      type: "statistic",
      requires: ["ContractList.list_item_view"],
    },
    list_dates: {
      id: "contract_list_dates",
      label: "Contract Dates in List",
      type: "information",
      requires: ["ContractList.list_item_view"],
    },
    progress_bar: {
      id: "contract_progress_bar",
      label: "Contract Progress Bar",
      type: "progress",
      requires: ["ContractList.list_item_view"],
    },
    btn_add: {
      id: "contract_btn_add",
      label: "Add Contract Button",
      type: "button",
      requires: ["ContractList.list_item_view"],
    },
    btn_export: {
      id: "contract_btn_export",
      label: "Export Contracts Button",
      type: "button",
      requires: ["ContractList.list_item_view"],
    },
  },
  ContractDetails: {
    info_section: {
      id: "contract_info_section",
      label: "Contract Information",
      type: "section",
      requires: ["ContractList.list_item_click"],
    },
    amendments_section: {
      id: "contract_details_amendments",
      label: "Amendments Section",
      type: "section",
      requires: ["ContractDetails.info_section"],
    },
    amendments_add: {
      id: "contract_details_amendments_add",
      label: "Add Amendment",
      type: "button",
      requires: ["ContractDetails.amendments_section"],
    },
    amendments_approve: {
      id: "contract_details_amendments_approve",
      label: "Approve Amendment",
      type: "button",
      requires: ["ContractDetails.amendments_section"],
    },
    amendments_reject: {
      id: "contract_details_amendments_reject",
      label: "Reject Amendment",
      type: "button",
      requires: ["ContractDetails.amendments_section"],
    },
    btn_edit: {
      id: "contract_btn_edit",
      label: "Edit Contract",
      type: "button",
      requires: ["ContractDetails.info_section"],
    },
    btn_amend: {
      id: "contract_btn_amend",
      label: "Amend Contract",
      type: "button",
      requires: ["ContractDetails.info_section"],
    },
    btn_approve: {
      id: "contract_btn_approve",
      label: "Approve Contract",
      type: "button",
      requires: ["ContractDetails.info_section"],
    },
    btn_doc: {
      id: "contract_btn_doc",
      label: "View Contract Documents",
      type: "button",
      requires: ["ContractDetails.info_section"],
    },
    info_start_date: {
      id: "contract_info_start_date",
      label: "Contract Start Date",
      type: "information",
      requires: ["ContractDetails.info_section"],
    },
    info_end_date: {
      id: "contract_info_end_date",
      label: "Contract End Date",
      type: "information",
      requires: ["ContractDetails.info_section"],
    },
    stat_total_value: {
      id: "contract_stat_total_value",
      label: "Contract Total Value Stat",
      type: "statistic",
      requires: ["ContractList.list_item_click"],
    },
    stat_performed_work: {
      id: "contract_stat_performed_work",
      label: "Contract Performed Work Stat",
      type: "statistic",
      requires: ["ContractList.list_item_click"],
    },
    stat_invoiced: {
      id: "contract_stat_invoiced",
      label: "Contract Invoiced Stat",
      type: "statistic",
      requires: ["ContractList.list_item_click"],
    },
    stat_not_invoiced: {
      id: "contract_stat_not_invoiced",
      label: "Contract Not Invoiced Stat",
      type: "statistic",
      requires: ["ContractList.list_item_click"],
    },
    progress_work: {
      id: "contract_progress_work",
      label: "Contract Work Progress",
      type: "progress",
      requires: ["ContractList.list_item_click"],
    },
    progress_invoice: {
      id: "contract_progress_invoice",
      label: "Contract Invoice Progress",
      type: "progress",
      requires: ["ContractList.list_item_click"],
    },
    progress_time: {
      id: "contract_progress_time",
      label: "Contract Time Progress",
      type: "progress",
      requires: ["ContractList.list_item_click"],
    },
    reminder_section: {
      id: "contract_reminder_section",
      label: "Contract Reminder Section",
      type: "section",
      requires: ["ContractDetails.info_section"],
    },
    table_tariffs: {
      id: "contract_table_tariffs",
      label: "Contract Tariffs Table",
      type: "table",
      requires: ["ContractDetails.stat_total_value"],
    },
  },
};
