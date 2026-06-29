// src/types/contract.ts

// ============ انواع پایه ============

export type ClientType = "LEGAL" | "INDIVIDUAL";
export type ContractStatus = "ACTIVE" | "COMPLETED";
export type ContractType = "CONTRACT" | "WORK_ORDER";
export type SourceType = "EMAIL" | "LETTER";
export type AttachmentCategory = "CONTRACT" | "ADDENDUM" | "CORRESPONDENCE" | "TECHNICAL";
export type AdjustmentMode = "FIXED" | "TBD";
export type GuaranteeType = "CHECK" | "BANK_GUARANTEE" | "PROMISSORY_NOTE" | "CASH_BLOCK";
export type ServiceDescription = "TPI" | "MWS" | "TPER" | "OTHER";

// ============ Interfaces اصلی ============

export interface ContactPerson {
  id?: string;
  name: string;
  position: string;
  phone?: string;
  mobile?: string;
  email?: string;
  department?: string;
}

export interface Client {
  id: string;
  type: ClientType;
  name_en: string;
  name_fa: string;
  national_id?: string;
  email?: string;
  phone?: string;
  category: string;
  contacts: number;
  contracts: number;
  logoColor: string;
  emails?: string[];
  contact_persons?: ContactPerson[];
  // 🔑 فیلدهای جدید برای پشتیبانی از کد قدیمی
  contactPersons?: ContactPerson[];
  departments?: string[];
  address_en?: string;
  address_fa?: string;
  abbreviated_name?: string;
  company_type?: string;
  registration_no?: string;
  economic_code?: string;
}

export interface TariffLine {
  id: string;
  contract_id?: string;
  description: string;
  unit: string;
  rate: string | number;
  currency?: string;
  total?: number;
  isLumpSum?: boolean;
  total_quantity?: number;
  consumed_quantity?: number;
  invoiced?: number;
}

export interface Adjustment {
  enabled: boolean;
  mode: AdjustmentMode;
  percentage: number;
  effective_date: string;
}

export interface ContractModification {
  percentage: number;
}

export interface Guarantee {
  has_guarantee: boolean;
  percentage: number;
  type: GuaranteeType;
}

export interface ContractAttachment {
  id: string;
  name: string;
  file_object: File | null;
  preview_url: string;
  category: AttachmentCategory;
  uploaded_at: string;
}

export interface ContractFinancialTerms {
  adjustment: Adjustment;
  contract_modification: ContractModification;
  guarantee: Guarantee;
  good_performance_percentage: number;
  insurance_deduction_percentage: number;
  attachments: ContractAttachment[];
}

export interface Contract {
  id: string;
  contract_no: string;
  external_contract_no?: string;
  source_type?: SourceType;
  source_ref?: string;
  source_file?: string;
  source_file_object?: File | null;
  source_letter_date?: string;
  source_letter_image?: string;
  source_letter_image_object?: File | null;
  source_letter_image_preview?: string;
  source_email_from?: string;
  source_email_date?: string;
  client_id: string;
  client_name: string;
  contract_title: string;
  start_date: string;
  end_date: string;
  total_value: number;
  invoiced: number;
  currency: string;
  status: ContractStatus;
  type: ContractType;
  tariffs: number;
  contract_count?: number;
  tariffLines?: TariffLine[];
  department: string;
  description?: string;
  financial_terms?: ContractFinancialTerms;
  service_description?: ServiceDescription[];
}

export interface ContractLike {
  id: string;
  total_value: number;
  start_date: string;
  end_date: string;
  invoiced: number;
  status: string;
  currency?: string;
  financial_terms?: {
    adjustment?: {
      enabled?: boolean;
      effective_date?: string;
      mode?: AdjustmentMode;
      percentage?: number;
    };
  };
}

export interface TariffLike {
  rate: string | number;
  consumed_quantity?: number;
  total_quantity?: number;
  invoiced?: number;
  contract_id?: string;
}

export interface Inspector {
  id: string;
  name_en: string;
  name_fa: string;
  phone: string;
  email: string;
  location: string;
  rating: number;
  status:
    | "AVAILABLE"
    | "BUSY"
    | "ON_LEAVE";
  specialties: string[];
  certifications: number;
  activeJobs: number;
  completedJobs: number;
}

export interface Inspection {
  id: string;
  inspection_no: string;
  contract_id: string;
  contract_no?: string;
  client_name?: string;
  inspector_id?: string;
  inspector_name?: string;
  source?: string;
  reference_no?: string;
  date_requested?: string;
  date_assigned?: string;
  date_executed?: string;
  date_completed?: string;
  status: string;
  has_ncr?: boolean;
  location?: string;
  discipline?: string;
  findings?: string[];
}

export interface NCR {
  id: string;
  ncr_no?: string;
  inspection_id: string;
  inspection_no?: string;
  client_name?: string;
  description: string;
  severity:
    | "MINOR"
    | "MAJOR"
    | "CRITICAL";
  status:
    | "OPEN"
    | "IN_PROGRESS"
    | "CLOSED";
  date_raised?: string;
  date_closed?: string;
}

export interface Invoice {
  id: string;
  invoice_no?: string;
  contract_id?: string;
  contract_no?: string;
  inspection_id?: string;
  inspection_no?: string;
  client_name?: string;
  amount: number;
  tax_amount?: number;
  total_amount?: number;
  currency?: string;
  issued_date?: string;
  due_date?: string;
  paid_date?: string;
  status:
    | "DRAFT"
    | "ISSUED"
    | "PENDING"
    | "PAID"
    | "OVERDUE"
	| "CANCELLED" ;
}




