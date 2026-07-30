// src/features/inspector-managment/hooks/useInspectorForm.ts

import { useState, useEffect, useCallback, useRef } from "react";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import type {
  Inspector,
  InspectorType,
  InspectorSpecialty,
} from "../domain/models/Inspector";
import { inspectorAppService } from "../application";
import { useAuth } from "@features/auth/hooks/useAuth";

export function useInspectorForm(
  isOpen: boolean,
  initialData: Inspector | null | undefined,
  isAdmin: boolean,
  onSave: (data: any, isEdit: boolean) => Promise<void>,
  onClose: () => void,
) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const currentEditingUserId = initialData?.user_id || null;
          const availableUsers =
            await inspectorAppService.getAvailableUsersForIcsMember(
              currentEditingUserId,
            );
          let finalUsers = availableUsers;
          if (user?.department) {
            finalUsers = availableUsers.filter(
              (u: any) => u.department === user.department,
            );
          }
          setUsers(finalUsers);
        } catch (err) {
          console.error("Failed to fetch available users", err);
          setUsers([]);
        }
      };
      fetchUsers();

      if (initialData) {
        setFormData({
          name_en: initialData.name_en || "",
          name_fa: initialData.name_fa || "",
          inspector_type: initialData.inspector_type || "ICS_MEMBER",
          specialties: (initialData.specialties || []) as string[],
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
        setFormData({
          name_en: "",
          name_fa: "",
          inspector_type: "ICS_MEMBER",
          specialties: [] as string[],
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
  }, [isOpen, initialData, user?.department]);

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name_en" && prev.resumeFile) {
        const fileExt = prev.resumeFile.name.split(".").pop() || "pdf";
        next.resume_name = `${(value as string).trim() || "Inspector"} - CV.${fileExt}`;
      }
      return next;
    });
  }, []);

  const toggleSpecialty = useCallback((spec: InspectorSpecialty) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
        ? prev.specialties.filter((s) => s !== spec)
        : [...prev.specialties, spec],
    }));
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData((prev) => ({
        ...prev,
        resumeFile: file,
        resume_name: `${inspectorName} - CV.${fileExt}`,
        resume_size: file.size,
      }));
    },
    [formData.name_en],
  );

  const removeResume = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      resumeFile: null,
      resume_name: "",
      resume_size: 0,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const validateStep = useCallback(
    (step: number) => {
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
        if (!formData.phone.trim())
          newErrors.phone = "Phone number is required";
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
    },
    [isAdmin, formData],
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      if (validateStep(currentStep)) {
        setCurrentStep((prev) => (prev < 3 ? prev + 1 : prev));
      }
    },
    [currentStep, validateStep],
  );

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (currentStep !== 3) {
        showToast("warning", "Incomplete", "Please complete all steps first.");
        return;
      }

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

      const payload: any = {
        ...formData,
        status: initialData ? initialData.status : "AVAILABLE",
      };

      if (initialData) {
        const originalUserId = initialData.user_id || null;
        const newUserId = payload.user_id || null;
        if (originalUserId === newUserId) {
          delete payload.user_id;
        }
      }

      try {
        await onSave(payload, !!initialData);

        onClose();
      } catch (err: any) {
        console.error("Save Error Details:", err);
        if (
          err.code === "23505" ||
          err.message?.includes("unique_user_id_for_inspector")
        ) {
          showToast(
            "error",
            "User Already Assigned",
            "This system user is already linked to another inspector profile.",
          );
        } else {
          showToast("error", "Save Failed", err.message || "Failed to save");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [currentStep, isAdmin, formData, initialData, onSave, onClose],
  );

  return {
    currentStep,
    isSaving,
    errors,
    users,
    formData,
    fileInputRef,
    updateField,
    toggleSpecialty,
    handleFileUpload,
    removeResume,
    handleNext,
    handlePrev,
    handleSubmit,
  };
}
