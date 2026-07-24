// src/features/inspection-management/ui/InspectionRequestForm.tsx

import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { clientAppService } from "@/features/client-management/application";
import { inspectionRequestAppService } from "@features/inspection-management/application/InspectionRequestApplicationService";
import type { CreateInspectionRequestCommand } from "@features/inspection-management/application/dto/CreateInspectionRequestCommand";
import { projectAppService } from "@/features/project-management";
import { VendorAutocomplete } from "./VendorAutocomplete";
import { ProjectSelector } from "./ProjectSelector";
import type { Client } from "@/features/client-management/domain/models/Client";
import type { Contract } from "@/features/contract-management/domain";
import type {
  InspectionRequest,
  Priority,
  InspectionCategory,
  InspectionMode,
  EngineeringDocument,
} from "@/features/inspection-management/domain/types";
import type { Project } from "@features/project-management/domain/types";
import {
  PRIORITY_CONFIG,
  INSPECTION_CATEGORY_CONFIG,
  INSPECTION_MODE_CONFIG,
  TPI_DOMAINS,
  MWS_DOMAINS,
} from "../constants";
import { supabase } from "@shared/database/supabase";

interface InspectionRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, isEdit: boolean) => Promise<void>;
  initialData?: InspectionRequest | null;
  isAdmin?: boolean;
}

const PRIORITY_OPTIONS: Priority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const CATEGORY_OPTIONS: InspectionCategory[] = ["TPI", "MWS"];

interface InspectionFormData {
  project_id: string;
  client_id: string;
  contract_id: string;
  vendor_id: string;
  service_domain: string;
  inspection_mode: InspectionMode;
  inspection_scope: string;
  inspection_date: string;
  priority: Priority;
  notes: string;
  related_inspection_id: string;
  site_representative_id: string;
  documents: EngineeringDocument[];
}

const defaultFormData: InspectionFormData = {
  project_id: "",
  client_id: "",
  contract_id: "",
  vendor_id: "",
  service_domain: "",
  inspection_mode: "SPOT",
  inspection_scope: "",
  inspection_date: new Date().toISOString().split("T")[0],
  priority: "NORMAL",
  notes: "",
  related_inspection_id: "",
  site_representative_id: "",
  documents: [],
};

export function InspectionRequestForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isAdmin = false,
}: InspectionRequestFormProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<any>({});

  // Data Lists
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [relatedInspections, setRelatedInspections] = useState<
    InspectionRequest[]
  >([]);

  // Smart State Management
  const [category, setCategory] = useState<InspectionCategory>("TPI");
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>("SPOT");

  const [formDataByType, setFormDataByType] = useState<
    Record<string, InspectionFormData>
  >({
    TPI_SPOT: { ...defaultFormData },
    TPI_RESIDENT: { ...defaultFormData },
    MWS: { ...defaultFormData },
  });

  const getCurrentKey = () =>
    category === "TPI" ? `TPI_${inspectionMode}` : "MWS";
  const currentFormData = formDataByType[getCurrentKey()] || defaultFormData;

  const updateCurrentFormData = (updates: Partial<InspectionFormData>) => {
    const key = getCurrentKey();
    setFormDataByType((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  // Document Upload State
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<{
    name: string;
    document_number: string;
    revision: string;
    client_approved: boolean;
    file?: File;
    file_name?: string;
    file_size?: number;
  }>({
    name: "",
    document_number: "",
    revision: "",
    client_approved: false,
  });

  const loadClients = async () => {
    try {
      const data = await clientAppService.getAll();
      setClients(data);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await projectAppService.getAllProjects();
      setProjects(data.filter((p: Project) => p.status === "ACTIVE"));
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

  const loadRelatedInspections = async (contractId: string) => {
    try {
      const allInspections = await inspectionRequestAppService.getAll();
      const filtered = allInspections.filter(
        (i) => i.contract_id === contractId && i.id !== initialData?.id,
      );
      setRelatedInspections(filtered);
    } catch (err: any) {
      console.error("Failed to load related inspections", err);
    }
  };

  // Load Initial Data
  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadProjects();
      loadUsers();

      if (initialData) {
        setCategory(initialData.category || "TPI");
        setInspectionMode(initialData.inspection_mode || "SPOT");

        const key =
          initialData.category === "TPI"
            ? `TPI_${initialData.inspection_mode || "SPOT"}`
            : "MWS";

        setFormDataByType((prev) => ({
          ...prev,
          [key]: {
            project_id: initialData.project_id || "",
            client_id: initialData.client_id || "",
            contract_id: initialData.contract_id || "",
            vendor_id: initialData.vendor_id || "",
            service_domain: initialData.service_domain || "",
            inspection_mode: initialData.inspection_mode || "SPOT",
            inspection_scope: initialData.inspection_scope || "",
            inspection_date:
              initialData.inspection_date ||
              new Date().toISOString().split("T")[0],
            priority: initialData.priority || "NORMAL",
            notes: initialData.notes || "",
            related_inspection_id: initialData.related_inspection_id || "",
            site_representative_id:
              (initialData as any).site_representative_id || "",
            documents: [],
          },
        }));
      } else {
        setCategory("TPI");
        setInspectionMode("SPOT");
        setFormDataByType({
          TPI_SPOT: { ...defaultFormData },
          TPI_RESIDENT: { ...defaultFormData },
          MWS: { ...defaultFormData },
        });
      }
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen, initialData]);

  // وقتی پروژه انتخاب شد، client و contract را خودکار پر کن
  useEffect(() => {
    if (currentFormData.project_id) {
      const project = projects.find((p) => p.id === currentFormData.project_id);
      if (project) {
        updateCurrentFormData({
          client_id: project.client_id,
          contract_id: project.contract_id,
        });
        loadRelatedInspections(project.contract_id);
      }
    } else {
      updateCurrentFormData({
        client_id: "",
        contract_id: "",
      });
      setRelatedInspections([]);
    }
  }, [currentFormData.project_id]);

  const validateStep1 = () => {
    const newErrors: any = {};
    if (!currentFormData.project_id)
      newErrors.project_id = "Project is required";
    if (!currentFormData.service_domain)
      newErrors.service_domain = "At least one service domain is required";
    if (!currentFormData.inspection_scope.trim())
      newErrors.inspection_scope = "Inspection scope is required";
    if (!currentFormData.inspection_date)
      newErrors.inspection_date = "Inspection date is required";

    if (
      category === "TPI" &&
      inspectionMode === "SPOT" &&
      !currentFormData.vendor_id
    ) {
      newErrors.vendor_id = "Vendor is required for Spot Inspection";
    }

    if (
      category === "TPI" &&
      inspectionMode === "RESIDENT" &&
      !currentFormData.site_representative_id
    ) {
      newErrors.site_representative_id = "Site Representative is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // ساخت Command تمیز و معتبر
      const command: CreateInspectionRequestCommand = {
        project_id: currentFormData.project_id,
        client_id: currentFormData.client_id,
        contract_id: currentFormData.contract_id,
        vendor_id: currentFormData.vendor_id || undefined,
        category: category,
        service_domain: currentFormData.service_domain,
        inspection_mode: inspectionMode,
        inspection_scope: currentFormData.inspection_scope,
        inspection_date: currentFormData.inspection_date,
        priority: currentFormData.priority,
        notes: currentFormData.notes || undefined,
        related_inspection_id:
          currentFormData.related_inspection_id || undefined,
        site_representative_id:
          currentFormData.site_representative_id || undefined,
      };

      // فراخوانی لایه Application (نه دیتابیس!)
      await inspectionRequestAppService.create(command, user?.id || "");

      onClose();
      showToast(
        "success",
        "Created",
        "Inspection request created successfully",
      );
    } catch (err: any) {
      // مدیریت خطای Zod یا خطای Repository
      if (err.name === "ZodError") {
        showToast("error", "Validation Failed", err.errors[0].message);
      } else {
        showToast("error", "Save Failed", err.message || "Failed to save");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Document Handlers
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentDoc((prev) => ({
        ...prev,
        file: file,
        file_name: file.name,
        file_size: file.size,
      }));
    }
  };

  const handleAddDocument = () => {
    if (!currentDoc.name || !currentDoc.document_number || !currentDoc.file) {
      showToast("error", "Error", "Name, Number, and File are required");
      return;
    }

    const newDoc: EngineeringDocument = {
      id: `doc_${Date.now()}`,
      name: currentDoc.name,
      document_number: currentDoc.document_number,
      revision: currentDoc.revision || "0",
      file_url: "",
      file_name: currentDoc.file_name || "",
      file_size: currentDoc.file_size || 0,
      client_approved: currentDoc.client_approved,
      uploaded_at: new Date().toISOString(),
    };

    updateCurrentFormData({
      documents: [...currentFormData.documents, newDoc],
    });

    setShowDocUpload(false);
    setCurrentDoc({
      name: "",
      document_number: "",
      revision: "",
      client_approved: false,
    });
  };

  const handleRemoveDocument = (docId: string) => {
    updateCurrentFormData({
      documents: currentFormData.documents.filter((d) => d.id !== docId),
    });
  };

  const selectedProject = projects.find(
    (p) => p.id === currentFormData.project_id,
  );
  const selectedClient = clients.find(
    (c) => c.id === currentFormData.client_id,
  );
  const selectedContract = contracts.find(
    (c) => c.id === currentFormData.contract_id,
  );
  const selectedRelated = relatedInspections.find(
    (r) => r.id === currentFormData.related_inspection_id,
  );
  const selectedSiteRep = users.find(
    (u) => u.id === currentFormData.site_representative_id,
  );
  const availableDomains = category === "TPI" ? TPI_DOMAINS : MWS_DOMAINS;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Inspection Request" : "New Inspection Request"}
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
                    ? "Basic Info"
                    : step === 2
                      ? "Documents"
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
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Inspection Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const config = INSPECTION_CATEGORY_CONFIG[cat];
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2.5 rounded-lg text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                      >
                        <span className="text-lg">{config.icon}</span>
                        <span>{config.label.split(" ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inspection Mode (TPI Only) */}
              {category === "TPI" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Inspection Mode <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["SPOT", "RESIDENT"] as InspectionMode[]).map((mode) => {
                      const config = INSPECTION_MODE_CONFIG[mode];
                      const isSelected = inspectionMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setInspectionMode(mode)}
                          className={`py-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${isSelected ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                        >
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/*  Project Selection */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Project <span className="text-rose-500">*</span>
                </label>
                <ProjectSelector
                  value={currentFormData.project_id}
                  onChange={(projectId) =>
                    updateCurrentFormData({ project_id: projectId })
                  }
                  error={errors.project_id}
                />
              </div>

              {/* Auto-filled Client & Contract Info */}
              {selectedProject && (
                <div
                  className={`p-3 rounded-lg border ${isDark ? "bg-indigo-900/20 border-indigo-800" : "bg-indigo-50 border-indigo-200"}`}
                >
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span
                        className={`font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                      >
                        Client:
                      </span>
                      <span
                        className={`ml-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {selectedClient?.name_en || "—"}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                      >
                        Contract:
                      </span>
                      <span
                        className={`ml-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {selectedContract?.contract_no || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Domain */}
              {selectedProject &&
                selectedProject.service_types &&
                selectedProject.service_types.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 text-primary">
                      Service Domains <span className="text-rose-500">*</span>
                      <span className="text-[10px] font-normal text-slate-500 ml-1">
                        (Select multiple)
                      </span>
                    </label>

                    {/* TPI Domains */}
                    {selectedProject.service_types.includes("TPI") && (
                      <div className="mb-3">
                        <div
                          className={`text-[10px] font-semibold mb-1.5 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                        >
                          🏭 TPI Domains
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {TPI_DOMAINS.map((domain) => {
                            const isSelected =
                              currentFormData.service_domain.includes(domain);
                            return (
                              <button
                                key={domain}
                                type="button"
                                onClick={() => {
                                  const currentDomains =
                                    currentFormData.service_domain
                                      .split(",")
                                      .filter((d) => d);
                                  const newDomains = currentDomains.includes(
                                    domain,
                                  )
                                    ? currentDomains.filter((d) => d !== domain)
                                    : [...currentDomains, domain];
                                  updateCurrentFormData({
                                    service_domain: newDomains.join(","),
                                  });
                                }}
                                className={`py-2 px-3 rounded-lg text-[11px] font-medium border transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : isDark
                                      ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                {isSelected && <span className="mr-1">✓</span>}
                                {domain}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MWS Domains */}
                    {selectedProject.service_types.includes("MWS") && (
                      <div>
                        <div
                          className={`text-[10px] font-semibold mb-1.5 ${isDark ? "text-blue-300" : "text-blue-700"}`}
                        >
                          🚢 MWS Domains
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {MWS_DOMAINS.map((domain) => {
                            const isSelected =
                              currentFormData.service_domain.includes(domain);
                            return (
                              <button
                                key={domain}
                                type="button"
                                onClick={() => {
                                  const currentDomains =
                                    currentFormData.service_domain
                                      .split(",")
                                      .filter((d) => d);
                                  const newDomains = currentDomains.includes(
                                    domain,
                                  )
                                    ? currentDomains.filter((d) => d !== domain)
                                    : [...currentDomains, domain];
                                  updateCurrentFormData({
                                    service_domain: newDomains.join(","),
                                  });
                                }}
                                className={`py-2 px-3 rounded-lg text-[11px] font-medium border transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : isDark
                                      ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                {isSelected && <span className="mr-1">✓</span>}
                                {domain}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {errors.service_domain && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        ✕ {errors.service_domain}
                      </p>
                    )}
                  </div>
                )}

              {/* Vendor (Only for TPI SPOT) */}
              {category === "TPI" && inspectionMode === "SPOT" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Vendor <span className="text-rose-500">*</span>
                  </label>
                  <VendorAutocomplete
                    value={currentFormData.vendor_id || ""}
                    onChange={(vendorId) =>
                      updateCurrentFormData({ vendor_id: vendorId })
                    }
                    error={errors.vendor_id}
                  />
                </div>
              )}

              {/* Site Representative (Only for TPI RESIDENT - از جدول users) */}
              {category === "TPI" && inspectionMode === "RESIDENT" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Site Representative <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currentFormData.site_representative_id || ""}
                    onChange={(e) =>
                      updateCurrentFormData({
                        site_representative_id: e.target.value,
                      })
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
                  {errors.site_representative_id && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.site_representative_id}
                    </p>
                  )}
                </div>
              )}

              {/* Scope */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Inspection Scope <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={currentFormData.inspection_scope}
                  onChange={(e) =>
                    updateCurrentFormData({ inspection_scope: e.target.value })
                  }
                  rows={3}
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed ${errors.inspection_scope ? "border-rose-500" : ""}`}
                  placeholder="Describe scope, ITP reference, etc."
                />
                {errors.inspection_scope && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.inspection_scope}
                  </p>
                )}
              </div>

              {/* Date & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Inspection Date <span className="text-rose-500">*</span>
                  </label>
                  <JalaaliDatePicker
                    value={currentFormData.inspection_date}
                    onChange={(date) =>
                      updateCurrentFormData({ inspection_date: date })
                    }
                    placeholder="Select date"
                  />
                  {errors.inspection_date && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.inspection_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map((priority) => {
                      const config = PRIORITY_CONFIG[priority];
                      const isSelected = currentFormData.priority === priority;
                      return (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => updateCurrentFormData({ priority })}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${isSelected ? "bg-indigo-600 text-white border-indigo-600" : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                        >
                          {config.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Related Inspection */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Related Previous Inspection{" "}
                  <span className="text-[10px] font-normal text-slate-500">
                    (Same contract only)
                  </span>
                </label>
                <select
                  value={currentFormData.related_inspection_id}
                  onChange={(e) =>
                    updateCurrentFormData({
                      related_inspection_id: e.target.value,
                    })
                  }
                  className="w-full rounded-lg px-3 py-2.5 text-sm input-themed"
                >
                  <option value="">-- None (New Inspection) --</option>
                  {relatedInspections.map((insp) => (
                    <option key={insp.id} value={insp.id}>
                      {insp.id.slice(-8)} - {insp.inspection_scope} (
                      {INSPECTION_CATEGORY_CONFIG[insp.category]?.icon}{" "}
                      {insp.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2 & 3 همانند قبل */}
          {/* ... */}
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
