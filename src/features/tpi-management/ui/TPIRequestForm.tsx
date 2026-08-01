// src/features/tpi-management/ui/TPIRequestForm.tsx

import { useState, useEffect, useMemo } from "react";
import { Modal, Button } from "@design-system";
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
import type { TPIRequest, TPIMode, SourceFileType } from "../domain/types";
import { EquipmentFreeSearch } from "./components/EquipmentFreeSearch";
import { GroupedEquipmentSelect } from "./components/GroupedEquipmentSelect";
import { equipmentAppService } from "../application/EquipmentApplicationService";
import type { DisciplineGroup } from "../application/EquipmentApplicationService";
import { InspectionStageSelector } from "./components/InspectionStageSelector";
//import { InspectionMethodSelector } from "./components/InspectionMethodSelector";
import { masterDataAppService } from "@/shared/application/MasterDataApplicationService";
import type { SystemListItem } from "@/shared/repositories/MasterDataRepository";

import { MultiSelectWithOther } from "@/shared/ui/MultiSelectWithOther";
import { useMasterDataOptions } from "@/shared/hooks/useMasterDataOptions";

interface TPIRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TPIRequest | null;
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
  disciplines: string[];
  item_types: string[];
  equipment_type_id: string[];
  stages: string[];
  methods: string[];
  planned_inspection_date: string;
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
  item_types: [],
  equipment_type_id: [],
  stages: [],
  methods: [],
  planned_inspection_date: getTodayJalali(),
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
  { value: "Others", label: "Others Document", icon: "📄" },
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
  const [sourceFiles, setSourceFiles] = useState<TempFile[]>([]);

  const [stages, setStages] = useState<SystemListItem[]>([]);
  const [methods, setMethods] = useState<SystemListItem[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);

  const [disciplineGroups, setDisciplineGroups] = useState<DisciplineGroup[]>(
    [],
  );
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  const { options: disciplineOptions, loading: loadingDisciplines } =
    useMasterDataOptions("TPI_DISCIPLINE");

  useEffect(() => {
    const loadEquipment = async () => {
      if (formData.disciplines.length === 0) {
        setDisciplineGroups([]);
        return;
      }

      setLoadingEquipment(true);
      try {
        // ✅ ارسال تمام دیسیپلین‌ها
        const groups =
          await equipmentAppService.getGroupedEquipmentByDisciplines(
            formData.disciplines,
          );
        setDisciplineGroups(groups);

        // پاکسازی آیتم‌های نامعتبر
        const validItemNames = groups.flatMap((dg) =>
          dg.categories.flatMap((cat) => cat.items.map((i) => i.name)),
        );
        setFormData((prev) => ({
          ...prev,
          item_types: prev.item_types.filter((item) =>
            validItemNames.includes(item),
          ),
        }));
      } catch (err: any) {
        console.error("Failed to load equipment:", err);
        showToast("error", "Load Failed", "Could not load equipment list");
      } finally {
        setLoadingEquipment(false);
      }
    };

    loadEquipment();
  }, [formData.disciplines]);

  const availableProjects = useMemo(() => {
    const today = getTodayJalali().replace(/-/g, "/");
    return projects.filter((p) => {
      const isActive = p.status?.toUpperCase() === "ACTIVE";
      if (!isActive) return false;
      const hasTPI = Array.isArray((p as any).service_types)
        ? (p as any).service_types.includes("TPI")
        : String((p as any).service_types || "").includes("TPI");
      if (!hasTPI) return false;
      if (p.end_date) {
        try {
          const normalizedEndDate = p.end_date.replace(/-/g, "/");
          if (compareJalaliDates(today, normalizedEndDate) > 0) return false;
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [projects]);

  const loadData = async () => {
    try {
      const [
        projectsData,
        clientsData,
        contractsData,
        usersData,
        stagesData,
        methodsData,
      ] = await Promise.all([
        projectAppService.getAllProjects(),
        clientAppService.getAll(),
        contractAppService.getAll(),
        userAppService.getAllUsers ? userAppService.getAllUsers() : [],
        masterDataAppService.getTPIInspectionStages(),
        masterDataAppService.getTPIInspectionMethods(),
      ]);
      setProjects(projectsData);
      setClients(clientsData);
      setContracts(contractsData);
      setUsers(usersData || []);
      setStages(stagesData);
      setMethods(methodsData);
    } catch (err: any) {
      showToast("error", "Load Failed", err.message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSourceFiles([]);
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
            : [],
          item_types: Array.isArray((initialData as any).item_types)
            ? (initialData as any).item_types
            : [],
          equipment_type_id: Array.isArray(
            (initialData as any).equipment_type_id,
          )
            ? (initialData as any).equipment_type_id
            : [],
          stages: Array.isArray((initialData as any).stages)
            ? (initialData as any).stages
            : [],
          methods: Array.isArray((initialData as any).methods)
            ? (initialData as any).methods
            : [],
          planned_inspection_date:
            initialData.inspection_date || getTodayJalali(),
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
    setFormData((prev) => ({
      ...prev,
      client_id: "",
      contract_id: "",
      vendor_id: "",
      site_representative_id: "",
    }));
  }, [formData.project_id]);

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

  const updateFormData = (updates: Partial<TPIFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    if (Object.keys(updates).some((key) => key in errors)) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        Object.keys(updates).forEach((key) => delete newErrors[key]);
        return newErrors;
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles: TempFile[] = Array.from(files).map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      file,
      file_name: file.name,
      file_type: "Others" as SourceFileType,
      status: "pending" as const,
      file_size: file.size,
    }));
    setSourceFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (id: string) =>
    setSourceFiles((prev) => prev.filter((f) => f.id !== id));

  const validateStep = () => {
    const newErrors: any = {};
    if (currentStep === 1) {
      if (!formData.project_id) newErrors.project_id = "Project is required";
      if (!formData.tpi_mode)
        newErrors.tpi_mode = "Inspection mode is required";
      if (formData.tpi_mode === "SPOT" && !formData.vendor_id)
        newErrors.vendor_id = "Vendor is required for Spot Inspection";
      if (formData.tpi_mode === "RESIDENT" && !formData.site_representative_id)
        newErrors.site_representative_id = "Site Representative is required";
      if (formData.stages.length === 0)
        newErrors.stages = "At least one inspection stage is required";
    } else if (currentStep === 2) {
      if (formData.disciplines.length === 0)
        newErrors.disciplines = "At least one discipline is required";
      if (formData.item_types.length === 0)
        newErrors.item_types = "At least one inspection item type is required";
      if (formData.methods.length === 0)
        newErrors.methods = "At least one inspection method is required";
    } else if (currentStep === 3) {
      if (!formData.planned_inspection_date)
        newErrors.planned_inspection_date =
          "Planned inspection date is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(
        `[data-field="${firstErrorField}"]`,
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSaving(true);
    try {
      const command = {
        category: "TPI" as const,
        project_id: formData.project_id,
        client_id: formData.client_id,
        contract_id: formData.contract_id,
        tpi_mode: formData.tpi_mode,
        vendor_id: formData.vendor_id || undefined,
        site_representative_id: formData.site_representative_id || undefined,
        disciplines: formData.disciplines,
        item_types: formData.item_types,
        equipment_type_id: formData.equipment_type_id,
        stages: formData.stages,
        methods: formData.methods,
        inspection_date: formData.planned_inspection_date,
        priority: formData.priority,
        notes: formData.notes || undefined,
        department: user?.department || "GENERAL",
      };

      const itemsPayload = formData.item_types.map((itemName, index) => ({
        item_name: itemName,
        tag_number: null,
        description: null,
        quantity: 1,
        unit: "EA",
        manufacturer: null,
        source_type: "MANUAL",
        row_index: index,
      }));

      const filePayloads = sourceFiles.map((f) => ({
        file: f.file,
        file_name: f.file_name,
        file_type: f.file_type,
        file_size: f.file_size,
      }));

      if (initialData) {
        await tpiRequestAppService.updateWithDetails(
          initialData.id,
          command,
          itemsPayload,
          user?.id || "unknown",
          user?.department,
        );
        showToast("success", "Updated", "TPI request updated successfully");
      } else {
        await tpiRequestAppService.createWithDetails(
          command,
          itemsPayload,
          filePayloads,
          user?.id || "unknown",
          user?.department,
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

  const canViewForm = canAccessElement(TPIElements.TPIForm.form_view.id);
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
                  className={`text-[10px] mt-1.5 font-medium text-center ${currentStep >= step ? (isDark ? "text-indigo-300" : "text-indigo-600") : "text-slate-500"}`}
                >
                  {step === 1
                    ? "Project & Mode"
                    : step === 2
                      ? "Technical Scope"
                      : "Schedule & Docs"}
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

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5 animate-fadeIn">
          {/* ================= STEP 1 ================= */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div data-field="project_id">
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Project <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) =>
                    updateFormData({ project_id: e.target.value })
                  }
                  className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed transition-colors ${errors.project_id ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                >
                  <option value="">-- Select TPI Project --</option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.project_id && (
                  <p className="text-[11px] text-rose-600 mt-1.5">
                    ✕ {errors.project_id}
                  </p>
                )}
              </div>

              <div data-field="tpi_mode">
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Inspection Mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["SPOT", "RESIDENT"] as TPIMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        updateFormData({
                          tpi_mode: mode,
                          vendor_id: "",
                          site_representative_id: "",
                        })
                      }
                      className={`py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                        formData.tpi_mode === mode
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                          : errors.tpi_mode
                            ? "border-rose-500 ring-1 ring-rose-500 bg-rose-50/10"
                            : isDark
                              ? "bg-slate-800 border-slate-700 text-slate-400"
                              : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <span>{mode === "SPOT" ? "📍" : "🏢"}</span>
                      <span>
                        {mode === "SPOT"
                          ? "Spot Inspection"
                          : "Resident Inspection"}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.tpi_mode && (
                  <p className="text-[11px] text-rose-600 mt-1.5">
                    ✕ {errors.tpi_mode}
                  </p>
                )}
              </div>

              {formData.tpi_mode === "SPOT" && (
                <div data-field="vendor_id">
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

              {formData.tpi_mode === "RESIDENT" && (
                <div data-field="site_representative_id">
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Site Representative <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.site_representative_id}
                    onChange={(e) =>
                      updateFormData({ site_representative_id: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2.5 text-sm input-themed transition-colors ${errors.site_representative_id ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                  >
                    <option value="">-- Select Site Representative --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.username} ({u.email})
                      </option>
                    ))}
                  </select>
                  {errors.site_representative_id && (
                    <p className="text-[11px] text-rose-600 mt-1.5">
                      ✕ {errors.site_representative_id}
                    </p>
                  )}
                </div>
              )}

              <div data-field="stages">
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Inspection Stages <span className="text-rose-500">*</span>
                </label>
                <p className="text-[10px] text-slate-500 mb-3">
                  Select the inspection stages for this request
                </p>
                <InspectionStageSelector
                  options={stages}
                  value={formData.stages}
                  onChange={(values: string[]) =>
                    updateFormData({ stages: values })
                  }
                  isLoading={loadingStages}
                  error={errors.stages}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 2 ================= */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div data-field="disciplines">
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Disciplines <span className="text-rose-500">*</span>
                </label>
                {loadingDisciplines ? (
                  <span className="text-xs text-slate-500 animate-pulse">
                    Loading...
                  </span>
                ) : (
                  <MultiSelectWithOther<string>
                    options={disciplineOptions as readonly string[]}
                    value={formData.disciplines}
                    onChange={(values) =>
                      updateFormData({ disciplines: values })
                    }
                    fieldType="TPI_DISCIPLINE"
                    isBlocking={true}
                  />
                )}
                {errors.disciplines && (
                  <p className="text-[11px] text-rose-600 mt-1.5">
                    ✕ {errors.disciplines}
                  </p>
                )}
              </div>

              <div data-field="item_types">
                <label className="block text-xs font-semibold mb-1.5 text-primary">
                  Equipment Item <span className="text-rose-500">*</span>
                </label>
                <p className="text-[10px] text-slate-500 mb-1.5">
                  {formData.disciplines.length > 0
                    ? "Browse by category or search by name"
                    : "💡 Start typing to search all equipment — discipline will be auto-detected"}
                </p>

                {formData.disciplines.length === 0 ? (
                  <EquipmentFreeSearch
                    value={formData.item_types}
                    onChange={(
                      values: string[],
                      detectedDiscipline?: string,
                    ) => {
                      const newEquipmentIds = values.map((itemName) => {
                        for (const group of disciplineGroups) {
                          for (const category of group.categories) {
                            const foundItem = (category.items as any[]).find(
                              (item) => item.name === itemName,
                            );
                            if (foundItem) {
                              return (
                                foundItem.id ||
                                foundItem.equipment_id ||
                                itemName
                              );
                            }
                          }
                        }
                        return itemName;
                      });

                      updateFormData({
                        item_types: values,
                        equipment_type_id: newEquipmentIds,
                      });

                      if (
                        detectedDiscipline &&
                        !formData.disciplines.includes(detectedDiscipline)
                      ) {
                        updateFormData({
                          disciplines: [
                            ...formData.disciplines,
                            detectedDiscipline,
                          ],
                        });
                      }
                    }}
                    error={errors.item_types}
                  />
                ) : (
                  <GroupedEquipmentSelect
                    disciplineGroups={disciplineGroups}
                    isLoading={loadingEquipment}
                    value={formData.item_types}
                    onChange={(values: string[]) => {
                      const newEquipmentId = values.map((itemName) => {
                        for (const group of disciplineGroups) {
                          for (const category of group.categories) {
                            const foundItem = (category.items as any[]).find(
                              (item) => item.name === itemName,
                            );
                            if (foundItem) {
                              return (
                                foundItem.id ||
                                foundItem.equipment_id ||
                                itemName
                              );
                            }
                          }
                        }
                        return itemName;
                      });

                      updateFormData({
                        item_types: values,
                        equipment_type_id: newEquipmentId,
                      });
                    }}
                    error={errors.item_types}
                  />
                )}
                {errors.item_types && (
                  <p className="text-[11px] text-rose-600 mt-1.5">
                    ✕ {errors.item_types}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
                <div data-field="methods">
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Inspection Methods <span className="text-rose-500">*</span>
                  </label>
                  {loadingMethods ? (
                    <span className="text-xs text-slate-500 animate-pulse">
                      Loading...
                    </span>
                  ) : (
                    <MultiSelectWithOther<string>
                      options={methods.map((m) => m.value) as readonly string[]}
                      value={formData.methods}
                      onChange={(values: string[]) =>
                        updateFormData({ methods: values })
                      }
                      fieldType="TPI_INSPECTION_METHOD"
                      isBlocking={true}
                    />
                  )}
                  {errors.methods && (
                    <p className="text-[11px] text-rose-600 mt-1.5">
                      ✕ {errors.methods}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3 ================= */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div
                className={`p-4 rounded-xl border ${isDark ? "border-amber-700/50 bg-amber-900/10" : "border-amber-200 bg-amber-50"}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <h4
                      className={`text-sm font-bold ${isDark ? "text-amber-300" : "text-amber-800"}`}
                    >
                      Note on Inspection Date
                    </h4>
                    <p
                      className={`text-[11px] mt-1 ${isDark ? "text-amber-200/70" : "text-amber-700"}`}
                    >
                      This is a <strong>Planned/Tentative Date</strong>. The
                      definitive execution date will be set later when an
                      inspector is officially assigned to this request.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-field="planned_inspection_date">
                  <label className="block text-xs font-semibold mb-1.5 text-primary">
                    Planned Inspection Date{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <JalaaliDatePicker
                    value={formData.planned_inspection_date}
                    onChange={(date) =>
                      updateFormData({ planned_inspection_date: date })
                    }
                    placeholder="Select tentative date"
                    className={
                      errors.planned_inspection_date
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : ""
                    }
                  />
                  {errors.planned_inspection_date && (
                    <p className="text-[11px] text-rose-600 mt-1.5">
                      ✕ {errors.planned_inspection_date}
                    </p>
                  )}
                </div>
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
                  placeholder="Additional notes, special instructions, or context..."
                />
              </div>

              <div
                className={`p-4 rounded-xl border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <h4
                  className={`text-sm font-bold mb-3 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  📎 Supporting Documents
                </h4>
                <label
                  className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition-all hover:border-indigo-500 ${isDark ? "border-slate-600 bg-slate-800/50" : "border-slate-300 bg-white"}`}
                >
                  <div className="text-xl mb-1">📂</div>
                  <p
                    className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Click to upload Packing List, MTO, etc.
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.xls,.xlsx,.csv,.doc,.docx"
                    onChange={handleFileSelect}
                  />
                </label>

                {sourceFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {sourceFiles.map((f) => (
                      <div
                        key={f.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-white"}`}
                      >
                        <span className="text-lg shrink-0">📎</span>
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
                      ? "💾 Update Request"
                      : "✅ Create Request"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
