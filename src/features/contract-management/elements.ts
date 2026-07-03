// src/features/contract-management/elements.ts

export const contractElements = {
  ContractList: {
    list_item_view: 'View Contract List',
    list_item_click: 'Click Contract Item',
    search_box: 'Search Box',
    sort_select: 'Sort Dropdown',
    filter_type: 'Type Filter Tabs',
    filter_status: 'Status Filter Tabs',
    status_badge: 'Contract Status Badge',
    list_value: 'Contract Value in List',
    progress_bar: 'Time Progress Bar',
    contract_dates: 'Contract Dates',
    btn_add: 'Add Contract Button',
    btn_export: 'Export Contracts Button',
  },
  
  ContractDetails: {
    btn_edit: 'Edit Contract Button',
    btn_delete: 'Delete Contract Button',
    btn_approve: 'Approve Contract Button - Only for Manager',
    btn_close: 'Close Panel Button',
    info_section: 'Contract Information Section',
	info_start_date: 'Start Date Display',
    info_end_date: 'End Date Display',
    stat_total_value: 'Total Value Stat',
    stat_performed_work: 'Total Performed Work Stat',
    stat_invoiced: 'Invoiced Stat',
    stat_not_invoiced: 'Not Invoiced Stat',
    progress_work: 'Work Progress Bar',
    progress_invoice: 'Invoice Progress Bar',
    progress_time: 'Time Progress Bar',
    reminder_section: 'Adjustment Reminder Section',
    table_tariffs: 'Tariffs Table',
  },
  
  ContractForm: {
    // 🔹 Modals
    modal_add: 'Add Contract Modal',
    modal_edit: 'Edit Contract Modal',
    
    // 🔹 Type Selector
    field_type: 'Type Selector (Contract/Work Order)',
    
    // 🔹 Basic Fields
    field_client: 'Client Selector',
    field_title: 'Contract Title Field',
    field_service_description: 'Service Description Field',
    field_dates: 'Start/End Date Fields',
    field_contract_no: 'Contract Number Fields',
    
    // 🔹 Financial Fields
    field_total_value: 'Total Value Field',
    field_currency: 'Currency Field',
    field_tariffs: 'Tariffs Section',
    
    // 🔹 Financial & Legal Terms
    field_financial_terms: 'Financial Terms Section',
    field_adjustment: 'Price Adjustment Section',
    field_modification: 'Contract Modification Section',
    field_guarantee: 'Guarantee Section',
    field_good_performance: 'Good Performance Field',
    field_insurance: 'Insurance Deduction Field',
    
    // 🔹 Other Fields
    field_attachments: 'Attachments Section',
    field_description: 'Description Field',
    
    // 🔹 Work Order Specific
    field_source_type: 'Source Type Selector (Letter/Email)',
    field_letter: 'Letter Fields (Number, Date, Image)',
    field_email_source: 'Email Fields (From, Date, File)',
  },
};

export default contractElements;