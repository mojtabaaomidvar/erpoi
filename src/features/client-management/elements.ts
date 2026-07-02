// src/features/client-management/elements.ts

export const clientElements = {
  ClientList: {
    card_total: 'Total Clients Card',
    card_legal: 'Legal Clients Card',
    card_individual: 'Individual Clients Card',
    btn_add: 'Add Client Button',
    btn_export: 'Export Clients Button',
    list_item: 'View Client List',           // 🔧 فقط دیدن لیست
    list_item_click: 'Click Client Item',    // 🔧 کلیک روی آیتم (جدید)
  },
  ClientDetails: {
    btn_edit: 'Edit Client Button',
    btn_delete: 'Delete Client Button',
    stat_contracts: 'Client Contracts Stat',
    stat_total_value: 'Client Total Value Stat',
    stat_invoiced: 'Client Invoiced Stat',
    stat_not_invoiced: 'Client Not Invoiced Stat',
  },
  ClientForm: {
    modal_add: 'Add Client Modal',
    field_national_id: 'National ID Field',
    field_phone: 'Phone Field',
    field_email: 'Email Field',
    field_address: 'Address Field',
  },
  ClientEditModal: {
    modal_edit: 'Edit Client Modal',
  },
};

export default clientElements;