// src/features/inspection-management/ui/ProjectForm.tsx

import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { supabase } from "@shared/database/supabase";
import { clientAppService } from "@/features/client-management/application";
import { contractAppService } from "@/features/contract-management/application";
import type { Client } from "@/features/client-management/domain/models/Client";
import type { Contract } from "@/features/contract-management/domain";
import type { Project, ProjectRole } from "../domain/types";
import { INSPECTION_CATEGORY_CONFIG } from "@features/inspection-management/constants";
import { CreateProjectSchema } from "../application/dto/CreateProjectCommand";

export type InspectionCategory = "TPI" | "MWS";

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
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<any>({});

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form Data
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadClients = async () => {
    try {
      const data = await clientAppService.getAll();
      setClients(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  const loadContracts = async (clientId: string) => {
    try {
      const data = await contractAppService.getByClientId(clientId);
      setFilteredContracts(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .schema("core")
        .from("users")
        .select("id, full_name, username, email, role")
        .order("full_name", { ascending: true });

      if (error) throw new Error(error.message);
      setUsers(data || []);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      showToast("error", "Load Users Failed", err.message);
    }
  };

  // Load Initial Data
  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadUsers();

      if (initialData) {
        setFormData({
          name: initialData.name,
          client_id: initialData.client_id,
          contract_id: initialData.contract_id,
          service_types: initialData.service_types || [],
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
  }, [isOpen, initialData]);

  // Load Contracts when Client changes
  useEffect(() => {
    if (formData.client_id) {
      loadContracts(formData.client_id);
    } else {
      setFilteredContracts([]);
    }
  }, [formData.client_id]);

  // Auto-fill dates from contract
  useEffect(() => {
    if (formData.contract_id) {
      const contract = filteredContracts.find(
        (c) => c.id === formData.contract_id,
      );
      if (contract) {
        setFormData((prev) => ({
          ...prev,
          start_date: contract.start_date || prev.start_date,
          end_date: contract.end_date || prev.end_date,
        }));
      }
    }
  }, [formData.contract_id, filteredContracts]);

  // Toggle service type (TPI or MWS)
  const handleServiceTypeToggle = (type: InspectionCategory) => {
    setFormData((prev) => ({
      ...prev,
      service_types: prev.service_types.includes(type)
        ? prev.service_types.filter((t) => t !== type)
        : [...prev.service_types, type],
    }));
  };

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!formData.client_id) newErrors.client_id = "Client is required";
    if (!formData.contract_id) newErrors.contract_id = "Contract is required";
    if (formData.service_types.length === 0) {
      newErrors.service_types = "At least one service type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Project title is required";
    if (!formData.project_manager_id)
      newErrors.project_manager_id = "Project Manager is required";
    if (!formData.coordinator_id)
      newErrors.coordinator_id = "Coordinator is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!formData.project_manager_id) {
        showToast("error", "Error", "Project Manager is required");
        setIsSubmitting(false);
        return;
      }
      if (!formData.coordinator_id) {
        showToast("error", "Error", "Coordinator is required");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: formData.name,
        client_id: formData.client_id,
        contract_id: formData.contract_id,
        service_types: formData.service_types,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        created_by: user?.id || "unknown",
        project_manager_id: formData.project_manager_id,
        coordinator_id: formData.coordinator_id,
      };

      console.log("🚀 [DEBUG] Payload being sent:", payload);

      CreateProjectSchema.parse(payload);
      await onSave(payload);
    } catch (err: any) {
      if (err.name === "ZodError") {
        console.error("❌ [Zod Validation Failed]:", err.errors);
        showToast("error", "Validation Failed", err.errors[0].message);
      } else {
        showToast("error", "Error", err.message || "An error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === formData.client_id);
  const selectedContract = filteredContracts.find(
    (c) => c.id === formData.contract_id,
  );
  const projectManager = users.find(
    (u) => u.id === formData.project_manager_id,
  );
  const coordinator = users.find((u) => u.id === formData.coordinator_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Project" : "Create New Project"}
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        {/* Step Indicator */}
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className="flex flex-col items-center flex-1 relative"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all z-10 ${
                    currentStep >= step
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg"
                      : isDark
                        ? "bg-slate-700 text-slate-400"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {currentStep > step ? "✓" : step}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium ${currentStep >= step ? (isDark ? "text-indigo-300" : "text-indigo-600") : "text-slate-500"}`}
                >
                  {step === 1
                    ? "Contract & Services"
                    : step === 2
                      ? "Team"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Client */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Client <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client_id: e.target.value,
                      contract_id: "",
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.client_id ? "border-rose-500" : ""}`}
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((client) => (
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

              {/* Contract */}
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
                  {filteredContracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.contract_no} - {contract.contract_title}
                    </option>
                  ))}
                </select>
                {errors.contract_id && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.contract_id}
                  </p>
                )}
              </div>

              {/* Service Types Selection */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Service Types <span className="text-rose-500">*</span>
                  <span className="text-[10px] font-normal text-slate-500 ml-1">
                    (Project includes all domains by default)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["TPI", "MWS"] as InspectionCategory[]).map((type) => {
                    const config = INSPECTION_CATEGORY_CONFIG[type];
                    const isSelected = formData.service_types.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleServiceTypeToggle(type)}
                        className={`py-2.5 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : isDark
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="text-sm">
                          {config.icon} {config.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px]">✓ Selected</span>
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
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Project Title */}
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

              {/* Description */}
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

              {/* Dates */}
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
                </div>
              </div>
              {selectedContract && (
                <div
                  className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  ℹ️ Dates auto-filled from contract:{" "}
                  {selectedContract.start_date} → {selectedContract.end_date}
                </div>
              )}

              {/* Project Manager */}
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
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.username} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
                {errors.project_manager_id && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.project_manager_id}
                  </p>
                )}
              </div>

              {/* Coordinator */}
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
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.username} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
                {errors.coordinator_id && (
                  <p className="text-[11px] text-rose-600 mt-1">
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
                            type as InspectionCategory
                          ];
                        return (
                          <Badge
                            key={type}
                            tone={config.color as any}
                            className="text-[9px]"
                          >
                            {config.icon} {type}
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
                      {projectManager?.full_name || projectManager?.username}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coordinator:</span>
                    <span className="font-semibold">
                      {coordinator?.full_name || coordinator?.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
                  disabled={isSaving}
                >
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Next Step →
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving
                    ? " Creating..."
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
