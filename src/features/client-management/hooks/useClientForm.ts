// src/features/client-management/hooks/useClientForm.ts

import { useState, useEffect, useCallback } from "react";
import type { Client } from "@/features/client-management/domain/models/Client";
import {
  validateNationalCode,
  validateNationalId,
  validateMobile,
} from "@shared/lib/validators";
import { showToast } from "@shared/ui/ToastContainer";
import { clientAppService } from "@/features/client-management/application";

interface ContactPerson {
  id: string;
  name: string;
  position: string;
  mobile: string;
  email: string;
  department?: string;
}

interface ClientFormData {
  name_en: string;
  name_fa: string;
  abbreviated_name: string;
  company_type: string; // خالی باشد یعنی INDIVIDUAL
  national_id: string;
  economic_code: string;
  registration_no: string;
  address_en: string;
  address_fa: string;
  primary_phone: string;
  email_inbox: string;
  contactPersons: ContactPerson[];
}

interface FormErrors {
  name_en?: string;
  name_fa?: string;
  national_id?: string;
  registration_no?: string;
  economic_code?: string;
  primary_phone?: string;
  address_fa?: string;
  contactPersons?: string;
}

interface DuplicateInfo {
  client: any;
  isSameDepartment: boolean;
  resolvedDeptNames: string[];
}

export function useClientForm(
  isOpen: boolean,
  mode: "add" | "edit",
  initialData: Partial<Client> | undefined,
  currentDepartment: string,
  departments: { id: string; name: string }[],
  onClose: () => void,
  onSave: (client: Client) => void,
) {
  const [formData, setFormData] = useState<ClientFormData>({
    name_en: "",
    name_fa: "",
    abbreviated_name: "",
    company_type: "Private Joint Stock",
    national_id: "",
    economic_code: "",
    registration_no: "",
    address_en: "",
    address_fa: "",
    primary_phone: "",
    email_inbox: "",
    contactPersons: [
      { id: "1", name: "", position: "", mobile: "", email: "" },
    ],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(
    null,
  );

  const loadClientData = async (clientId: string) => {
    setIsLoading(true);
    try {
      const client = await clientAppService.getById(clientId);
      if (client) {
        setFormData({
          name_en: client.name_en || "",
          name_fa: client.name_fa || "",
          abbreviated_name: client.abbreviated_name || "",
          company_type:
            client.type === "LEGAL"
              ? client.company_type || "Private Joint Stock"
              : "",
          national_id: client.national_id || "",
          economic_code: client.economic_code || "",
          registration_no: client.registration_no || "",
          address_en: client.address_en || "",
          address_fa: client.address_fa || "",
          primary_phone: client.phone || "",
          email_inbox: client.email || "",
          contactPersons: client.contactPersons?.length
            ? client.contactPersons.map((cp) => ({
                id: cp.id,
                name: cp.name,
                position: cp.position || "",
                mobile: cp.mobile,
                email: cp.email || "",
              }))
            : [{ id: "1", name: "", position: "", mobile: "", email: "" }],
        });
      }
    } catch (error) {
      showToast("error", "Load Failed", "Failed to load client data");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: "",
      name_fa: "",
      abbreviated_name: "",
      company_type: "Private Joint Stock",
      national_id: "",
      economic_code: "",
      registration_no: "",
      address_en: "",
      address_fa: "",
      primary_phone: "",
      email_inbox: "",
      contactPersons: [
        { id: "1", name: "", position: "", mobile: "", email: "" },
      ],
    });
  };

  //  مدیریت باز و بسته شدن و لود داده‌ها
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData?.id) {
        loadClientData(initialData.id);
      } else {
        resetForm();
      }
      setErrors({});
      setShowDuplicateModal(false);
      setDuplicateInfo(null);
    }
  }, [isOpen, mode, initialData?.id]);

  // ۲. اعتبارسنجی (Business Logic)
  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const isLegal = !!formData.company_type;

    if (!formData.name_en.trim()) newErrors.name_en = "English name required";
    if (!formData.name_fa.trim()) newErrors.name_fa = "نام فارسی الزامی است";

    if (!formData.national_id) {
      newErrors.national_id = "National ID/Code required";
    } else if (isLegal && !validateNationalId(formData.national_id)) {
      newErrors.national_id = "Must be exactly 11 digits";
    } else if (!isLegal && !validateNationalCode(formData.national_id)) {
      newErrors.national_id = "Invalid national code (10 digits)";
    }

    if (isLegal && !formData.registration_no)
      newErrors.registration_no = "Registration number required";
    if (isLegal && !formData.economic_code)
      newErrors.economic_code = "Economic code required";

    if (!formData.primary_phone) {
      newErrors.primary_phone = "Primary phone required";
    } else if (!validateMobile(formData.primary_phone)) {
      newErrors.primary_phone = "Invalid mobile format";
    }

    if (!formData.address_fa.trim())
      newErrors.address_fa = "آدرس فارسی الزامی است";

    if (
      isLegal &&
      !formData.contactPersons.some(
        (cp) => cp.name.trim().length >= 3 && validateMobile(cp.mobile),
      )
    ) {
      newErrors.contactPersons =
        "At least one valid contact person (Name + Mobile) is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // ۳. هندلرهای فرم
  const handleChange = (field: keyof ClientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addContactPerson = () => {
    setFormData((prev) => ({
      ...prev,
      contactPersons: [
        ...prev.contactPersons,
        {
          id: Date.now().toString(),
          name: "",
          position: "",
          mobile: "",
          email: "",
        },
      ],
    }));
  };

  const removeContactPerson = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contactPersons: prev.contactPersons.filter((cp) => cp.id !== id),
    }));
  };

  const updateContactPerson = (
    id: string,
    field: keyof ContactPerson,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      contactPersons: prev.contactPersons.map((cp) =>
        cp.id === id ? { ...cp, [field]: value } : cp,
      ),
    }));
  };

  // ۴. منطق ذخیره‌سازی و بررسی تکراری بودن
  const handleSaveClick = async () => {
    if (!validate()) return;

    const cleanNationalId = formData.national_id.trim();

    try {
      const existingRecord = await clientAppService.checkDuplicate(
        cleanNationalId,
        mode === "edit" ? initialData?.id : undefined,
      );

      if (existingRecord && mode === "add") {
        const clientDepartments = existingRecord.departments || [];
        const isSameDept = clientDepartments.includes(currentDepartment);

        const resolvedDeptNames = (existingRecord.departments || []).map(
          (deptId: string) => {
            const dept = departments.find((d) => d.id === deptId);
            return dept ? dept.name : deptId;
          },
        );

        setDuplicateInfo({
          client: {
            ...existingRecord,
            contactPersons: existingRecord.contact_persons || [],
          },
          isSameDepartment: isSameDept,
          resolvedDeptNames,
        });
        setShowDuplicateModal(true);
        return;
      }

      await performSave();
    } catch (error: any) {
      showToast(
        "error",
        "Check Failed",
        `Could not verify client uniqueness: ${error.message}`,
      );
    }
  };

  const performSave = async (mergedContactData?: ContactPerson) => {
    setIsSaving(true);
    try {
      // سناریو ۱: لینک کردن مشتری موجود به دپارتمان جدید
      if (duplicateInfo?.client && mode === "add") {
        const existing = duplicateInfo.client;
        const updatedDepartments = [
          ...new Set([...(existing.departments || []), currentDepartment]),
        ];
        const updatePayload: any = { departments: updatedDepartments };

        if (existing.type === "LEGAL" && mergedContactData) {
          const existingContacts = existing.contactPersons || [];
          const isDuplicateMobile = existingContacts.some(
            (cp: any) => cp.mobile === mergedContactData.mobile,
          );

          if (!isDuplicateMobile) {
            const updatedContacts = [
              ...existingContacts,
              { ...mergedContactData, department: currentDepartment },
            ];
            updatePayload.contact_persons = updatedContacts;
            updatePayload.contacts = updatedContacts.length;
          } else {
            showToast(
              "warning",
              "Duplicate Contact",
              "A contact with this mobile already exists for this client",
            );
            setIsSaving(false);
            return;
          }
        }

        if (existing.type === "INDIVIDUAL" && formData.email_inbox) {
          const existingEmails = existing.emails || [];
          if (!existingEmails.includes(formData.email_inbox)) {
            updatePayload.emails = [...existingEmails, formData.email_inbox];
            updatePayload.email = formData.email_inbox;
          }
        }

        await clientAppService.update(existing.id, updatePayload);
        showToast(
          "success",
          "Linked",
          "Client successfully linked to your department",
        );

        // بازسازی آبجکت برای پاس دادن به onSave
        const updatedClient = {
          ...existing,
          ...updatePayload,
          contactPersons:
            updatePayload.contact_persons || existing.contactPersons,
        };
        onSave(updatedClient);
        handleCloseAll();
        return;
      }

      // سناریو ۲: ساخت جدید یا ویرایش عادی
      const clientData: any = {
        type: formData.company_type ? "LEGAL" : "INDIVIDUAL",
        name_en: formData.name_en,
        name_fa: formData.name_fa,
        national_id: formData.national_id,
        logo_color: initialData?.logoColor || "from-indigo-500 to-violet-600",
        email: formData.email_inbox,
        emails: formData.email_inbox ? [formData.email_inbox] : [],
        phone: formData.primary_phone,
        address_en: formData.address_en,
        address_fa: formData.address_fa,
        departments: initialData?.departments
          ? [...new Set([...initialData.departments, currentDepartment])]
          : [currentDepartment],
      };

      if (formData.company_type) {
        clientData.company_type = formData.company_type;
        clientData.registration_no = formData.registration_no;
        clientData.economic_code = formData.economic_code;
        clientData.abbreviated_name = formData.abbreviated_name;

        const existingContacts =
          (initialData?.contactPersons?.filter(
            (cp: any) => cp.department !== currentDepartment,
          ) as ContactPerson[]) || [];
        const newContacts = formData.contactPersons
          .filter((cp) => cp.name.trim())
          .map((cp) => ({ ...cp, department: currentDepartment }));

        if (mergedContactData)
          newContacts.push({
            ...mergedContactData,
            department: currentDepartment,
          });

        clientData.contact_persons = [...existingContacts, ...newContacts];
        clientData.contacts = clientData.contact_persons.length;
      }

      let savedClient: Client;
      if (mode === "edit" && initialData?.id) {
        savedClient = await clientAppService.update(initialData.id, clientData);
        showToast("success", "Updated", "Client updated successfully");
      } else {
        savedClient = await clientAppService.create(clientData);
        showToast("success", "Created", "Client created successfully");
      }

      onSave(savedClient);
      onClose();
    } catch (error: any) {
      console.error("[useClientForm] Save failed:", error);
      showToast(
        "error",
        "Save Failed",
        error.message || "Failed to save client",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAll = () => {
    setShowDuplicateModal(false);
    setDuplicateInfo(null);
    onClose();
  };

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    showDuplicateModal,
    duplicateInfo,
    handleChange,
    addContactPerson,
    removeContactPerson,
    updateContactPerson,
    handleSaveClick,
    performSave,
    handleCloseAll,
  };
}
