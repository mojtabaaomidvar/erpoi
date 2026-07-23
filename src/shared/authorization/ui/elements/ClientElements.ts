// src/shared/authorization/ui/elements/ClientElements.ts

import type { UIModuleElements } from "../types";

export const ClientElements: UIModuleElements = {
  ClientList: {
    list_item_view: {
      id: "client_list_item_view",
      label: "View Client List",
      type: "action",
      category: "navigation",
      requires: [],
    },
    list_item_click: {
      id: "client_list_item_click",
      label: "Click Client Item",
      type: "action",
      category: "navigation",
      requires: ["ClientList.list_item_view"],
    },
    search_box: {
      id: "client_search_box",
      label: "Search Box",
      type: "search",
      category: "filtering",
      requires: ["ClientList.list_item_view"],
    },
    filter_type: {
      id: "client_filter_type",
      label: "Type Filter Tabs",
      type: "filter",
      category: "filtering",
      requires: ["ClientList.list_item_view"],
    },
    total_agreement_badge: {
      id: "client_total_agreement_badge",
      label: "Total Agreement(s) of Client",
      type: "badge",
      category: "information",
      requires: ["ClientList.list_item_view"],
    },
    total_agreement_value_badge: {
      id: "client_total_agreement_value_badge",
      label: "Total Values of Agreement(s)",
      type: "badge",
      category: "information",
      requires: ["ClientList.list_item_view"],
    },
    btn_add: {
      id: "client_btn_add",
      label: "Add Client Button",
      type: "button",
      category: "crud",
      requires: ["ClientList.list_item_view"],
    },
    btn_export: {
      id: "client_btn_export",
      label: "Export Clients Button",
      type: "button",
      category: "reporting",
      requires: ["ClientList.list_item_view"],
    },
  },

  ClientDetails: {
    btn_edit: {
      id: "client_btn_edit",
      label: "Edit Client Button",
      type: "button",
      category: "crud",
      requires: ["ClientList.list_item_click"],
    },
    btn_delete: {
      id: "client_btn_delete",
      label: "Delete Client Button",
      type: "button",
      category: "crud",
      requires: ["ClientList.list_item_click"],
    },
    emails_dropdown: {
      id: "client_emails_dropdown",
      label: "Emails Dropdown",
      type: "dropdown",
      category: "information",
      requires: ["ClientList.list_item_click"],
    },
    contacts_dropdown: {
      id: "client_contacts_dropdown",
      label: "Contact Persons Dropdown",
      type: "dropdown",
      category: "information",
      requires: ["ClientList.list_item_click"],
    },
    stat_agreements: {
      id: "client_stat_agreements",
      label: "Total Agreements Card",
      type: "statistic",
      category: "analytics",
      requires: ["ClientList.total_agreement_badge"],
    },
    stat_value_agreements: {
      id: "client_stat_value_agreements",
      label: "Total Value Card",
      type: "statistic",
      category: "analytics",
      requires: ["ClientList.total_agreement_value_badge"],
    },
    stat_invoiced: {
      id: "client_stat_invoiced",
      label: "Invoiced Works Card",
      type: "statistic",
      category: "analytics",
      requires: ["ClientList.total_agreement_value_badge"],
    },
    stat_uninvoiced: {
      id: "client_stat_uninvoiced",
      label: "Not Invoiced Works Card",
      type: "statistic",
      category: "analytics",
      requires: ["ClientList.total_agreement_value_badge"],
    },
    agreements_section: {
      id: "client_agreements_section",
      label: "Agreements Section",
      type: "section",
      category: "information",
      requires: ["ClientList.list_item_click"],
    },
    agreement_value: {
      id: "client_agreement_value",
      label: "Contract Value Display",
      type: "statistic",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientList.total_agreement_value_badge",
      ],
    },
    contract_dates: {
      id: "client_contract_dates",
      label: "Contract Dates Display",
      type: "information",
      category: "information",
      requires: ["ClientDetails.agreements_section"],
    },
    agreement_progress_work: {
      id: "client_agreement_progress_work",
      label: "Work Progress Bar",
      type: "progress",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.contract_dates",
      ],
    },
    agreement_progress_invoice: {
      id: "client_agreement_progress_invoice",
      label: "Invoice Progress Bar",
      type: "progress",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.stat_invoiced",
      ],
    },
  },

  ClientContractDetailsModal: {
    info_section: {
      id: "client_info_section",
      label: "Contract Information Section",
      type: "section",
      category: "information",
      requires: ["ClientDetails.agreements_section"],
    },
    info_start_date: {
      id: "client_info_start_date",
      label: "Start Date Display",
      type: "information",
      category: "information",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.contract_dates",
      ],
    },
    info_end_date: {
      id: "client_info_end_date",
      label: "End Date Display",
      type: "information",
      category: "information",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.contract_dates",
      ],
    },
    info_total_value: {
      id: "client_info_total_value",
      label: "Total Value Stat Card",
      type: "statistic",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientList.total_agreement_value_badge",
        "ClientDetails.agreement_value",
      ],
    },
    info_performed_work: {
      id: "client_info_performed_work",
      label: "Total Performed Work Stat Card",
      type: "statistic",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.agreement_progress_work",
      ],
    },
    info_invoiced: {
      id: "client_info_invoiced",
      label: "Invoiced Stat Card",
      type: "statistic",
      category: "analytics",
      requires: ["ClientDetails.agreement_progress_invoice"],
    },
    info_not_invoiced: {
      id: "client_info_not_invoiced",
      label: "Not Invoiced Stat Card",
      type: "statistic",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientContractDetailsModal.info_total_value",
      ],
    },
    progress_work: {
      id: "client_progress_work",
      label: "Work Progress Card",
      type: "progress",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.agreement_progress_work",
      ],
    },
    progress_invoice: {
      id: "client_progress_invoice",
      label: "Invoice Progress Card",
      type: "progress",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.agreement_progress_invoice",
      ],
    },
    progress_time: {
      id: "client_progress_time",
      label: "Time Progress Card",
      type: "progress",
      category: "analytics",
      requires: [
        "ClientDetails.agreements_section",
        "ClientDetails.contract_dates",
      ],
    },
    reminder_section: {
      id: "client_reminder_section",
      label: "Price Adjustment Reminder",
      type: "section",
      category: "information",
      requires: ["ClientDetails.agreements_section"],
    },
    tariffs_section: {
      id: "client_tariffs_section",
      label: "Tariffs Table",
      type: "table",
      category: "information",
      requires: ["ClientDetails.agreements_section"],
    },
    tariff_col_performed: {
      id: "client_tariff_col_performed",
      label: "Performed Quantity Column",
      type: "column",
      category: "information",
      requires: [
        "ClientDetails.agreements_section",
        "ClientContractDetailsModal.tariffs_section",
      ],
    },
    tariff_col_total_value: {
      id: "client_tariff_col_total_value",
      label: "Total Value Column",
      type: "column",
      category: "information",
      requires: [
        "ClientDetails.agreements_section",
        "ClientContractDetailsModal.tariffs_section",
      ],
    },
    tariff_col_invoiced: {
      id: "client_tariff_col_invoiced",
      label: "Invoiced Column",
      type: "column",
      category: "information",
      requires: [
        "ClientDetails.agreements_section",
        "ClientContractDetailsModal.tariffs_section",
      ],
    },
  },
};
