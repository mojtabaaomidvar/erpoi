// src/features/inspector-managment/ui/InspectorAddForm.tsx

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import type { Inspector, InspectorType } from "@/types/inspector";
import { inspectorService } from "../services/InspectorService";

interface InspectorAddFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any, isEdit: boolean) => Promise<void>;
  initialData?: Inspector | null;
  isAdmin?: boolean;
}

const SPECIALTIES_OPTIONS = [
  "General",
  "Telecommunication",
  "Architecture",
  "Piping",
  "Instrumentation",
  "Mechanical",
  "Electrical",
  "Process",
  "Welding",
  "HVAC",
  "Civil",
  "Coating",
  "NDT",
  "Structure",
  "Material",
  "MWS",
];

const StepIndicator = ({
  currentStep,
  isDark,
}: {
  currentStep: number;
  isDark: boolean;
}) => (
  <div className="flex items-center justify-between mb-6 px-2">
    {[1, 2, 3].map((step) => (
      <div key={step} className="flex flex-col items-center flex-1 relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10 ${currentStep >= step ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900" : isDark ? "bg-slate-700 text-slate-400" : "bg-slate-200 text-slate-500"}`}
        >
          {currentStep > step ? "✓" : step}
        </div>
        <span
          className={`text-[10px] mt-1 font-medium ${currentStep >= step ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
        >
          {step === 1
            ? "Basic Info"
            : step === 2
              ? "Professional"
              : "Documents"}
        </span>
        {step < 3 && (
          <div
            className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${currentStep > step ? "bg-indigo-600" : isDark ? "bg-slate-700" : "bg-slate-200"}`}
          />
        )}
      </div>
    ))}
  </div>
);

export function InspectorAddForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  isAdmin = false,
}: InspectorAddFormProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name_en: "",
    name_fa: "",
    inspector_type: "ICS_MEMBER" as InspectorType,
    specialties: [] as string[],
    phone: "",
    email: "",
    location_base: "",
    personnel_code: "",
    user_id: "",
    resumeFile: null as File | null,
    resume_name: "",
    resume_size: 0,
    rating: 0,
    completed_inspections: 0,
    active_missions: 0,
  });

  const fetchUsers = async () => {
    try {
      // اگر در حال ویرایش هستیم، user_id فعلی را پاس می‌دهیم تا از لیست حذف نشود
      const currentEditingUserId = initialData?.user_id || null;

      const availableUsers =
        await inspectorService.getAvailableUsersForIcsMember(
          currentEditingUserId,
        );

      // اعمال فیلتر دپارتمان (اگر در کد اصلی شما وجود داشت)
      let finalUsers = availableUsers;
      if (user?.department) {
        finalUsers = availableUsers.filter(
          (u) => u.department === user.department,
        );
      }

      setUsers(finalUsers);
    } catch (err) {
      console.error("Failed to fetch available users", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers(); // 🔧 فراخوانی تابع به‌روزشده

      if (initialData) {
        setFormData({
          name_en: initialData.name_en || "",
          name_fa: initialData.name_fa || "",
          inspector_type: initialData.inspector_type || "ICS_MEMBER",
          specialties: initialData.specialties || [],
          phone: initialData.phone || "",
          email: initialData.email || "",
          location_base: initialData.location_base || "",
          personnel_code: initialData.personnel_code || "",
          user_id: initialData.user_id || "",
          resumeFile: null,
          resume_name: initialData.resume_name || "",
          resume_size: initialData.resume_size || 0,
          rating: initialData.rating || 0,
          completed_inspections: initialData.completed_inspections || 0,
          active_missions: initialData.active_missions || 0,
        });
      } else {
        // ریست فرم برای افزودن جدید
        setFormData({
          name_en: "",
          name_fa: "",
          inspector_type: "ICS_MEMBER",
          specialties: [],
          phone: "",
          email: "",
          location_base: "",
          personnel_code: "",
          user_id: "",
          resumeFile: null,
          resume_name: "",
          resume_size: 0,
          rating: 0,
          completed_inspections: 0,
          active_missions: 0,
        });
      }
      setErrors({});
      setCurrentStep(1);
    }
  }, [initialData, isOpen, user?.department]);

  const handleToggleSpecialty = (spec: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "File Too Large", "Resume must be less than 5MB");
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast(
        "error",
        "Invalid Format",
        "Only PDF and Word documents are allowed",
      );
      return;
    }

    const fileExt = file.name.split(".").pop() || "pdf";
    const inspectorName = formData.name_en.trim() || "Inspector";
    const customName = `${inspectorName} - CV.${fileExt}`;

    setFormData((prev) => ({
      ...prev,
      resumeFile: file,
      resume_name: file.name,
      resume_size: file.size,
    }));
  };

  const handleRemoveResume = () => {
    setFormData((prev) => ({
      ...prev,
      resumeFile: null,
      resume_name: "",
      resume_size: 0,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + " " + sizes[i];
  };

  const validateStep = (step: number) => {
    if (isAdmin) {
      setErrors({});
      return true;
    }
    const newErrors: any = {};
    if (step === 1) {
      if (!formData.name_en.trim())
        newErrors.name_en = "English name is required";
      if (formData.inspector_type === "ICS_MEMBER") {
        if (!formData.email.trim())
          newErrors.email = "Email is required for ICS Members";
        if (!formData.personnel_code.trim())
          newErrors.personnel_code = "Personnel code is required";
      }
    } else if (step === 2) {
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (formData.specialties.length === 0)
        newErrors.specialties = "Select at least one specialty";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast(
        "error",
        "Validation Error",
        "Please fill in all required fields",
      );
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (validateStep(currentStep))
      setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    if (!isAdmin && !formData.resumeFile && !initialData?.resume_url) {
      const confirmed = await confirmDialog({
        title: "Resume Not Selected",
        message:
          "You haven't selected a resume file. Do you want to continue without it?",
        confirmText: "Continue Without Resume",
        cancelText: "Go Back",
        variant: "warning",
      });
      if (!confirmed) return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        status: initialData ? initialData.status : "AVAILABLE",
      };
      await onSave(payload, !!initialData);
      onClose();
    } catch (err: any) {
      showToast("error", "Save Failed", err.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Inspector" : "Add New Inspector"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
        {isAdmin && (
          <div className="mx-2 mb-2 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-center gap-2">
            <span className="text-sm">👑</span>
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Admin Mode — Validation Bypassed
            </span>
          </div>
        )}
        <StepIndicator currentStep={currentStep} isDark={isDark} />
        <div className="flex-1 overflow-y-auto px-1 pr-2">
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-primary">
                    Full Name (English) {!isAdmin && "*"}
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name_en: newName,
                        // 🔧 اگر فایلی انتخاب شده، نام آن را هم به‌روز کن
                        resumeFile: prev.resumeFile ? prev.resumeFile : null,
                        resume_name: prev.resumeFile
                          ? `${newName.trim() || "Inspector"} - CV.${prev.resumeFile.name.split(".").pop()}`
                          : prev.resume_name,
                      }));
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${errors.name_en ? "border-rose-500" : ""}`}
                    placeholder="e.g., John Doe"
                    autoFocus
                  />
                  {errors.name_en && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.name_en}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-primary">
                    Full Name (Persian)
                  </label>
                  <input
                    type="text"
                    value={formData.name_fa}
                    onChange={(e) =>
                      setFormData({ ...formData, name_fa: e.target.value })
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                    placeholder="مثال: جان دو"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-primary">
                  Inspector Type
                </label>
                <div className="flex gap-2">
                  {(["ICS_MEMBER", "FREELANCE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, inspector_type: type })
                      }
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${formData.inspector_type === type ? (type === "ICS_MEMBER" ? "bg-indigo-600 text-white border-indigo-600" : "bg-amber-600 text-white border-amber-600") : isDark ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-600"}`}
                    >
                      {type === "ICS_MEMBER" ? "🏢 ICS Member" : "🎒 Freelance"}
                    </button>
                  ))}
                </div>
              </div>
              {formData.inspector_type === "ICS_MEMBER" && (
                <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-primary flex items-center gap-2 mb-2">
                      🔗 Link to System User{" "}
                      <span className="text-[10px] font-normal text-indigo-600">
                        (Optional)
                      </span>
                    </label>
                    <select
                      value={formData.user_id || ""}
                      onChange={(e) => {
                        const selectedUser = users.find(
                          (u) => u.id === e.target.value,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          user_id: e.target.value,
                          email: selectedUser?.email || prev.email,
                          name_en: selectedUser?.name || prev.name_en,
                        }));
                      }}
                      className="w-full rounded-lg px-3 py-2 text-sm input-themed bg-white dark:bg-slate-900"
                    >
                      <option value="">-- Select a System User --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-primary">
                        Personnel Code {!isAdmin && "*"}
                      </label>
                      <input
                        type="text"
                        value={formData.personnel_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personnel_code: e.target.value,
                          })
                        }
                        className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${errors.personnel_code ? "border-rose-500" : ""}`}
                        placeholder="e.g., EMP-001"
                      />
                      {errors.personnel_code && (
                        <p className="text-[11px] text-rose-600 mt-1">
                          ✕ {errors.personnel_code}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-primary">
                        Email {!isAdmin && "*"}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${errors.email ? "border-rose-500" : ""}`}
                        placeholder="email@company.com"
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 mt-1">
                          ✕ {errors.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {formData.inspector_type === "FREELANCE" && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-primary">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                    placeholder="email@example.com"
                  />
                </div>
              )}
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-xs font-semibold mb-2 text-primary">
                  Specialties {!isAdmin && "*"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES_OPTIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleToggleSpecialty(spec)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.specialties.includes(spec) ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700" : isDark ? "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                    >
                      {formData.specialties.includes(spec) && "✓ "}
                      {spec}
                    </button>
                  ))}
                </div>
                {errors.specialties && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    ✕ {errors.specialties}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-primary">
                    Phone {!isAdmin && "*"}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${errors.phone ? "border-rose-500" : ""}`}
                    placeholder="0912..."
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      ✕ {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-primary">
                    Base Location
                  </label>
                  <input
                    type="text"
                    value={formData.location_base}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location_base: e.target.value,
                      })
                    }
                    className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                    placeholder="e.g., Tehran, Assaluyeh"
                  />
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div
                className={`p-4 rounded-lg border ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}
              >
                <h4 className="text-xs font-bold mb-3 text-primary uppercase tracking-wider">
                  Summary Review
                </h4>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-medium">
                    {formData.name_en || "—"}{" "}
                    {formData.name_fa && `(${formData.name_fa})`}
                  </span>
                  <span className="text-slate-500">Type:</span>
                  <Badge
                    tone={
                      formData.inspector_type === "ICS_MEMBER"
                        ? "indigo"
                        : "amber"
                    }
                    className="w-fit text-[10px]"
                  >
                    {formData.inspector_type === "ICS_MEMBER"
                      ? "ICS Member"
                      : "Freelance"}
                  </Badge>
                  <span className="text-slate-500">Specialties:</span>
                  <span className="font-medium">
                    {formData.specialties.join(", ") || "None"}
                  </span>
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-medium">{formData.phone || "—"}</span>
                  {formData.inspector_type === "ICS_MEMBER" && (
                    <>
                      <span className="text-slate-500">Personnel Code:</span>
                      <span className="font-medium">
                        {formData.personnel_code || "—"}
                      </span>
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium">
                        {formData.email || "—"}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-primary">
                  Resume{" "}
                  <span className="text-[10px] text-amber-600">
                    (PDF or Word, max 5MB)
                  </span>
                </label>
                {!formData.resumeFile && !initialData?.resume_url ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-indigo-500 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-300 bg-slate-50"}`}
                  >
                    <div className="text-4xl mb-2">📄</div>
                    <p
                      className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Click to select resume
                    </p>
                    <p
                      className={`text-[11px] mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                    >
                      Will be uploaded in background
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? "border-emerald-700 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📎</div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          {formData.resume_name || initialData?.resume_name}
                        </p>
                        <p
                          className={`text-[11px] ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                        >
                          {formatFileSize(
                            formData.resume_size ||
                              initialData?.resume_size ||
                              0,
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveResume}
                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex-none flex justify-between items-center pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 z-10">
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
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={(e) => handleNext(e)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Next Step →
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving
                  ? "⏳ Saving..."
                  : initialData
                    ? "💾 Update Inspector"
                    : "✅ Add Inspector"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
