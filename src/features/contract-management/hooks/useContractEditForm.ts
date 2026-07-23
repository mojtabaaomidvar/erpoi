// src/features/contract-management/hooks/useContractEditForm.ts

import { useState, useMemo } from "react";
import type { Contract } from "../domain";
import { STEPS } from "../ui/contract-add-form/constants";
import type { FormDataState, DocType } from "../ui/contract-add-form/types";

export function useContractEditForm(
  contract: Contract,
  onSave: (formData: any) => Promise<void>,
  onClose: () => void,
  onNavigateToClients: () => void,
  clients: any[],
) {
  const docType: DocType =
    contract.type === "WORK_ORDER" ? "WORK_ORDER" : "CONTRACT";
  const totalSteps = STEPS[docType].length;

  // 🔧 مقداردهی اولیه ایمن برای جلوگیری از خطاهای تایپ و Undefined
  const initialAdjustment = contract.financial_terms?.adjustment || {};
  const initialGuarantee =
    contract.guarantees && contract.guarantees.length > 0
      ? contract.guarantees[0]
      : { has_guarantee: false, percentage: 0, type: "BANK_GUARANTEE" };

  const [formData, setFormData] = useState<FormDataState>({
    CONTRACT: {
      contract_no: contract.contract_no,
      external_contract_no: contract.external_contract_no || "",
      client_id: contract.client_id,
      contract_title: contract.contract_title,
      service_description: Array.isArray(contract.service_description)
        ? contract.service_description
        : [],
      start_date: contract.start_date,
      end_date: contract.end_date,
      total_value: contract.total_value,
      currency: contract.currency,
      contract_count: contract.contract_count || 1,
      tariffs: (contract.tariffLines || []).map((t: any) => ({
        ...t,
        rate: String(t.rate),
        is_lump_sum: t.is_lump_sum || false,
      })),
      adjustment: {
        enabled: initialAdjustment.enabled ?? false,
        mode: initialAdjustment.mode ?? "FIXED",
        percentage: initialAdjustment.percentage ?? 0,
        effective_date: initialAdjustment.effective_date ?? "",
      },
      contract_modification: { percentage: 0 },
      guarantee: {
        has_guarantee: initialGuarantee.has_guarantee ?? false,
        percentage: initialGuarantee.percentage ?? 0,
        type:
          (initialGuarantee.type as
            | "BANK_GUARANTEE"
            | "CHECK"
            | "PROMISSORY_NOTE"
            | "CASH_BLOCK") ?? "BANK_GUARANTEE",
      },
      good_performance_percentage: 10,
      insurance_deduction_percentage: 16.67,
      attachments: (contract as any).attachments || [],
      description: contract.description || "",
    },
    WORK_ORDER: {
      contract_no: contract.contract_no,
      external_contract_no: contract.external_contract_no || "",
      client_id: contract.client_id,
      contract_title: contract.contract_title,
      service_description: Array.isArray(contract.service_description)
        ? contract.service_description
        : [],
      source_type: (contract.source_type as "EMAIL" | "LETTER") || "LETTER",
      source_ref: contract.source_ref || "",
      source_letter_date: contract.source_letter_date || "",
      source_letter_image: contract.source_letter_image || "",
      source_letter_image_object: null,
      source_letter_image_preview: "",
      source_email_from: contract.source_email_from || "",
      source_email_date:
        contract.source_email_date || new Date().toISOString().split("T")[0],
      source_email_file: "",
      source_email_file_object: null,
      email_input_method: "MANUAL",
      tariffs: (contract.tariffLines || []).map((t: any) => ({
        ...t,
        rate: String(t.rate),
        is_lump_sum: t.is_lump_sum || false,
      })),
      attachments: (contract as any).attachments || [],
      description: contract.description || "",
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const updateCurrentFormData = (updates: any) => {
    setFormData((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], ...updates },
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      setErrors({});
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave({ ...formData[docType], id: contract.id });
      onClose();
    } catch (err: any) {
      console.error("[useContractEditForm] Submit failed:", err);
      // خطا در اینجا توسط والد (onSave) هندل و showToast می‌شود، اما اگر نیاز بود اینجا هم هندل شود
    } finally {
      setIsSaving(false);
    }
  };

  return {
    docType,
    totalSteps,
    currentStep,
    formData,
    errors,
    setErrors,
    isSaving,
    updateCurrentFormData,
    handleNext,
    handlePrev,
    handleSubmit,
    onNavigateToClients,
    clients,
  };
}
