// src/features/contract-management/ui/contract-add-form/ContractAddForm.tsx

import { Modal } from "@design-system";
import type { ContractAddFormProps } from "./types";
import { ProgressBar } from "./components/ProgressBar";
import { FormFooter } from "./components/FormFooter";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2Financials } from "./steps/Step2Financials";
import { Step3LegalTerms } from "./steps/Step3LegalTerms";
import { Step4Attachments } from "./steps/Step4Attachments";
import { Step5Preview } from "./steps/Step5Preview";
import { useContractAddForm } from "../../hooks/useContractAddForm";
import { STEPS } from "./constants";

export function ContractAddForm({
  isOpen,
  onClose,
  onSave,
  typeFilter,
  contracts,
  generateContractNo,
  onNavigateToClients,
  isAdmin = false,
  clients = [],
  initialData,
  onDeleteDraft,
}: ContractAddFormProps) {
  // ✅ تمام منطق و State در هوک مدیریت می‌شود
  const {
    docType,
    setDocType,
    totalSteps,
    currentStep,
    formData,
    errors,
    setErrors,
    isSaving,
    updateCurrentFormData,
    handleNext,
    handlePrev,
    handleSaveDraft,
    handleSubmit,
    fillDummyData,
    onDeleteDraft: onDeleteDraftFromHook,
  } = useContractAddForm({
    isOpen,
    onClose,
    onSave, // ✅ پاس دادن مستقیم onSave از Props
    typeFilter,
    contracts,
    generateContractNo,
    onNavigateToClients,
    isAdmin,
    clients,
    initialData,
    onDeleteDraft,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add New ${docType === "CONTRACT" ? "Contract" : "Work Order"} ${isAdmin ? "(Admin Mode)" : ""}`}
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
              onTypeChange={(newType) => {
                setDocType(newType);
              }}
              isAdmin={isAdmin}
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
              isAdmin={isAdmin}
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
              isAdmin={isAdmin}
            />
          )}

          {currentStep === 3 && docType === "WORK_ORDER" && (
            <Step5Preview
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              onFillDummyData={fillDummyData}
              isAdmin={isAdmin}
              clients={clients}
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
              isAdmin={isAdmin}
            />
          )}

          {currentStep === 5 && docType === "CONTRACT" && (
            <Step5Preview
              docType={docType}
              formData={formData}
              updateCurrentFormData={updateCurrentFormData}
              errors={errors}
              setErrors={setErrors}
              onNavigateToClients={onNavigateToClients}
              onFillDummyData={fillDummyData}
              isAdmin={isAdmin}
              clients={clients}
            />
          )}
        </div>

        <div className="flex-shrink-0 sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <FormFooter
            currentStep={currentStep}
            totalSteps={totalSteps}
            isSaving={isSaving}
            onPrev={handlePrev}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            onDelete={onDeleteDraftFromHook}
            isDraft={!!initialData}
          />
        </div>
      </div>
    </Modal>
  );
}
