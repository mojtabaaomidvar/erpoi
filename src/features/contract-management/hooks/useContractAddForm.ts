// src/features/contract-management/hooks/useContractAddForm.ts

import { useState, useEffect } from "react";
import { showToast } from "@shared/ui/ToastContainer";
import type {
  DocType,
  FormDataState,
  ContractFormData,
  WorkOrderFormData,
} from "../ui/contract-add-form/types";
import { STEPS } from "../ui/contract-add-form/constants";

interface UseContractAddFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any, isDraft: boolean) => Promise<void>;
  typeFilter?: "CONTRACT" | "WORK_ORDER" | "ALL";
  contracts: any[];
  generateContractNo: (type: DocType, contracts: any[]) => string;
  onNavigateToClients: () => void;
  isAdmin?: boolean;
  clients?: any[];
  initialData?: any;
  onDeleteDraft?: () => void;
}

export function useContractAddForm({
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
}: UseContractAddFormProps) {
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
          is_lump_sum: false,
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
      is_lump_sum: t.is_lump_sum || t.is_lump_sum || false,
      consumed_quantity: t.consumed_quantity,
      total_quantity: t.total_quantity,
      invoiced: t.invoiced,
    }));
  };

  const [formData, setFormData] = useState<FormDataState>({
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
                is_lump_sum: false,
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

    WORK_ORDER:
      initialData?.type === "WORK_ORDER"
        ? {
            contract_no:
              initialData.contract_no ||
              generateContractNo("WORK_ORDER", contracts),
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
          }
        : {
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
                is_lump_sum: false,
              },
            ],
            attachments: [],
            description: "",
          },
  });

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (initialData && isOpen) {
      console.log("[useContractAddForm] Loading initial data:", initialData);

      const newDocType = initialData.type || "CONTRACT";
      setDocType(newDocType);
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
      console.log("[useContractAddForm] Resetting form for new contract");
      setCurrentStep(1);
      setErrors({});

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
              is_lump_sum: false,
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
              is_lump_sum: false,
            },
          ],
          attachments: [],
          description: "",
        },
      });
    }
  }, [initialData, isOpen]);

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
          is_lump_sum: false,
        },
        {
          id: "2",
          description: "Junior Inspector",
          unit: "MAN_DAY",
          rate: "3000000",
          currency: "IRR",
          total: 0,
          is_lump_sum: false,
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
          is_lump_sum: false,
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

  return {
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
    onNavigateToClients,
    clients,
    onDeleteDraft,
    isAdmin,
  };
}
