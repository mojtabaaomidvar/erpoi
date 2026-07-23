// src/features/contract-management/ui/ContractEditForm.tsx

import { Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Contract } from "../domain";
import { ProgressBar } from "./contract-add-form/components/ProgressBar";
import { FormFooter } from "./contract-add-form/components/FormFooter";
import { Step1BasicInfo } from "./contract-add-form/steps/Step1BasicInfo";
import { Step2Financials } from "./contract-add-form/steps/Step2Financials";
import { Step3LegalTerms } from "./contract-add-form/steps/Step3LegalTerms";
import { Step4Attachments } from "./contract-add-form/steps/Step4Attachments";
import { Step5Preview } from "./contract-add-form/steps/Step5Preview";
import { useContractEditForm } from "../hooks/useContractEditForm";
import { STEPS } from "./contract-add-form/constants";

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

  const {
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
  } = useContractEditForm(
    contract,
    onSave,
    onClose,
    onNavigateToClients,
    clients,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${docType === "CONTRACT" ? "Contract" : "Work Order"}`}
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        {/* Header / Progress */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <ProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={STEPS[docType]}
          />
        </div>

        {/* Scrollable Content */}
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

        {/* Footer Actions */}
        <div className="flex-shrink-0 sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
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
