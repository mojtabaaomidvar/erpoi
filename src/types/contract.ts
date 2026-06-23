// src/types/contract.ts
// همه interfaces مربوط به قراردادها و مشتریان
// 📊 استخراج شده بر اساس تحلیل Graphify

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
  name: string;
  position: string;
  phone: string;
  email: string;
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

// ============ Interfaces برای محاسبات (Lightweight) ============

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

// ============ سایر Interfaces ============

export interface Inspector {
  id: string;
  name: string;
  discipline: string;
  certifications: string[];
  experience_years: number;
}

export interface Inspection {
  id: string;
  contract_id: string;
  inspector_id: string;
  date: string;
  type: string;
  status: string;
  findings: string[];
}

export interface NCR {
  id: string;
  inspection_id: string;
  description: string;
  severity: "MINOR" | "MAJOR" | "CRITICAL";
  status: "OPEN" | "CLOSED";
  date: string;
}

export interface Invoice {
  id: string;
  contract_id: string;
  amount: number;
  date: string;
  status: "PENDING" | "PAID" | "OVERDUE";
}