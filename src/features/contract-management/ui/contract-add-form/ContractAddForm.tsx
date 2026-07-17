// src/features/contract-management/ui/contract-add-form/ContractAddForm.tsx

import { useState, useEffect } from "react";
import { Modal } from "@design-system";
import { showToast } from "@shared/ui/ToastContainer";
import type {
  DocType,
  FormDataState,
  ContractFormData,
  WorkOrderFormData,
  ContractAddFormProps,
} from "./types";
import { STEPS } from "./constants";
import { ProgressBar } from "./components/ProgressBar";
import { FormFooter } from "./components/FormFooter";
import { Step1BasicInfo } from "./steps/Step1BasicInfo";
import { Step2Financials } from "./steps/Step2Financials";
import { Step3LegalTerms } from "./steps/Step3LegalTerms";
import { Step4Attachments } from "./steps/Step4Attachments";
import { Step5Preview } from "./steps/Step5Preview";

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
  // ═══════════════════════════════════════
  // 🎯 State Management
  // ═══════════════════════════════════════

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const initialDocType: DocType =
    initialData?.type ||
    (typeFilter === "WORK_ORDER" ? "WORK_ORDER" : "CONTRACT");
  const [docType, setDocType] = useState<DocType>(initialDocType);

  const formatInitialTariffs = (tariffs: any[] | undefined) => {
    if (!tariffs || tariffs.length === 0) {
      return [
        {
          id: "1",
          description: "",
          unit: "MAN_DAY",
          rate: "",
          currency: "IRR",
          total: 0,
          isLumpSum: false,
        },
      ];
    }

    return tariffs.map((t, index) => ({
      id: t.id || `t${index + 1}`,
      description: t.description || "",
      unit: t.unit || "MAN_DAY",
      rate: typeof t.rate === "number" ? String(t.rate) : t.rate || "",
      currency: t.currency || "IRR",
      total: t.total || 0,
      isLumpSum: t.isLumpSum || t.is_lump_sum || false,
      // حفظ سایر فیلدها
      consumed_quantity: t.consumed_quantity,
      total_quantity: t.total_quantity,
      invoiced: t.invoiced,
    }));
  };

  const [formData, setFormData] = useState<FormDataState>({
    // ═══════════════════════════════════════
    // 🔧 FIX: نگاشت ایمن داده‌های CONTRACT
    // ═══════════════════════════════════════
    CONTRACT:
      initialData?.type === "CONTRACT"
        ? {
            contract_no:
              initialData.contract_no ||
              generateContractNo("CONTRACT", contracts),
            external_contract_no: initialData.external_contract_no || "",
            client_id: initialData.client_id || "",
            contract_title: initialData.contract_title || "",
            service_description: Array.isArray(initialData.service_description)
              ? initialData.service_description
              : [],
            start_date: initialData.start_date || "",
            end_date: initialData.end_date || "",
            total_value: initialData.total_value || 0,
            currency: initialData.currency || "IRR",
            contract_count: initialData.contract_count || 1,
            tariffs: formatInitialTariffs(initialData.tariffLines),

            // نگاشت صحیح adjustment از financial_terms
            adjustment: {
              enabled:
                initialData.financial_terms?.adjustment?.enabled ?? false,
              mode:
                (initialData.financial_terms?.adjustment?.mode as
                  | "FIXED"
                  | "TBD") || "FIXED",
              percentage:
                initialData.financial_terms?.adjustment?.percentage || 0,
              effective_date:
                initialData.financial_terms?.adjustment?.effective_date || "",
            },

            contract_modification: { percentage: 0 },
            guarantee: {
              has_guarantee: false,
              percentage: 0,
              type: "BANK_GUARANTEE",
            },
            good_performance_percentage: 10,
            insurance_deduction_percentage: 16.67,
            attachments: Array.isArray(initialData.attachments)
              ? initialData.attachments
              : [],
            description: initialData.description || "",
          }
        : {
            // مقادیر پیش‌فرض CONTRACT (بدون تغییر)
            contract_no: generateContractNo("CONTRACT", contracts),
            external_contract_no: "",
            client_id: "",
            contract_title: "",
            service_description: [],
            start_date: "",
            end_date: "",
            total_value: 0,
            currency: "IRR",
            contract_count: 1,
            tariffs: [
              {
                id: "1",
                description: "",
                unit: "MAN_DAY",
                rate: "",
                currency: "IRR",
                total: 0,
                isLumpSum: false,
              },
            ],
            adjustment: {
              enabled: false,
              mode: "FIXED",
              percentage: 0,
              effective_date: "",
            },
            contract_modification: { percentage: 0 },
            guarantee: {
              has_guarantee: false,
              percentage: 0,
              type: "BANK_GUARANTEE",
            },
            good_performance_percentage: 10,
            insurance_deduction_percentage: 16.67,
            attachments: [],
            description: "",
          },

    // ═══════════════════════════════════════
    // 🔧 FIX: نگاشت ایمن داده‌های WORK_ORDER
    // ═══════════════════════════════════════
    WORK_ORDER:
      initialData?.type === "WORK_ORDER"
        ? {
            contract_no:
              initialData.contract_no ||
              generateContractNo("WORK_ORDER", contracts),
            external_contract_no: initialData.external_contract_no || "",
            client_id: initialData.client_id || "",
            contract_title: initialData.contract_title || "",
            // 🔧 FIX: تضمین اینکه آرایه است
            service_description: Array.isArray(initialData.service_description)
              ? initialData.service_description
              : [],
            // 🔧 FIX: تضمین Union Type
            source_type:
              (initialData.source_type as "EMAIL" | "LETTER") || "LETTER",
            source_ref: initialData.source_ref || "",
            source_letter_date: initialData.source_letter_date || "",
            source_letter_image: initialData.source_letter_image || "",
            source_letter_image_object: null,
            source_letter_image_preview:
              initialData.source_letter_image_preview || "",
            source_email_from: initialData.source_email_from || "",
            source_email_date:
              initialData.source_email_date ||
              new Date().toISOString().split("T")[0],
            source_email_file: "",
            source_email_file_object: null,
            email_input_method: "MANUAL", // یا مقدار اولیه از دیتابیس اگر ذخیره می‌شود
            tariffs: formatInitialTariffs(initialData.tariffLines),
            attachments: Array.isArray(initialData.attachments)
              ? initialData.attachments
              : [],
            description: initialData.description || "",
          }
        : {
            // مقادیر پیش‌فرض WORK_ORDER (بدون تغییر)
            contract_no: generateContractNo("WORK_ORDER", contracts),
            external_contract_no: "",
            client_id: "",
            contract_title: "",
            service_description: [],
            source_type: "LETTER",
            source_ref: "",
            source_letter_date: "",
            source_letter_image: "",
            source_letter_image_object: null,
            source_letter_image_preview: "",
            source_email_from: "",
            source_email_date: new Date().toISOString().split("T")[0],
            source_email_file: "",
            source_email_file_object: null,
            email_input_method: "MANUAL",
            tariffs: [
              {
                id: "1",
                description: "",
                unit: "MAN_DAY",
                rate: "",
                currency: "IRR",
                total: 0,
                isLumpSum: false,
              },
            ],
            attachments: [],
            description: "",
          },
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (initialData && isOpen) {
      console.log("[ContractAddForm] Loading initial data:", initialData);

      const newDocType = initialData.type || "CONTRACT";
      setDocType(newDocType);

      // 🔧 FIX: ریست مرحله به 1 هنگام باز کردن Draft
      setCurrentStep(1);
      setErrors({});

      if (newDocType === "CONTRACT") {
        setFormData((prev) => ({
          ...prev,
          CONTRACT: {
            contract_no: initialData.contract_no || prev.CONTRACT.contract_no,
            external_contract_no: initialData.external_contract_no || "",
            client_id: initialData.client_id || "",
            contract_title: initialData.contract_title || "",
            service_description: Array.isArray(initialData.service_description)
              ? initialData.service_description
              : [],
            start_date: initialData.start_date || "",
            end_date: initialData.end_date || "",
            total_value: initialData.total_value || 0,
            currency: initialData.currency || "IRR",
            contract_count: initialData.contract_count || 1,
            tariffs: formatInitialTariffs(initialData.tariffLines),
            adjustment: {
              enabled:
                initialData.financial_terms?.adjustment?.enabled ?? false,
              mode:
                (initialData.financial_terms?.adjustment?.mode as
                  | "FIXED"
                  | "TBD") || "FIXED",
              percentage:
                initialData.financial_terms?.adjustment?.percentage || 0,
              effective_date:
                initialData.financial_terms?.adjustment?.effective_date || "",
            },
            contract_modification: { percentage: 0 },
            guarantee: {
              has_guarantee: false,
              percentage: 0,
              type: "BANK_GUARANTEE",
            },
            good_performance_percentage: 10,
            insurance_deduction_percentage: 16.67,
            attachments: Array.isArray(initialData.attachments)
              ? initialData.attachments
              : [],
            description: initialData.description || "",
          },
        }));
      } else if (newDocType === "WORK_ORDER") {
        setFormData((prev) => ({
          ...prev,
          WORK_ORDER: {
            contract_no: initialData.contract_no || prev.WORK_ORDER.contract_no,
            external_contract_no: initialData.external_contract_no || "",
            client_id: initialData.client_id || "",
            contract_title: initialData.contract_title || "",
            service_description: Array.isArray(initialData.service_description)
              ? initialData.service_description
              : [],
            source_type:
              (initialData.source_type as "EMAIL" | "LETTER") || "LETTER",
            source_ref: initialData.source_ref || "",
            source_letter_date: initialData.source_letter_date || "",
            source_letter_image: initialData.source_letter_image || "",
            source_letter_image_object: null,
            source_letter_image_preview:
              initialData.source_letter_image_preview || "",
            source_email_from: initialData.source_email_from || "",
            source_email_date:
              initialData.source_email_date ||
              new Date().toISOString().split("T")[0],
            source_email_file: "",
            source_email_file_object: null,
            email_input_method: "MANUAL",
            tariffs: formatInitialTariffs(initialData.tariffLines),
            attachments: Array.isArray(initialData.attachments)
              ? initialData.attachments
              : [],
            description: initialData.description || "",
          },
        }));
      }
    } else if (!initialData && isOpen) {
      // 🔧 FIX: ریست کامل فرم برای قرارداد جدید
      console.log("[ContractAddForm] Resetting form for new contract");

      setCurrentStep(1); // 🔧 NEW: ریست مرحله به 1
      setErrors({}); // 🔧 NEW: پاک کردن خطاها

      setFormData({
        CONTRACT: {
          contract_no: generateContractNo("CONTRACT", contracts),
          external_contract_no: "",
          client_id: "",
          contract_title: "",
          service_description: [],
          start_date: "",
          end_date: "",
          total_value: 0,
          currency: "IRR",
          contract_count: 1,
          tariffs: [
            {
              id: "1",
              description: "",
              unit: "MAN_DAY",
              rate: "",
              currency: "IRR",
              total: 0,
              isLumpSum: false,
            },
          ],
          adjustment: {
            enabled: false,
            mode: "FIXED",
            percentage: 0,
            effective_date: "",
          },
          contract_modification: { percentage: 0 },
          guarantee: {
            has_guarantee: false,
            percentage: 0,
            type: "BANK_GUARANTEE",
          },
          good_performance_percentage: 10,
          insurance_deduction_percentage: 16.67,
          attachments: [],
          description: "",
        },
        WORK_ORDER: {
          contract_no: generateContractNo("WORK_ORDER", contracts),
          external_contract_no: "",
          client_id: "",
          contract_title: "",
          service_description: [],
          source_type: "LETTER",
          source_ref: "",
          source_letter_date: "",
          source_letter_image: "",
          source_letter_image_object: null,
          source_letter_image_preview: "",
          source_email_from: "",
          source_email_date: new Date().toISOString().split("T")[0],
          source_email_file: "",
          source_email_file_object: null,
          email_input_method: "MANUAL",
          tariffs: [
            {
              id: "1",
              description: "",
              unit: "MAN_DAY",
              rate: "",
              currency: "IRR",
              total: 0,
              isLumpSum: false,
            },
          ],
          attachments: [],
          description: "",
        },
      });
    }
  }, [initialData, isOpen]);

  // ═══════════════════════════════════════
  // 🔧 Helper Functions
  // ═══════════════════════════════════════

  const totalSteps = STEPS[docType].length;

  const fillDummyData = () => {
    const dummyContract: ContractFormData = {
      contract_no: generateContractNo("CONTRACT", contracts),
      external_contract_no: "EXT-998877",
      client_id: "client_test_001",
      contract_title: "Third Party Inspection for South Pars Phase 11",
      service_description: ["TPI", "MWS"],
      start_date: "1403/05/01",
      end_date: "1404/05/01",
      total_value: 5000000000,
      currency: "IRR",
      contract_count: 1,
      tariffs: [
        {
          id: "1",
          description: "Senior Inspector",
          unit: "MAN_DAY",
          rate: "5000000",
          currency: "IRR",
          total: 0,
          isLumpSum: false,
        },
        {
          id: "2",
          description: "Junior Inspector",
          unit: "MAN_DAY",
          rate: "3000000",
          currency: "IRR",
          total: 0,
          isLumpSum: false,
        },
      ],
      adjustment: {
        enabled: true,
        mode: "FIXED",
        percentage: 15,
        effective_date: "1404/01/01",
      },
      contract_modification: { percentage: 10 },
      guarantee: {
        has_guarantee: true,
        percentage: 10,
        type: "BANK_GUARANTEE",
      },
      good_performance_percentage: 10,
      insurance_deduction_percentage: 16.67,
      attachments: [
        {
          id: "1",
          name: "sample_contract.pdf",
          size: 1024000,
          type: "application/pdf",
        },
      ],
      description:
        "This is a dummy contract generated for testing purposes by Admin.",
    };

    const dummyWO: WorkOrderFormData = {
      contract_no: generateContractNo("WORK_ORDER", contracts),
      external_contract_no: "WO-112233",
      client_id: "client_test_002",
      contract_title: "Urgent Marine Warranty Survey",
      service_description: ["MWS"],
      source_type: "EMAIL",
      source_ref: "",
      source_letter_date: "",
      source_letter_image: "",
      source_letter_image_object: null,
      source_letter_image_preview: "",
      source_email_from: "project.manager@client.com",
      source_email_date: "1403/06/15",
      source_email_file: "request_email.msg",
      source_email_file_object: null,
      email_input_method: "UPLOAD",
      tariffs: [
        {
          id: "1",
          description: "MWS Surveyor",
          unit: "MAN_DAY",
          rate: "8000000",
          currency: "IRR",
          total: 0,
          isLumpSum: false,
        },
      ],
      attachments: [
        {
          id: "1",
          name: "email_request.msg",
          size: 512000,
          type: "application/vnd.ms-outlook",
        },
      ],
      description: "Dummy work order for admin testing.",
    };

    setFormData((prev) => ({
      ...prev,
      CONTRACT: dummyContract,
      WORK_ORDER: dummyWO,
    }));
    showToast("success", "Dummy Data", "Test data has been populated!");
  };

  const updateCurrentFormData = (
    updates: Partial<ContractFormData> | Partial<WorkOrderFormData>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        ...updates,
      },
    }));
  };

  // ═══════════════════════════════════════
  // 🔍 Validation Functions
  // ═══════════════════════════════════════

  const validateStep1 = (): boolean => {
    if (isAdmin) return true;
    const newErrors: any = {};
    const data = formData[docType];

    if (!data.client_id) {
      newErrors.client_id = "Client selection is required";
    }
    if (!data.contract_title.trim()) {
      newErrors.contract_title =
        docType === "CONTRACT"
          ? "Contract title is required"
          : "Work order title is required";
    }
    if (data.service_description.length === 0) {
      newErrors.service_description =
        "At least one service type must be selected";
    }

    if (docType === "WORK_ORDER") {
      const woData = data as WorkOrderFormData;
      if (woData.source_type === "LETTER") {
        if (!woData.source_ref.trim())
          newErrors.source_ref = "Letter number is required";
        if (!woData.source_letter_date)
          newErrors.source_letter_date = "Letter date is required";
        if (!woData.source_letter_image)
          newErrors.source_letter_image = "Letter image is required";
      } else if (woData.source_type === "EMAIL") {
        if (woData.email_input_method === "MANUAL") {
          if (!woData.source_email_from.trim())
            newErrors.source_email_from = "Email address is required";
        } else if (woData.email_input_method === "UPLOAD") {
          if (!woData.source_email_file)
            newErrors.source_email_file = "Email file is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (isAdmin) return true;
    const newErrors: any = {};
    const data = formData[docType];

    if (docType === "CONTRACT") {
      const cData = data as ContractFormData;
      if (!cData.start_date) newErrors.start_date = "Start date is required";
      if (!cData.end_date) newErrors.end_date = "End date is required";
      if (
        cData.start_date &&
        cData.end_date &&
        cData.end_date < cData.start_date
      ) {
        newErrors.end_date = "End date cannot be before start date";
      }
      if (cData.total_value <= 0)
        newErrors.total_value = "Amount must be greater than zero";
    }

    if (!data.tariffs || data.tariffs.length === 0) {
      newErrors.tariffs = "At least one tariff line is required";
    } else {
      const emptyTariff = data.tariffs.find(
        (t) =>
          !t.description.trim() ||
          !t.rate ||
          Number(String(t.rate).replace(/,/g, "")) <= 0,
      );
      if (emptyTariff)
        newErrors.tariffs = "All tariff lines must have description and rate";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ═══════════════════════════════════════
  // 🧭 Navigation Functions
  // ═══════════════════════════════════════

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else {
      isValid = true;
    }

    if (isValid && currentStep < totalSteps) {
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

  // ═══════════════════════════════════════
  // 💾 Save Functions
  // ═══════════════════════════════════════

  const handleSaveDraft = async () => {
    const currentData = formData[docType];
    const newErrors: any = {};

    if (!currentData.client_id) {
      newErrors.client_id = "Client selection is required";
    }
    if (!currentData.contract_title || !currentData.contract_title.trim()) {
      newErrors.contract_title =
        docType === "CONTRACT"
          ? "Contract title is required"
          : "Work order title is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        "error",
        "Cannot Save Draft",
        "Please fill in at least the Client and Title fields",
      );
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      await onSave({ ...currentData, type: docType, status: "DRAFT" }, true);
      onClose();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      await onSave(
        {
          ...formData[docType],
          type: docType,
          status: "PENDING_TECHNICAL_APPROVAL",
        },
        false,
      );
      onClose();
    } catch (err: any) {
      showToast("error", "Submit Failed", err.message || "Failed to submit");
    } finally {
      setIsSaving(false);
    }
  };

  // ═══════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════
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
          {/* مرحله 1: Basic Info (هر دو نوع) */}
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
                setCurrentStep(1);
                setErrors({});
              }}
              isAdmin={isAdmin}
            />
          )}

          {/* مرحله 2: Financials (هر دو نوع) */}
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

          {/* 🔧 مرحله 3: بر اساس docType */}
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

          {/* 🔧 مرحله 4: فقط CONTRACT */}
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

          {/* 🔧 مرحله 5: فقط CONTRACT */}
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

        <div className="flex-shrink-0 sticky bottom-0 z-10">
          <FormFooter
            currentStep={currentStep}
            totalSteps={totalSteps}
            isSaving={isSaving}
            onPrev={handlePrev}
            onNext={handleNext}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmit}
            onDelete={onDeleteDraft}
            isDraft={!!initialData}
          />
        </div>
      </div>
    </Modal>
  );
}
