// src/features/contract-management/ui/ContractEditForm.tsx

import { useState } from "react";
import { Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { showToast } from "@shared/ui/ToastContainer";
import type { Contract } from "@/types/contract";
import { STEPS } from "./contract-add-form/constants";
import { ProgressBar } from "./contract-add-form/components/ProgressBar";
import { FormFooter } from "./contract-add-form/components/FormFooter";
import { Step1BasicInfo } from "./contract-add-form/steps/Step1BasicInfo";
import { Step2Financials } from "./contract-add-form/steps/Step2Financials";
import { Step3LegalTerms } from "./contract-add-form/steps/Step3LegalTerms";
import { Step4Attachments } from "./contract-add-form/steps/Step4Attachments";
import { Step5Preview } from "./contract-add-form/steps/Step5Preview";
import { FormDataState, DocType } from "./contract-add-form/types";

interface ContractEditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
  contract: Contract;
  onNavigateToClients: () => void;
  clients?: any[];
}

export function ContractEditForm({
  isOpen,
  onClose,
  onSave,
  contract,
  onNavigateToClients,
  clients = [],
}: ContractEditFormProps) {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // تعیین نوع سند بر اساس قرارداد فعلی
  const docType: DocType =
    contract.type === "WORK_ORDER" ? "WORK_ORDER" : "CONTRACT";
  const totalSteps = STEPS[docType].length;

  // 🔧 مقداردهی اولیه ایمن برای جلوگیری از خطاهای تایپ
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
        isLumpSum: t.is_lump_sum || false,
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
        isLumpSum: t.is_lump_sum || false,
      })),
      attachments: (contract as any).attachments || [],
      description: contract.description || "",
    },
  });

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
      showToast("error", "Submit Failed", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${docType === "CONTRACT" ? "Contract" : "Work Order"}`}
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={STEPS[docType]}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {currentStep === 1 && (
            <Step1BasicInfo
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              onTypeChange={() => {}}
              isAdmin={false}
              isEditMode={true}
            />
          )}
          {currentStep === 2 && (
            <Step2Financials
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              isAdmin={false}
              isEditMode={true}
            />
          )}
          {currentStep === 3 && docType === "CONTRACT" && (
            <Step3LegalTerms
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              isAdmin={false}
            />
          )}
          {currentStep === 4 && docType === "CONTRACT" && (
            <Step4Attachments
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              isAdmin={false}
            />
          )}
          {currentStep === totalSteps && (
            <Step5Preview
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              onFillDummyData={() => {}}
              isAdmin={false}
              clients={clients}
            />
          )}
        </div>

        <div className="flex-shrink-0 sticky bottom-0 z-10">
          <FormFooter
            currentStep={currentStep}
            totalSteps={totalSteps}
            isSaving={isSaving}
            onPrev={handlePrev}
            onNext={handleNext}
            onSaveDraft={() => {}}
            onSubmit={handleSubmit}
            onDelete={() => {}}
            isDraft={false}
            isEditMode={true}
          />
        </div>
      </div>
    </Modal>
  );
}
