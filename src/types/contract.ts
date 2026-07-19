// src/types/contract.ts
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

  valid_from?: string;
  valid_to?: string;
  is_archived?: boolean;
  parent_tariff_id?: string;
  version?: number;

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
    | "DRAFT"
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
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════
// 🔄 Contract Amendment
// ═══════════════════════════════════════
export type AmendmentType =
  | "DATE_EXTENSION"
  | "VALUE_INCREASE"
  | "TARIFF_ADJUSTMENT";

export type TariffAdjustmentMode = "PERCENTAGE" | "MANUAL";

export interface TariffAdjustment {
  id: string;
  amendment_id: string;
  tariff_line_id: string;
  adjustment_mode: TariffAdjustmentMode;
  adjustment_percentage?: number;
  previous_rate: number;
  new_rate: number;
  created_at?: string;
  updated_at?: string;
}

// ═══════════════════════════════════════
// 🔄 Contract Amendment Approval
// ═══════════════════════════════════════
export type AmendmentApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

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
