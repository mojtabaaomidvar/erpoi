// src/features/client-management/hooks/useDuplicateWarning.ts

import { useState, useEffect, useCallback } from "react";
import { validateMobile } from "@shared/lib/validators";
import type { NewContactPerson, DuplicateClientInfo } from "../domain/models/Client";

interface ContactErrors {
  name: boolean;
  mobile: boolean;
}

export function useDuplicateWarning(
  isOpen: boolean,
  duplicateClient: DuplicateClientInfo | null,
  isLegal: boolean,
  currentDepartment: string,
  onSaveContact: (contact: NewContactPerson | null) => void,
  onClose: () => void
) {
  const [newContact, setNewContact] = useState<NewContactPerson>({
    name: "",
    position: "",
    mobile: "",
    email: "",
  });
  const [contactErrors, setContactErrors] = useState<ContactErrors>({
    name: false,
    mobile: false,
  });

  // ریست فرم هنگام باز شدن
  useEffect(() => {
    if (isOpen) {
      setNewContact({ name: "", position: "", mobile: "", email: "" });
      setContactErrors({ name: false, mobile: false });
    }
  }, [isOpen]);

  const setContactField = useCallback((field: keyof NewContactPerson, value: string) => {
    setNewContact((prev) => ({ ...prev, [field]: value }));
    setContactErrors((prev) => ({ ...prev, [field]: false }));
  }, []);

  const validate = useCallback((): boolean => {
    if (!isLegal) return true;

    const errors: ContactErrors = {
      name: !newContact.name.trim(),
      mobile: !validateMobile(newContact.mobile),
    };

    setContactErrors(errors);
    return !errors.name && !errors.mobile;
  }, [isLegal, newContact]);

  const handleConfirm = useCallback(() => {
    if (!validate()) return;

    if (isLegal) {
      onSaveContact({
        ...newContact,
        id: Date.now().toString(),
        department: currentDepartment,
      } as any);
    } else {
      onSaveContact(null);
    }
    onClose();
  }, [validate, isLegal, newContact, currentDepartment, onSaveContact, onClose]);

  return {
    newContact,
    contactErrors,
    setContactField,
    handleConfirm,
  };
}