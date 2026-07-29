// src/features/project-management/ui/ProjectForm.tsx

import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { showToast } from "@shared/ui/ToastContainer";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import type { Project } from "../domain/types";
import { INSPECTION_CATEGORY_CONFIG } from "@features/inspection-management/constants";
import { CreateProjectSchema } from "../application/dto/CreateProjectCommand";
import { useProjectForm } from "../hooks/useProjectForm";
import { validateDateRange } from "@shared/lib/validators";
import { getTodayJalali, compareJalaliDates } from "@/shared/utils/dateUtils";

export type InspectionCategory = "TPI" | "MWS" | "TPER" | "Others";

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 5,
  manager: 4,
  expert: 3,
  coordinator: 3,
  inspector: 2,
  viewer: 1,
};

const getRoleWeight = (role?: string) =>
  ROLE_HIERARCHY[role?.toLowerCase() || ""] || 0;

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: Project | null;
}

export function ProjectForm({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProjectFormProps) {
  // ✅ ۱. تمام هوک‌ها باید در بالاترین سطح و قبل از هر return شرطی باشند
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isContractExpired, setIsContractExpired] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const {
    clients,
    contracts,
    users,
    availableServiceTypes,
    isLoading: isDataLoading,
    loadContracts,
    updateAvailableServiceTypes,
    clearContracts,
  } = useProjectForm();

  const allServiceTypes: InspectionCategory[] = [
    "TPI",
    "MWS",
    "TPER",
    "Others",
  ];
  const comingSoonServices: InspectionCategory[] = ["TPER", "Others"];

  const [formData, setFormData] = useState({
    name: "",
    client_id: "",
    contract_id: "",
    service_types: [] as InspectionCategory[],
    description: "",
    start_date: "",
    end_date: "",
    project_manager_id: "",
    coordinator_id: "",
  });

  useEffect(() => {
    if (formData.client_id) {
      loadContracts(formData.client_id);
    } else {
      clearContracts();
    }
  }, [formData.client_id, loadContracts, clearContracts]);

  useEffect(() => {
    if (formData.contract_id) {
      updateAvailableServiceTypes(formData.contract_id);
    }
  }, [formData.contract_id, updateAvailableServiceTypes]);

  useEffect(() => {
    if (formData.contract_id && contracts.length > 0) {
      const contract = contracts.find(
        (c: any) => c.id === formData.contract_id,
      );
      if (contract) {
        const today = getTodayJalali();
        const isExpired = compareJalaliDates(today, contract.end_date) > 0;
        setIsContractExpired(isExpired);

        setFormData((prev) => ({
          ...prev,
          start_date: prev.start_date || contract.start_date || "",
          end_date: prev.end_date || contract.end_date || "",
        }));
      }
    } else {
      setIsContractExpired(false);
    }
  }, [formData.contract_id, contracts]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name,
          client_id: initialData.client_id,
          contract_id: initialData.contract_id,
          service_types:
            (initialData.service_types as InspectionCategory[]) || [],
          description: initialData.description || "",
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          project_manager_id: "",
          coordinator_id: "",
        });
        if (initialData.client_id) {
          loadContracts(initialData.client_id);
        }
      } else {
        setFormData({
          name: "",
          client_id: "",
          contract_id: "",
          service_types: [],
          description: "",
          start_date: "",
          end_date: "",
          project_manager_id: "",
          coordinator_id: "",
        });
      }
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen, initialData, loadContracts]);

  useEffect(() => {
    if (formData.project_manager_id && formData.coordinator_id) {
      const pm = users.find((u) => u.id === formData.project_manager_id);
      const coord = users.find((u) => u.id === formData.coordinator_id);

      if (pm && coord) {
        const pmWeight = getRoleWeight(pm.role);
        const coordWeight = getRoleWeight(coord.role);

        if (coordWeight > pmWeight) {
          setErrors((prev: any) => ({
            ...prev,
            coordinator_id: `Coordinator (${coord.role}) cannot have a higher role than Project Manager (${pm.role})`,
          }));
        } else {
          setErrors((prev: any) => {
            const newErrors = { ...prev };
            delete newErrors.coordinator_id;
            return newErrors;
          });
        }
      }
    }
  }, [formData.project_manager_id, formData.coordinator_id, users]);

  // ✅ ۲. بررسی دسترسی باید بعد از تمام هوک‌ها انجام شود
  const canViewForm =
    canAccessElement("project_form_view") || canAccessElement("project_create");

  if (!canViewForm) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" size="xl">
        <div className="p-8 text-center">
          <p className="text-rose-500 font-semibold">
            You do not have permission to view or edit this project.
          </p>
        </div>
      </Modal>
    );
  }

  if (isDataLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." size="xl">
        <div className="p-8 text-center">Loading form data...</div>
      </Modal>
    );
  }

  // ... (توابع کمکی بدون تغییر)
  const isServiceTypeAvailable = (type: InspectionCategory): boolean => {
    if (comingSoonServices.includes(type)) return false;
    return availableServiceTypes.includes(type);
  };

  const handleServiceTypeToggle = (type: InspectionCategory) => {
    if (!isServiceTypeAvailable(type)) return;
    setFormData((prev) => ({
      ...prev,
      service_types: prev.service_types.includes(type)
        ? prev.service_types.filter((t) => t !== type)
        : [...prev.service_types, type],
    }));
  };

  const validateStep = () => {
    const newErrors: any = {};
    if (currentStep === 1) {
      if (!formData.client_id) newErrors.client_id = "Client is required";
      if (!formData.contract_id) newErrors.contract_id = "Contract is required";
      if (formData.service_types.length === 0)
        newErrors.service_types = "At least one service type is required";
      const invalidTypes = formData.service_types.filter(
        (type) => !availableServiceTypes.includes(type),
      );
      if (invalidTypes.length > 0)
        newErrors.service_types = "Invalid service types selected";
    } else if (currentStep === 2) {
      if (!formData.name.trim()) newErrors.name = "Project title is required";
      if (!formData.project_manager_id)
        newErrors.project_manager_id = "Project Manager is required";
      if (!formData.coordinator_id)
        newErrors.coordinator_id = "Coordinator is required";

      const selectedContract = contracts.find(
        (c: any) => c.id === formData.contract_id,
      );
      if (formData.contract_id && selectedContract) {
        if (
          formData.start_date &&
          compareJalaliDates(formData.start_date, selectedContract.start_date) <
            0
        ) {
          newErrors.start_date = `Start date cannot be before contract start (${selectedContract.start_date}).`;
        }
        if (
          formData.end_date &&
          compareJalaliDates(formData.end_date, selectedContract.end_date) > 0
        ) {
          newErrors.end_date = `End date cannot be after contract end (${selectedContract.end_date}).`;
        }
      }

      const dateValidation = validateDateRange(
        formData.start_date,
        formData.end_date,
      );
      if (!dateValidation.isValid) newErrors.end_date = dateValidation.error;
      if (errors.coordinator_id)
        newErrors.coordinator_id = errors.coordinator_id;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setCurrentStep((prev) => Math.min(prev + 1, 3));
  };
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (errors.coordinator_id) {
      showToast(
        "error",
        "Validation Error",
        "Please fix the role hierarchy issue before submitting.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...formData, created_by: user?.id || "unknown" };
      CreateProjectSchema.parse(payload);
      await onSave(payload);
    } catch (err: any) {
      if (err.name === "ZodError") {
        showToast("error", "Validation Failed", err.errors[0].message);
      } else {
        showToast("error", "Error", err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c: any) => c.id === formData.client_id);
  const selectedContract = contracts.find(
    (c: any) => c.id === formData.contract_id,
  );
  const projectManager = users.find(
    (u) => u.id === formData.project_manager_id,
  );
  const coordinator = users.find((u) => u.id === formData.coordinator_id);

  // ✅ ۳. رندر اصلی کامپوننت
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Project" : "Create New Project"}
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(90vh - 130px)" }}>
        <div className="flex-shrink-0 px-4 pt-2 pb-1">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="flex flex-col items-center flex-1 relative"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10 ${currentStep >= step ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg" : isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500"}`}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium ${currentStep >= step ? (isDark ? "text-indigo-300" : "text-indigo-600") : "text-slate-500"}`}
                >
                  {step === 1
                    ? "Contract & Services"
                    : step === 2
                      ? "Team & Dates"
                      : "Review"}
                </span>
                {step < 3 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 ${currentStep > step ? "bg-gradient-to-r from-indigo-500 to-violet-600" : isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 custom-scrollbar">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Client <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      client_id: e.target.value,
                      contract_id: "",
                      service_types: [],
                    });
                    setErrors({});
                    setIsContractExpired(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.client_id ? "border-rose-500" : ""}`}
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name_en}
                    </option>
                  ))}
                </select>
                {errors.client_id && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.client_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Contract <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.contract_id}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_id: e.target.value })
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.contract_id ? "border-rose-500" : ""}`}
                  disabled={!formData.client_id}
                >
                  <option value="">
                    {!formData.client_id
                      ? "-- Select Client First --"
                      : "-- Select Contract --"}
                  </option>
                  {contracts.map((contract: any) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contract_no} - {contract.contract_title}
                    </option>
                  ))}
                </select>
                {isContractExpired && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1 animate-pulse">
                    <span>⚠️</span> This contract has expired. It cannot be used
                    to create a new project unless renewed.
                  </p>
                )}
                {errors.contract_id && !isContractExpired && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.contract_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Service Types <span className="text-rose-500">*</span>{" "}
                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                    (Based on selected contract)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allServiceTypes.map((type) => {
                    const isAvailable = isServiceTypeAvailable(type);
                    const isSelected = formData.service_types.includes(type);
                    const isComingSoon = comingSoonServices.includes(type);
                    const config =
                      INSPECTION_CATEGORY_CONFIG[
                        type as keyof typeof INSPECTION_CATEGORY_CONFIG
                      ];
                    const isDisabled = !isAvailable || isContractExpired;
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleServiceTypeToggle(type)}
                        className={`w-full py-2.5 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${isDisabled ? "opacity-60 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-500" : isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"}`}
                      >
                        <span className="text-sm">
                          {config?.icon || (type === "TPER" ? "🔍" : "📦")}{" "}
                          {config?.label || type}
                        </span>
                        {isComingSoon && !isContractExpired && (
                          <span className="text-[9px] opacity-80">
                            Coming Soon
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.service_types && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.service_types}
                  </p>
                )}
                {availableServiceTypes.length === 0 && formData.contract_id && (
                  <p className="text-[10px] mt-1.5 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>ℹ️</span> No service types are defined for this
                    contract.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.name ? "border-rose-500" : ""}`}
                  placeholder="e.g., Offshore Platform Inspection 2024"
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm input-themed"
                  placeholder="Project description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Start Date
                  </label>
                  <JalaaliDatePicker
                    value={formData.start_date}
                    onChange={(date) =>
                      setFormData({ ...formData, start_date: date })
                    }
                    placeholder="Select date"
                  />
                  {errors.start_date && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    End Date
                  </label>
                  <JalaaliDatePicker
                    value={formData.end_date}
                    onChange={(date) =>
                      setFormData({ ...formData, end_date: date })
                    }
                    placeholder="Select date"
                  />
                  {errors.end_date && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                      ✕ {errors.end_date}
                    </p>
                  )}
                </div>
              </div>

              {selectedContract &&
                (selectedContract.start_date || selectedContract.end_date) && (
                  <div
                    className={`text-[11px] p-2 rounded-md flex items-center gap-2 ${isDark ? "bg-indigo-900/20 text-indigo-300 border border-indigo-800" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}
                  >
                    <span>📄</span>
                    <span>
                      <strong>Contract Period:</strong>{" "}
                      {selectedContract.start_date || "N/A"} →{" "}
                      {selectedContract.end_date || "N/A"}
                    </span>
                  </div>
                )}

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Project Manager <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.project_manager_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      project_manager_id: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.project_manager_id ? "border-rose-500" : ""}`}
                >
                  <option value="">-- Select Project Manager --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
                {errors.project_manager_id && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.project_manager_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Coordinator <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.coordinator_id}
                  onChange={(e) =>
                    setFormData({ ...formData, coordinator_id: e.target.value })
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.coordinator_id ? "border-rose-500" : ""}`}
                >
                  <option value="">-- Select Coordinator --</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
                {errors.coordinator_id && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">
                    ✕ {errors.coordinator_id}
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div
                className={`p-4 rounded-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}
              >
                <h3
                  className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  📋 Project Summary
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Title:</span>
                    <span className="font-semibold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Client:</span>
                    <span className="font-semibold">
                      {selectedClient?.name_en}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contract:</span>
                    <span className="font-semibold">
                      {selectedContract?.contract_no}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-500">Services:</span>
                    <div className="flex flex-col gap-1 items-end">
                      {formData.service_types.map((type) => {
                        const config =
                          INSPECTION_CATEGORY_CONFIG[
                            type as keyof typeof INSPECTION_CATEGORY_CONFIG
                          ];
                        return (
                          <Badge
                            key={type}
                            tone={config?.color as any}
                            className="text-[9px]"
                          >
                            {config?.icon} {type}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Period:</span>
                    <span className="font-semibold">
                      {formData.start_date} → {formData.end_date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Project Manager:</span>
                    <span className="font-semibold">
                      {projectManager?.fullName || projectManager?.username} (
                      {projectManager?.role})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coordinator:</span>
                    <span className="font-semibold">
                      {coordinator?.fullName || coordinator?.username} (
                      {coordinator?.role})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`flex-shrink-0 px-6 py-4 border-t ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={isSubmitting}
                >
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isContractExpired}
                  className={`gap-2 transition-all ${isContractExpired ? "bg-slate-400 text-slate-200 cursor-not-allowed opacity-60" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30"}`}
                >
                  Next Step →
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting
                    ? "Creating..."
                    : initialData
                      ? "💾 Update"
                      : "✅ Create Project"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
