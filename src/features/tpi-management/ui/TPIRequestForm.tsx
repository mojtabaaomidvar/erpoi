// src/features/tpi-management/ui/TPIRequestForm.tsx
import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { TPIElements } from "@shared/authorization/ui/elements/TPIElements";
import { showToast } from "@shared/ui/ToastContainer";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { compareJalaliDates, getTodayJalali } from "@/shared/utils/dateUtils";
import { tpiRequestAppService } from "../application";
import { projectAppService } from "@/features/project-management";
import { clientAppService } from "@/features/client-management/application";
import { contractAppService } from "@/features/contract-management/application";
import { userAppService } from "@/shared/authorization";
import { VendorAutocomplete } from "./VendorAutocomplete";
import type { Priority } from "@features/inspection-core/domain/types";
import type { Project } from "@/features/project-management/domain/types";
import type { Client } from "@/features/client-management/domain/models/Client";
import type { Contract } from "@/features/contract-management/domain";
import type {
  TPIRequest,
  TPIMode,
  TPIDiscipline,
  TPIInspectionStage,
  TPIInspectionMethod,
  SourceFileType,
} from "../domain/types";
import {
  TPI_DISCIPLINE_OPTIONS,
  TPI_INSPECTION_STAGE_OPTIONS,
  TPI_INSPECTION_METHOD_OPTIONS,
} from "../domain/types";

interface TPIRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TPIRequest | null;
}

interface TempItem {
  id: string;
  item_name: string;
  tag_number: string;
  description: string;
  quantity: number;
  unit: string;
  manufacturer: string;
}

interface TempFile {
  id: string;
  file: File;
  file_name: string;
  file_type: SourceFileType;
  status: "pending" | "uploading" | "success" | "failed";
  file_url?: string;
  file_size: number;
}

interface TPIFormData {
  project_id: string;
  client_id: string;
  contract_id: string;
  tpi_mode: TPIMode;
  vendor_id: string;
  site_representative_id: string;
  disciplines: TPIDiscipline[];
  stages: TPIInspectionStage[];
  methods: TPIInspectionMethod[];
  inspection_date: string;
  priority: Priority;
  notes: string;
}

const defaultFormData: TPIFormData = {
  project_id: "",
  client_id: "",
  contract_id: "",
  tpi_mode: "SPOT",
  vendor_id: "",
  site_representative_id: "",
  disciplines: [],
  stages: [],
  methods: [],
  inspection_date: getTodayJalali(),
  priority: "NORMAL",
  notes: "",
};

const PRIORITY_OPTIONS: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const SOURCE_FILE_TYPES: {
  value: SourceFileType;
  label: string;
  icon: string;
}[] = [
  { value: "PACKING_LIST", label: "Packing List", icon: "📦" },
  { value: "MTO", label: "MTO (Material Take-Off)", icon: "📋" },
  { value: "OTHER", label: "Other Document", icon: "📄" },
];

export function TPIRequestForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: TPIRequestFormProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccessElement } = usePermissionMapping();

  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<any>({});
  const [formData, setFormData] = useState<TPIFormData>(defaultFormData);

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [items, setItems] = useState<TempItem[]>([]);
  const [sourceFiles, setSourceFiles] = useState<TempFile[]>([]);
  const [itemEntryMode, setItemEntryMode] = useState<"manual" | "upload">(
    "manual",
  );

  const canViewForm = canAccessElement(TPIElements.TPIForm.form_view.id);
  const canSelectProject = canAccessElement(
    TPIElements.TPIForm.select_project.id,
  );
  const canSelectMode = canAccessElement(TPIElements.TPIForm.select_mode.id);
  const canSelectVendor = canAccessElement(
    TPIElements.TPIForm.select_vendor.id,
  );
  const canSelectSiteRep = canAccessElement(
    TPIElements.TPIForm.select_site_rep.id,
  );
  const canSelectDiscipline = canAccessElement(
    TPIElements.TPIForm.select_service_domain.id,
  );
  const canSelectMethods = canAccessElement(TPIElements.TPIForm.input_scope.id);
  const canInputDate = canAccessElement(TPIElements.TPIForm.input_date.id);
  const canSelectPriority = canAccessElement(
    TPIElements.TPIForm.select_priority.id,
  );
  const canSubmit = canAccessElement(TPIElements.TPIForm.btn_submit.id);

  const loadData = async () => {
    try {
      const [projectsData, clientsData, contractsData, usersData] =
        await Promise.all([
          projectAppService.getAllProjects(),
          clientAppService.getAll(),
          contractAppService.getAll(),
          userAppService.getAllUsers ? userAppService.getAllUsers() : [],
        ]);

      const today = getTodayJalali();
      const normalizedToday = today.replace(/-/g, "/");

      const filteredProjects = projectsData.filter((p) => {
        const isActive = p.status?.toUpperCase() === "ACTIVE";
        if (!isActive) return false;
        if (p.end_date) {
          try {
            const normalizedEndDate = p.end_date.replace(/-/g, "/");
            if (compareJalaliDates(normalizedToday, normalizedEndDate) > 0)
              return false;
          } catch {
            return false;
          }
        }
        return true;
      });

      setProjects(filteredProjects);
      setClients(clientsData);
      setContracts(contractsData);
      setUsers(usersData || []);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setItems([]);
      setSourceFiles([]);
      setItemEntryMode("manual");
      if (initialData) {
        setFormData({
          project_id: initialData.project_id || "",
          client_id: initialData.client_id || "",
          contract_id: initialData.contract_id || "",
          tpi_mode: initialData.tpi_mode || "SPOT",
          vendor_id: initialData.vendor_id || "",
          site_representative_id: initialData.site_representative_id || "",
          disciplines: Array.isArray((initialData as any).disciplines)
            ? (initialData as any).disciplines
            : (initialData as any).discipline
              ? [(initialData as any).discipline]
              : [],
          stages: Array.isArray((initialData as any).stages)
            ? (initialData as any).stages
            : (initialData as any).stage
              ? [(initialData as any).stage]
              : [],
          methods: Array.isArray((initialData as any).methods)
            ? (initialData as any).methods
            : [],
          inspection_date: initialData.inspection_date || getTodayJalali(),
          priority: initialData.priority || "NORMAL",
          notes: initialData.notes || "",
        });
      } else {
        setFormData(defaultFormData);
      }
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (formData.project_id) {
      const project = projects.find((p) => p.id === formData.project_id);
      if (project) {
        setFormData((prev) => ({
          ...prev,
          client_id: project.client_id,
          contract_id: project.contract_id,
        }));
      }
    }
  }, [formData.project_id, projects]);

  const selectedProject = projects.find((p) => p.id === formData.project_id);
  const selectedContract = selectedProject
    ? contracts.find((c) => c.id === selectedProject.contract_id)
    : null;

  const addEmptyItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        item_name: "",
        tag_number: "",
        description: "",
        quantity: 1,
        unit: "EA",
        manufacturer: "",
      },
    ]);
  };

  const updateItem = (id: string, field: keyof TempItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: TempFile[] = Array.from(files).map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      file,
      file_name: file.name,
      file_type: "OTHER" as SourceFileType,
      status: "pending" as const,
      file_size: file.size,
    }));
    setSourceFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const updateFileType = (id: string, type: SourceFileType) => {
    setSourceFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, file_type: type } : f)),
    );
  };

  const removeFile = (id: string) =>
    setSourceFiles((prev) => prev.filter((f) => f.id !== id));

  const toggleDiscipline = (disc: TPIDiscipline) => {
    setFormData((prev) => ({
      ...prev,
      disciplines: prev.disciplines.includes(disc)
        ? prev.disciplines.filter((d) => d !== disc)
        : [...prev.disciplines, disc],
    }));
  };

  const toggleStage = (stage: TPIInspectionStage) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    }));
  };

  const toggleMethod = (method: TPIInspectionMethod) => {
    setFormData((prev) => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter((m) => m !== method)
        : [...prev.methods, method],
    }));
  };

  const validateStep = () => {
    const newErrors: any = {};
    if (currentStep === 1) {
      if (!formData.project_id) newErrors.project_id = "Project is required";
      if (!formData.tpi_mode) newErrors.tpi_mode = "TPI Mode is required";
      if (formData.disciplines.length === 0)
        newErrors.disciplines = "At least one discipline is required";
      if (formData.stages.length === 0)
        newErrors.stages = "At least one inspection stage is required";
      if (formData.tpi_mode === "SPOT" && !formData.vendor_id)
        newErrors.vendor_id = "Vendor is required for Spot Inspection";
      if (formData.tpi_mode === "RESIDENT" && !formData.site_representative_id)
        newErrors.site_representative_id = "Site Representative is required";
    } else if (currentStep === 2) {
      if (formData.methods.length === 0)
        newErrors.methods = "At least one inspection method is required";
      if (!formData.inspection_date)
        newErrors.inspection_date = "Inspection date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setCurrentStep(2);
  };
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSaving(true);
    try {
      const command = {
        project_id: formData.project_id,
        client_id: formData.client_id,
        contract_id: formData.contract_id,
        category: "TPI" as const,
        tpi_mode: formData.tpi_mode,
        vendor_id: formData.vendor_id || undefined,
        site_representative_id: formData.site_representative_id || undefined,
        disciplines: formData.disciplines,
        stages: formData.stages,
        methods: formData.methods,
        inspection_date: formData.inspection_date,
        priority: formData.priority,
        notes: formData.notes || undefined,
      };

      if (initialData) {
        await tpiRequestAppService.update(initialData.id, command);
        showToast("success", "Updated", "TPI request updated successfully");
      } else {
        const filePayloads = sourceFiles.map((f) => ({
          file: f.file,
          file_name: f.file_name,
          file_type: f.file_type,
          file_size: f.file_size,
        }));
        await tpiRequestAppService.createWithDetails(
          command,
          items,
          filePayloads,
          user?.id || "unknown",
        );
        showToast("success", "Created", "TPI request created successfully");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (updates: Partial<TPIFormData>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  if (!canViewForm) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" size="md">
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <p
            className={`text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            You do not have permission to create TPI requests.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit TPI Request" : "New TPI Request"}
      size="xl"
    >
      <div className="flex flex-col" style={{ height: "calc(90vh - 120px)" }}>
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            {[1, 2].map((step) => (
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
                  {step === 1 ? "Basic Info" : "Details & Items"}
                </span>
                {step < 2 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-0.5 -z-0 ${currentStep > step ? "bg-gradient-to-r from-indigo-500 to-violet-600" : isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              {canSelectProject && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Project <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) =>
                      updateFormData({ project_id: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.project_id ? "border-rose-500" : ""}`}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {selectedProject && (
                    <div
                      className={`mt-2 p-3 rounded-lg border text-xs ${isDark ? "bg-indigo-950/30 border-indigo-800/50" : "bg-indigo-50 border-indigo-200"}`}
                    >
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <span>📁</span>
                        <span
                          className={
                            isDark ? "text-indigo-300" : "text-indigo-700"
                          }
                        >
                          {selectedProject.name}
                        </span>
                      </div>
                      <div
                        className={`grid grid-cols-2 gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        <span>
                          Client:{" "}
                          {clients.find(
                            (c) => c.id === selectedProject.client_id,
                          )?.name_en || "—"}
                        </span>
                        <span>
                          Contract:{" "}
                          {selectedContract?.contract_title ||
                            selectedContract?.contract_no ||
                            "—"}
                        </span>
                      </div>
                    </div>
                  )}
                  {errors.project_id && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.project_id}
                    </p>
                  )}
                </div>
              )}

              {canSelectMode && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    TPI Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["SPOT", "RESIDENT"] as TPIMode[]).map((mode) => {
                      const isSelected = formData.tpi_mode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateFormData({ tpi_mode: mode })}
                          className={`py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${isSelected ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                        >
                          <span>{mode === "SPOT" ? "📍" : "🏢"}</span>
                          <span>
                            {mode === "SPOT"
                              ? "Spot Inspection"
                              : "Resident Inspection"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.tpi_mode && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.tpi_mode}
                    </p>
                  )}
                </div>
              )}

              {formData.tpi_mode === "SPOT" && canSelectVendor && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Vendor <span className="text-rose-500">*</span>
                  </label>
                  <VendorAutocomplete
                    value={formData.vendor_id}
                    onChange={(vendorId: string) =>
                      updateFormData({ vendor_id: vendorId })
                    }
                    error={errors.vendor_id}
                  />
                </div>
              )}

              {formData.tpi_mode === "RESIDENT" && canSelectSiteRep && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Site Representative <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.site_representative_id}
                    onChange={(e) =>
                      updateFormData({ site_representative_id: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.site_representative_id ? "border-rose-500" : ""}`}
                  >
                    <option value="">-- Select Site Representative --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {canSelectDiscipline && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Disciplines <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TPI_DISCIPLINE_OPTIONS.map((disc) => {
                      const isSelected = formData.disciplines.includes(disc);
                      return (
                        <button
                          key={disc}
                          type="button"
                          onClick={() => toggleDiscipline(disc)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded cursor-pointer accent-indigo-600 shrink-0"
                          />
                          <span className="text-[11px] font-medium">
                            {disc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.disciplines && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.disciplines}
                    </p>
                  )}
                </div>
              )}

              {canSelectDiscipline && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Inspection Stages <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TPI_INSPECTION_STAGE_OPTIONS.map((stage) => {
                      const isSelected = formData.stages.includes(stage);
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => toggleStage(stage)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded cursor-pointer accent-indigo-600 shrink-0"
                          />
                          <span className="text-[11px] font-medium">
                            {stage}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.stages && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.stages}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {canSelectMethods && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Inspection Methods <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {TPI_INSPECTION_METHOD_OPTIONS.map((method) => {
                      const isSelected = formData.methods.includes(method);
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => toggleMethod(method)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : isDark ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 rounded cursor-pointer accent-indigo-600 shrink-0"
                          />
                          <span className="text-[11px] font-medium">
                            {method}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.methods && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.methods}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {canInputDate && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-primary">
                      Inspection Date <span className="text-rose-500">*</span>
                    </label>
                    <JalaaliDatePicker
                      value={formData.inspection_date}
                      onChange={(date) =>
                        updateFormData({ inspection_date: date })
                      }
                      placeholder="Select date"
                    />
                    {errors.inspection_date && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        ✕ {errors.inspection_date}
                      </p>
                    )}
                  </div>
                )}
                {canSelectPriority && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-primary">
                      Priority
                    </label>
                    <div className="flex gap-2">
                      {PRIORITY_OPTIONS.map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => updateFormData({ priority })}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${formData.priority === priority ? "bg-indigo-600 text-white border-indigo-600" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`p-4 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4
                    className={`text-sm font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    📦 Inspection Items
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setItemEntryMode("manual")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${itemEntryMode === "manual" ? "bg-indigo-600 text-white border-indigo-600" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      ✏️ Manual Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemEntryMode("upload")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${itemEntryMode === "upload" ? "bg-emerald-600 text-white border-emerald-600" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      📤 Upload File
                    </button>
                  </div>
                </div>

                {itemEntryMode === "manual" && (
                  <div className="space-y-3">
                    {items.length === 0 && (
                      <p
                        className={`text-xs text-center py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        No items added yet. Click "Add Item" to start.
                      </p>
                    )}
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}
                          >
                            ITEM #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={item.item_name}
                            onChange={(e) =>
                              updateItem(item.id, "item_name", e.target.value)
                            }
                            className="col-span-2 rounded px-2 py-1.5 text-xs input-themed"
                            placeholder="Item Name / Description *"
                          />
                          <input
                            type="text"
                            value={item.tag_number}
                            onChange={(e) =>
                              updateItem(item.id, "tag_number", e.target.value)
                            }
                            className="rounded px-2 py-1.5 text-xs input-themed"
                            placeholder="Tag Number"
                          />
                          <input
                            type="text"
                            value={item.manufacturer}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "manufacturer",
                                e.target.value,
                              )
                            }
                            className="rounded px-2 py-1.5 text-xs input-themed"
                            placeholder="Manufacturer"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-20 rounded px-2 py-1.5 text-xs input-themed"
                              placeholder="Qty"
                              min={1}
                            />
                            <select
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(item.id, "unit", e.target.value)
                              }
                              className="flex-1 rounded px-2 py-1.5 text-xs input-themed"
                            >
                              <option value="EA">EA</option>
                              <option value="SET">SET</option>
                              <option value="LOT">LOT</option>
                              <option value="PKG">PKG</option>
                              <option value="M">M</option>
                              <option value="KG">KG</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            className="rounded px-2 py-1.5 text-xs input-themed"
                            placeholder="Additional notes"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEmptyItem}
                      className="w-full py-2 rounded-lg border-2 border-dashed text-xs font-semibold transition-all hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700"
                    >
                      ➕ Add Item
                    </button>
                  </div>
                )}

                {itemEntryMode === "upload" && (
                  <div className="space-y-3">
                    <label
                      className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-indigo-500 ${isDark ? "border-slate-600 bg-slate-800/50" : "border-slate-300 bg-white"}`}
                    >
                      <div className="text-xl mb-1">📂</div>
                      <p
                        className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                      >
                        Click to upload Packing List, MTO, or ...
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.xls,.xlsx,.csv,.doc,.docx"
                        onChange={handleFileSelect}
                      />
                    </label>
                    {sourceFiles.map((f) => (
                      <div
                        key={f.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${f.status === "failed" ? (isDark ? "border-rose-700 bg-rose-950/20" : "border-rose-200 bg-rose-50") : isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-white"}`}
                      >
                        <span className="text-lg shrink-0">
                          {f.status === "uploading"
                            ? "⏳"
                            : f.status === "success"
                              ? "✅"
                              : f.status === "failed"
                                ? "❌"
                                : "📎"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                          >
                            {f.file_name}
                          </p>
                          <p
                            className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {(f.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <select
                          value={f.file_type}
                          onChange={(e) =>
                            updateFileType(
                              f.id,
                              e.target.value as SourceFileType,
                            )
                          }
                          className="rounded px-2 py-1 text-[10px] input-themed w-28"
                        >
                          {SOURCE_FILE_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-semibold shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm input-themed"
                  placeholder="Additional notes or specific instructions..."
                />
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
              {currentStep < 2 ? (
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
                  disabled={isSaving || !canSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving
                    ? "⏳ Saving..."
                    : initialData
                      ? "💾 Update"
                      : "✅ Create"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
