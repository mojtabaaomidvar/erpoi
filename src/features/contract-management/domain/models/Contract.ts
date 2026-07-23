//src/features/contract-management/domain/models/Contract.ts

export type ContractType = "CONTRACT" | "WORK_ORDER";
export type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "COMPLETED"
  | "TERMINATED"
  | "PENDING"
  | "NOT_STARTED"
  | "NEEDS_REVIEW";

export type AmendmentType =
  | "DATE_EXTENSION"
  | "VALUE_INCREASE"
  | "TARIFF_ADJUSTMENT";
export type TariffAdjustmentMode = "PERCENTAGE" | "MANUAL";
export type AmendmentApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Contract {
  id: string;
  client_id: string;
  client_name?: string;
  contract_no: string;
  external_contract_no?: string;
  contract_title: string;
  description?: string;
  service_description?: string;
  type: ContractType;
  status: ContractStatus;
  total_value: number;
  invoiced: number;
  currency: string;
  start_date: string;
  end_date: string;
  tariffs: number;
  tariffLines?: any[];
  guarantees?: any[];
  contract_count?: number;
  department?: string;
  source_type?: "EMAIL" | "LETTER";
  source_ref?: string;
  source_file?: string;
  source_letter_date?: string;
  source_letter_image?: string;
  source_letter_image_preview?: string;
  source_email_from?: string;
  source_email_date?: string;
  financial_terms?: any;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TariffAdjustment {
  id: string;
  amendment_id: string;
  tariff_line_id: string;
  adjustment_mode: TariffAdjustmentMode;
  adjustment_percentage?: number;
  previous_rate: number;
  new_rate: number;
}

export interface ContractAmendment {
  id: string;
  contract_id: string;
  amendment_no?: string;
  amendment_types: AmendmentType[];
  effective_date: string;
  previous_end_date?: string;
  new_end_date?: string;
  previous_value?: number;
  new_value?: number;
  description?: string;
  attachment_urls?: string[];
  attachment_names?: string[];
  approval_status: AmendmentApprovalStatus;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
  tariff_adjustments?: TariffAdjustment[];
}

export interface CreateAmendmentData {
  contract_id: string;
  amendment_no?: string;
  amendment_types: AmendmentType[];
  effective_date: string;
  previous_end_date?: string;
  new_end_date?: string;
  previous_value?: number;
  new_value?: number;
  description?: string;
  attachment_urls?: string[];
  attachment_names?: string[];
  created_by?: string;
  tariff_adjustments?: Array<{
    tariff_line_id: string;
    adjustment_mode: "PERCENTAGE" | "MANUAL";
    adjustment_percentage?: number;
    previous_rate: number;
    new_rate: number;
  }>;
}
