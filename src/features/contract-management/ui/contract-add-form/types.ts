// src/features/contract-management/ui/contract-add-form/types.ts

import type { TariffLine } from "@/features/contract-management/domain";
import type { Contract } from "@/features/contract-management/domain";

// ═══════════════════════════════════════
// 🏷️ Document Type
// ═══════════════════════════════════════

export type DocType = "CONTRACT" | "WORK_ORDER";

// ═══════════════════════════════════════
// 📋 Base Form Data (مشترک بین Contract و Work Order)
// ═══════════════════════════════════════

export interface BaseFormData {
  contract_no: string;
  external_contract_no: string;
  client_id: string;
  contract_title: string;
  service_description: string[];
  tariffs: TariffLine[];
  attachments: any[];
  description: string;
}

// ═══════════════════════════════════════
// 📄 Contract-Specific Form Data
// ═══════════════════════════════════════

export interface ContractFormData extends BaseFormData {
  // Dates & Value
  start_date: string;
  end_date: string;
  total_value: number;
  currency: string;
  contract_count: number;

  // Legal Terms
  adjustment: {
    enabled: boolean;
    mode: "FIXED" | "TBD";
    percentage: number;
    effective_date: string;
  };
  contract_modification: {
    percentage: number;
  };
  guarantee: {
    has_guarantee: boolean;
    percentage: number;
    type: "BANK_GUARANTEE" | "CHECK" | "PROMISSORY_NOTE" | "CASH_BLOCK";
  };
  good_performance_percentage: number;
  insurance_deduction_percentage: number;
}

// ═══════════════════════════════════════
// 📦 Work Order-Specific Form Data
// ═══════════════════════════════════════

export interface WorkOrderFormData extends BaseFormData {
  // Source Type
  source_type: "EMAIL" | "LETTER";

  // Letter Fields
  source_ref: string;
  source_letter_date: string;
  source_letter_image: string;
  source_letter_image_object: File | null;
  source_letter_image_preview: string;

  // Email Fields
  source_email_from: string;
  source_email_date: string;
  source_email_file: string;
  source_email_file_object: File | null;
  email_input_method: "MANUAL" | "UPLOAD" | "OUTLOOK";
}

// ═══════════════════════════════════════
// 🗂️ Form Data State (جدا برای هر نوع سند)
// ═══════════════════════════════════════

export type FormDataState = {
  CONTRACT: ContractFormData;
  WORK_ORDER: WorkOrderFormData;
};

// ═══════════════════════════════════════
// 🎯 Component Props Types
// ═══════════════════════════════════════

export interface ContractAddFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any, isDraft: boolean) => Promise<void>;
  typeFilter: "ALL" | "CONTRACT" | "WORK_ORDER";
  contracts: any[];
  generateContractNo: (type: DocType, contracts: any[]) => string;
  onNavigateToClients: () => void;
  isAdmin?: boolean;
  clients?: any[];
  initialData?: Contract;
  onDeleteDraft?: () => void;
}

export interface StepProps {
  docType: DocType;
  formData: FormDataState;
  updateCurrentFormData: (
    updates: Partial<ContractFormData> | Partial<WorkOrderFormData>,
  ) => void;
  errors: any;
  setErrors: (errors: any) => void;
  onNavigateToClients: () => void;
  onTypeChange?: (type: DocType) => void;
  onFillDummyData?: () => void;
  isAdmin?: boolean;
  isEditMode?: boolean;
  clientName?: string;
  clients?: any[];
}
