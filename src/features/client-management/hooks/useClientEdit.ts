// src/features/client-management/hooks/useClientEdit.ts

import { useState, useEffect, useCallback } from "react";
import type {
  Client,
  ClientContact,
} from "@/features/client-management/domain/models/Client";
import { validateMobile } from "@shared/lib/validators";
import { showToast } from "@shared/ui/ToastContainer";
import { clientAppService } from "@/features/client-management/application";

interface ClientEditForm {
  name_en: string;
  name_fa: string;
  type: "LEGAL" | "INDIVIDUAL";
  national_id: string;
  phone: string;
  email: string;
  address_en: string;
  address_fa: string;
  abbreviated_name?: string;
  company_type?: string;
  registration_no?: string;
  economic_code?: string;
  contactPersons: ClientContact[];
}

interface FormErrors {
  phone?: string;
  address_en?: string;
  address_fa?: string;
  contactPersons?: string;
}

export function useClientEdit(
  client: Client | null,
  currentDepartment: string,
  onSave: (updatedClient: Client) => void,
  onClose: () => void,
) {
  const [formData, setFormData] = useState<ClientEditForm | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ۱. دریافت داده‌های به‌روز هنگام باز شدن مودال
  useEffect(() => {
    if (client) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const latestClient = await clientAppService.getById(client.id);
          if (latestClient) {
            setFormData({
              name_en: latestClient.name_en,
              name_fa: latestClient.name_fa,
              type: latestClient.type,
              national_id: latestClient.national_id,
              phone: latestClient.phone,
              email: latestClient.email,
              address_en: latestClient.address_en || "",
              address_fa: latestClient.address_fa || "",
              abbreviated_name: (latestClient as any).abbreviated_name,
              company_type: (latestClient as any).company_type,
              registration_no: (latestClient as any).registration_no,
              economic_code: (latestClient as any).economic_code,
              contactPersons: (latestClient.contactPersons || [])
                .filter((cp: any) => cp.department === currentDepartment)
                .map((cp: any) => ({ ...cp })),
            });
            setErrors({});
          } else {
            showToast("error", "Not Found", "Client not found");
            onClose();
          }
        } catch (error) {
          showToast("error", "Load Failed", "Failed to load client data");
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [client?.id, currentDepartment, onClose]);

  // ۲. اعتبارسنجی فرم (Business Logic)
  const validate = useCallback((): FormErrors => {
    if (!formData) return {};
    const newErrors: FormErrors = {};

    if (!formData.phone) {
      newErrors.phone = "Primary phone required";
    } else if (!validateMobile(formData.phone)) {
      newErrors.phone = "Invalid mobile format";
    }

    if (!formData.address_en.trim()) {
      newErrors.address_en = "English address required";
    }
    if (!formData.address_fa.trim()) {
      newErrors.address_fa = "آدرس فارسی الزامی است";
    }

    if (formData.type === "LEGAL") {
      const hasInvalidContact = formData.contactPersons.some(
        (cp) => !cp.name.trim() || !validateMobile(cp.mobile),
      );
      if (hasInvalidContact) {
        newErrors.contactPersons =
          "All contacts must have valid name and mobile";
      }
    }

    return newErrors;
  }, [formData]);

  // ۳. هندلرهای تغییر فیلد
  const setFieldValue = useCallback(
    (field: keyof ClientEditForm, value: any) => {
      setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    },
    [],
  );

  const addContactPerson = useCallback(() => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        contactPersons: [
          ...prev.contactPersons,
          {
            id: `temp_${Date.now()}`,
            name: "",
            position: "",
            mobile: "",
            email: "",
            department: currentDepartment,
          } as ClientContact,
        ],
      };
    });
  }, [currentDepartment]);

  const removeContactPerson = useCallback((id: string) => {
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        contactPersons: prev.contactPersons.filter((cp) => cp.id !== id),
      };
    });
  }, []);

  const updateContactPerson = useCallback(
    (id: string, field: keyof ClientContact, value: string) => {
      setFormData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          contactPersons: prev.contactPersons.map((cp) =>
            cp.id === id ? { ...cp, [field]: value } : cp,
          ),
        };
      });
    },
    [],
  );

  // ۴. ارسال فرم (Submission Logic)
  const handleSubmit = useCallback(async () => {
    if (!formData || !client) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast("error", "Validation Error", "Please fix errors first");
      return;
    }

    setIsSaving(true);
    try {
      let finalContactPersons = formData.contactPersons;
      if (client.type === "LEGAL") {
        const otherDepts = (client.contactPersons || []).filter(
          (cp: any) => cp.department !== currentDepartment,
        );
        finalContactPersons = [
          ...otherDepts,
          ...formData.contactPersons.map((cp) => ({
            ...cp,
            department: currentDepartment,
          })),
        ];
      }

      const payload: Partial<Client> = {
        ...client,
        address_en: formData.address_en,
        address_fa: formData.address_fa,
        email: formData.email,
        emails: formData.email ? [formData.email] : [],
        phone: formData.phone,
        contactPersons: finalContactPersons,
        contacts: finalContactPersons.length,
      };

      const savedClient = await clientAppService.update(client.id, payload);
      showToast("success", "Updated", "Client updated successfully");
      onSave(savedClient);
      onClose();
    } catch (err: any) {
      showToast(
        "error",
        "Save Failed",
        err.message || "Failed to update client",
      );
    } finally {
      setIsSaving(false);
    }
  }, [formData, client, currentDepartment, validate, onSave, onClose]);

  return {
    formData,
    errors,
    isLoading,
    isSaving,
    setFieldValue,
    addContactPerson,
    removeContactPerson,
    updateContactPerson,
    handleSubmit,
  };
}
