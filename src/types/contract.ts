// src/types/contract.ts

// ═══════════════════════════════════════
// 👤 Contact Person
// ═══════════════════════════════════════
export interface ContactPerson {
  id: string;
  name: string;
  position?: string;
  mobile: string;
  email?: string;
  department?: string;
}

// ═══════════════════════════════════════
// 🏢 Client
// ═══════════════════════════════════════
export interface Client {
  id: string;
  name_en: string;
  name_fa: string;
  type: "LEGAL" | "INDIVIDUAL";
  category?: string;
  company_type?: string;
  national_id: string;
  phone: string;
  email: string;
  emails?: string[];
  departments: string[];
  contactPersons: ContactPerson[];
  logoColor: string;
  contracts: number;
  contacts: number;
  registration_no?: string;
  economic_code?: string;
  abbreviated_name?: string;
  address_en?: string;
  address_fa?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════
// 💰 Tariff Line
// ═══════════════════════════════════════
export interface TariffLine {
  id: string;
  contract_id?: string;
  description: string;
  unit: string;
  rate: number | string;
  total_quantity?: number;
  consumed_quantity?: number;
  invoiced?: number;
  currency?: string;
  total?: number;
  isLumpSum?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════
// 📎 Contract Attachment
// ═══════════════════════════════════════
export interface ContractAttachment {
  id: string;
  name: string;
  url?: string;
  type?: string;
  size?: number;
  file_object?: any;
  preview_url?: string;
  category?: string;
  uploaded_at?: string;
}

// ═══════════════════════════════════════
// 🛡️ Guarantee
// ═══════════════════════════════════════
export interface Guarantee {
  id?: string;
  has_guarantee?: boolean;
  type: string;
  amount?: number;
  percentage?: number;
  issue_date?: string;
  expiry_date?: string;
  bank?: string;
  reference_no?: string;
}

// ═══════════════════════════════════════
// 📝 Contract Modification
// ═══════════════════════════════════════
export interface ContractModification {
  id?: string;
  contract_id?: string;
  type?: "AMENDMENT" | "ADDENDUM" | "EXTENSION";
  description?: string;
  date?: string;
  value_change?: number;
  time_change?: number;
  percentage?: number;
}

// ═══════════════════════════════════════
// ⚖️ Adjustment
// ═══════════════════════════════════════
export interface Adjustment {
  id?: string;
  contract_id?: string;
  type?: "PRICE" | "SCOPE" | "TIME";
  description?: string;
  amount?: number;
  date?: string;
  approved_by?: string;
  enabled?: boolean;
  mode?: "FIXED" | "TBD";
  percentage?: number;
  effective_date?: string;
}

// ═══════════════════════════════════════
// 📄 Contract
// ═══════════════════════════════════════
export interface Contract {
  id: string;
  client_id: string;
  client_name?: string;
  contract_no: string;
  external_contract_no?: string;
  contract_title: string;
  description?: string;
  service_description?: string;
  type: "CONTRACT" | "WORK_ORDER";
  status:
    | "ACTIVE"
    | "COMPLETED"
    | "TERMINATED"
    | "PENDING"
    | "NOT_STARTED"
    | "NEEDS_REVIEW";
  total_value: number;
  invoiced: number;
  currency: string;
  start_date: string;
  end_date: string;
  tariffs: number;
  tariffLines?: TariffLine[];
  department?: string;
  source_type?: "EMAIL" | "LETTER";
  source_ref?: string;
  source_file?: string;
  source_file_object?: any;
  source_letter_date?: string;
  source_letter_image?: string;
  source_letter_image_preview?: string;
  source_letter_image_object?: any;
  source_email_from?: string;
  source_email_date?: string;
  contract_count?: number;
  financial_terms?: {
    adjustment?: {
      enabled?: boolean;
      effective_date?: string;
      mode?: "FIXED" | "TBD";
      percentage?: number;
    };
    payment_method?: string;
    payment_terms?: string;
    advance_payment?: number;
    retention?: number;
    warranty_period?: string;
    penalty_clause?: string;
  };
  attachments?: ContractAttachment[];
  guarantees?: Guarantee[];
  modifications?: ContractModification[];
  adjustments?: Adjustment[];
  createdAt?: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════
// 👷 Inspector
// ═══════════════════════════════════════
export interface Inspector {
  id: string;
  name_en: string;
  name_fa?: string;
  specialties: string[];
  phone?: string;
  email?: string;
  certification?: string;
  certifications?: number;
  status?: string;
  avatar?: string;
  rating?: number;
  location?: string;
  activeJobs?: number;
  completedJobs?: number;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════
// 🔍 Inspection
// ═══════════════════════════════════════
export interface Inspection {
  id: string;
  contract_id: string;
  inspector_id?: string;
  type?: string;
  status: string;
  scheduled_date?: string;
  completed_date?: string;
  location?: string;
  notes?: string;
  report_url?: string;
  inspection_no?: string;
  contract_no?: string;
  client_name?: string;
  inspector_name?: string;
  source?: string;
  reference_no?: string;
  date_requested?: string;
  date_assigned?: string;
  date_executed?: string;
  date_completed?: string;
  has_ncr?: boolean;
  discipline?: string;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════
// ⚠️ NCR (Non-Conformance Report)
// ═══════════════════════════════════════
export interface NCR {
  id: string;
  inspection_id: string;
  title?: string;
  severity: string;
  status: string;
  description: string;
  corrective_action?: string;
  assigned_to?: string;
  due_date?: string;
  resolved_date?: string;
  ncr_no?: string;
  inspection_no?: string;
  client_name?: string;
  date_raised?: string;
  date_closed?: string;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════
// 💵 Invoice
// ═══════════════════════════════════════
export interface Invoice {
  id: string;
  contract_id?: string;
  inspection_id?: string;
  invoice_no: string;
  amount: number;
  currency: string;
  status: string;
  issue_date?: string;
  issued_date?: string;
  due_date: string;
  paid_date?: string;
  notes?: string;
  inspection_no?: string;
  contract_no?: string;
  client_name?: string;
  tax_amount?: number;
  total_amount?: number;
  created_at?: string;
  updated_at?: string;
}
