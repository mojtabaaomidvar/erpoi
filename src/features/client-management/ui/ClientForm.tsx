// src/features/client-management/ui/ClientForm.tsx

import { useCallback, useState, useEffect, useMemo } from "react";
import { Button } from "@design-system";
import { Modal } from "@shared/ui/Modal";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Client } from "@/types/client";
import {
  validateNationalCode,
  validateNationalId,
  validateMobile,
} from "@shared/lib/validators";
import { showToast } from "@shared/ui/ToastContainer";
import { clientService } from "../services/ClientService";
import { DuplicateWarningModal } from "./DuplicateWarningModal";

import { supabase } from "@shared/database/supabase";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  clients: Client[];
  currentDepartment: string;
  departments: { id: string; name: string }[];
  mode?: "add" | "edit";
  initialData?: Partial<Client>;
}

export function ClientForm({
  isOpen,
  onClose,
  onSave,
  clients,
  currentDepartment,
  departments,
  mode = "add",
  initialData,
}: ClientFormProps) {
  const { isDark } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [addForm, setAddForm] = useState({
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

  const [addErrors, setAddErrors] = useState<any>({});
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<any>(null);
  const [existingClient, setExistingClient] = useState<any>(null);
  const [isSameDepartmentDuplicate, setIsSameDepartmentDuplicate] =
    useState(false);

  const loadClientFromSupabase = async (clientId: string) => {
    setIsLoading(true);
    try {
      const client = await clientService.getById(clientId);
      if (client) {
        setAddForm({
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

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData?.id)
        loadClientFromSupabase(initialData.id);
      else
        setAddForm({
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
      setAddErrors({});
      setShowDuplicateModal(false);
      setDuplicateClient(null);
      setExistingClient(null);
    }
  }, [isOpen, mode, initialData?.id]);

  const isFormValid = useMemo(() => {
    const isIndividual = !addForm.company_type;
    const isLegal = !!addForm.company_type;
    const hasBasic =
      addForm.name_en.trim().length >= 3 &&
      addForm.name_fa.trim().length >= 3 &&
      addForm.address_fa.trim().length >= 5;
    const hasValidNationalId = isLegal
      ? validateNationalId(addForm.national_id)
      : validateNationalCode(addForm.national_id);
    const hasValidPhone = validateMobile(addForm.primary_phone);
    if (isIndividual) return hasBasic && hasValidNationalId && hasValidPhone;
    if (isLegal) {
      const hasLegalFields =
        addForm.registration_no.trim().length > 0 &&
        addForm.economic_code.trim().length > 0;
      const hasValidContact = addForm.contactPersons.some(
        (cp) => cp.name.trim().length >= 3 && validateMobile(cp.mobile),
      );
      return (
        hasBasic &&
        hasValidNationalId &&
        hasValidPhone &&
        hasLegalFields &&
        hasValidContact
      );
    }
    return false;
  }, [addForm]);

  const validateAddForm = () => {
    const errors: any = {};
    if (!addForm.name_en.trim()) errors.name_en = "English name required";
    if (!addForm.name_fa.trim()) errors.name_fa = "نام فارسی الزامی است";
    if (!addForm.national_id) errors.national_id = "National ID/Code required";
    else if (addForm.company_type && !validateNationalId(addForm.national_id))
      errors.national_id = "Must be exactly 11 digits";
    else if (
      !addForm.company_type &&
      !validateNationalCode(addForm.national_id)
    )
      errors.national_id = "Invalid national code (10 digits)";
    if (addForm.company_type && !addForm.registration_no)
      errors.registration_no = "Registration number required";
    if (addForm.company_type && !addForm.economic_code)
      errors.economic_code = "Economic code required";
    if (!addForm.primary_phone) errors.primary_phone = "Primary phone required";
    else if (!validateMobile(addForm.primary_phone))
      errors.primary_phone = "Invalid mobile format";
    if (!addForm.address_fa.trim()) errors.address_fa = "آدرس فارسی الزامی است";
    if (
      addForm.company_type &&
      !addForm.contactPersons.some(
        (cp) => cp.name.trim().length >= 3 && validateMobile(cp.mobile),
      )
    ) {
      errors.contactPersons =
        "At least one valid contact person (Name + Mobile) is required";
    }
    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCloseAll = useCallback(() => {
    setShowDuplicateModal(false);
    setDuplicateClient(null);
    setExistingClient(null);
    setIsSameDepartmentDuplicate(false);
    onClose(); // بستن مودال اصلی ClientForm
  }, [onClose]);

  // بررسی تکراری بودن مستقیماً از دیتابیس با کوئری ایمن‌تر

  const handleSaveClick = async () => {
    if (!validateAddForm()) return;

    const cleanNationalId = addForm.national_id.trim();
    console.log(
      "[ClientForm] 🔍 Checking for duplicate national_id:",
      cleanNationalId,
    );

    // 🔧 استفاده از نام‌های صحیح دیتابیس (snake_case)
    let query = supabase
      .from("clients")
      .select(
        "id, name_en, name_fa, type, national_id, departments, contact_persons, emails",
      )
      .eq("national_id", cleanNationalId);

    if (mode === "edit" && initialData?.id) {
      query = query.neq("id", initialData.id);
    }

    const { data: existingRecords, error } = await query;

    if (error) {
      console.error("[ClientForm] ❌ Supabase duplicate check error:", error);
      showToast(
        "error",
        "Check Failed",
        `Could not verify client uniqueness: ${error.message}`,
      );
      return;
    }

    console.log(
      "[ClientForm] 📊 Query result (existing records):",
      existingRecords,
    );

    if (existingRecords && existingRecords.length > 0 && mode === "add") {
      const foundClient = existingRecords[0];

      // بررسی آیا مشتری در همان واحد کاربر وجود دارد
      const clientDepartments = foundClient.departments || [];
      const isSameDept = clientDepartments.includes(currentDepartment);
      setIsSameDepartmentDuplicate(isSameDept);

      const clientWithCamelCase = {
        ...foundClient,
        contactPersons: foundClient.contact_persons || [],
      };

      const resolvedDeptNames = (clientWithCamelCase.departments || []).map(
        (deptId: string) => {
          const dept = departments.find((d) => d.id === deptId);
          return dept ? dept.name : deptId;
        },
      );

      setExistingClient(clientWithCamelCase);
      setDuplicateClient({
        ...clientWithCamelCase,
        _resolvedDepartmentNames: resolvedDeptNames,
      });
      setShowDuplicateModal(true);
      return;
    }

    await performSave();
  };

  // جلوگیری مطلق از بازنویسی (Overwrite) اطلاعات اصلی
  const performSave = async (mergedContactData?: any) => {
    setIsSaving(true);
    try {
      if (existingClient && mode === "add") {
        console.log(
          "[ClientForm] 🔗 Linking existing client to department:",
          existingClient.id,
        );

        const updatedDepartments = [
          ...new Set([
            ...(existingClient.departments || []),
            currentDepartment,
          ]),
        ];

        // 🔧 ساخت payload با نام‌های صحیح دیتابیس
        const updatePayload: any = {
          departments: updatedDepartments,
        };

        if (existingClient.type === "LEGAL" && mergedContactData) {
          const existingContacts = existingClient.contactPersons || [];
          const isDuplicateMobile = existingContacts.some(
            (cp: any) => cp.mobile === mergedContactData.mobile,
          );

          if (!isDuplicateMobile) {
            const updatedContacts = [...existingContacts, mergedContactData];
            // 🔧 استفاده از نام صحیح دیتابیس
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

        if (existingClient.type === "INDIVIDUAL" && addForm.email_inbox) {
          const existingEmails = existingClient.emails || [];
          if (!existingEmails.includes(addForm.email_inbox)) {
            updatePayload.emails = [...existingEmails, addForm.email_inbox];
            updatePayload.email = addForm.email_inbox;
          }
        }

        console.log("[ClientForm] 📤 Update payload:", updatePayload);

        const { error: updateError } = await supabase
          .from("clients")
          .update(updatePayload)
          .eq("id", existingClient.id);

        if (updateError) {
          console.error("[ClientForm] ❌ Update error:", updateError);
          throw updateError;
        }

        showToast(
          "success",
          "Linked",
          `Client successfully linked to your department`,
        );

        setExistingClient(null);
        setDuplicateClient(null);
        setShowDuplicateModal(false);

        onSave({ ...existingClient, ...updatePayload });
        onClose();
        return;
      }

      // سناریو ساخت یا ویرایش عادی
      const clientData: any = {
        type: addForm.company_type ? "LEGAL" : "INDIVIDUAL",
        name_en: addForm.name_en,
        name_fa: addForm.name_fa,
        national_id: addForm.national_id,
        logo_color: initialData?.logoColor || "from-indigo-500 to-violet-600",
        email: addForm.email_inbox,
        emails: addForm.email_inbox ? [addForm.email_inbox] : [],
        phone: addForm.primary_phone,
        address_en: addForm.address_en,
        address_fa: addForm.address_fa,
        departments: initialData?.departments
          ? [...new Set([...initialData.departments, currentDepartment])]
          : [currentDepartment],
      };

      if (addForm.company_type) {
        clientData.company_type = addForm.company_type;
        clientData.registration_no = addForm.registration_no;
        clientData.economic_code = addForm.economic_code;
        clientData.abbreviated_name = addForm.abbreviated_name;

        const existingContacts =
          initialData?.contactPersons?.filter(
            (cp: any) => cp.department !== currentDepartment,
          ) || [];
        const newContacts = addForm.contactPersons
          .filter((cp) => cp.name.trim())
          .map((cp) => ({ ...cp, department: currentDepartment }));

        if (mergedContactData) newContacts.push(mergedContactData);

        // 🔧 استفاده از نام صحیح دیتابیس
        clientData.contact_persons = [...existingContacts, ...newContacts];
        clientData.contacts = clientData.contact_persons.length;
      }

      let savedClient: Client;
      if (mode === "edit" && initialData?.id) {
        savedClient = await clientService.update(initialData.id, clientData);
        showToast("success", "Updated", "Client updated successfully");
      } else {
        savedClient = await clientService.create(clientData);
        showToast("success", "Created", "Client created successfully");
      }

      onSave(savedClient);
      onClose();
    } catch (error: any) {
      console.error("[ClientForm] Save failed:", error);
      showToast(
        "error",
        "Save Failed",
        error.message || "Failed to save client",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addContactPerson = () =>
    setAddForm({
      ...addForm,
      contactPersons: [
        ...addForm.contactPersons,
        {
          id: Date.now().toString(),
          name: "",
          position: "",
          mobile: "",
          email: "",
        },
      ],
    });
  const removeContactPerson = (id: string) =>
    setAddForm({
      ...addForm,
      contactPersons: addForm.contactPersons.filter((cp) => cp.id !== id),
    });
  const updateContactPerson = (id: string, field: string, value: string) =>
    setAddForm({
      ...addForm,
      contactPersons: addForm.contactPersons.map((cp) =>
        cp.id === id ? { ...cp, [field]: value } : cp,
      ),
    });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={mode === "add" ? "🏢 Entity Onboarding" : "✏️ Edit Client"}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={!isFormValid || isSaving}
              className="min-w-[100px]"
            >
              {isSaving
                ? "⏳ Saving..."
                : `💾 ${mode === "add" ? "Save" : "Update"}`}
            </Button>
          </div>
        }
      >
        {/* ... محتوای فرم دقیقاً مانند قبل بدون تغییر ... */}
        <div className="flex flex-col max-h-[80vh]">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 py-8">
              <div className="text-center">
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Loading data...
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* Type Selector */}
              <div
                className={`flex gap-1 p-1 rounded-lg border w-fit ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"}`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setAddForm({
                      ...addForm,
                      company_type: "Private Joint Stock",
                    })
                  }
                  disabled={mode === "edit"}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${addForm.company_type ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"} ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  🏢 LEGAL
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm({ ...addForm, company_type: "" })}
                  disabled={mode === "edit"}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${!addForm.company_type ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"} ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  👤 INDIVIDUAL
                </button>
              </div>

              {/* Basic Identity */}
              <div
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <h2
                  className={`text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  🌐 Basic Identity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Full Name (English) *
                    </label>
                    <input
                      value={addForm.name_en}
                      onChange={(e) =>
                        setAddForm({ ...addForm, name_en: e.target.value })
                      }
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${addErrors.name_en ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {addErrors.name_en && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {addErrors.name_en}
                      </p>
                    )}
                  </div>
                  <div dir="rtl">
                    <label
                      className={`mb-1 block text-[11px] font-semibold text-left ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Full Name (Farsi) *
                    </label>
                    <input
                      value={addForm.name_fa}
                      onChange={(e) =>
                        setAddForm({ ...addForm, name_fa: e.target.value })
                      }
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm text-right focus:outline-none focus:ring-1 transition-all ${addErrors.name_fa ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {addErrors.name_fa && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600 text-left">
                        ✕ {addErrors.name_fa}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {addForm.company_type
                        ? "National ID (11 digits) *"
                        : "National Code (10 digits) *"}
                    </label>
                    <input
                      value={addForm.national_id}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          national_id: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      maxLength={addForm.company_type ? 11 : 10}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${addErrors.national_id ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {addErrors.national_id && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {addErrors.national_id}
                      </p>
                    )}
                  </div>

                  {addForm.company_type && (
                    <>
                      <div>
                        <label
                          className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Registration Number *
                        </label>
                        <input
                          value={addForm.registration_no}
                          onChange={(e) =>
                            setAddForm({
                              ...addForm,
                              registration_no: e.target.value,
                            })
                          }
                          className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${addErrors.registration_no ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                        />
                        {addErrors.registration_no && (
                          <p className="mt-1 text-[10px] font-medium text-rose-600">
                            ✕ {addErrors.registration_no}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Economic Code *
                        </label>
                        <input
                          value={addForm.economic_code}
                          onChange={(e) =>
                            setAddForm({
                              ...addForm,
                              economic_code: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${addErrors.economic_code ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                        />
                        {addErrors.economic_code && (
                          <p className="mt-1 text-[10px] font-medium text-rose-600">
                            ✕ {addErrors.economic_code}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Abbreviated Name
                        </label>
                        <input
                          value={addForm.abbreviated_name}
                          onChange={(e) =>
                            setAddForm({
                              ...addForm,
                              abbreviated_name: e.target.value,
                            })
                          }
                          className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contact Hub */}
              <div
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <h2
                  className={`text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  📞 Contact Hub
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Primary Phone *
                    </label>
                    <input
                      value={addForm.primary_phone}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          primary_phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      maxLength={11}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${addErrors.primary_phone ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {addErrors.primary_phone && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {addErrors.primary_phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Email Inbox
                    </label>
                    <input
                      type="email"
                      value={addForm.email_inbox}
                      onChange={(e) =>
                        setAddForm({ ...addForm, email_inbox: e.target.value })
                      }
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Official Address */}
              <div
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <h2
                  className={`text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  🏠 Official Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Address (English)
                    </label>
                    <textarea
                      value={addForm.address_en}
                      onChange={(e) =>
                        setAddForm({ ...addForm, address_en: e.target.value })
                      }
                      rows={2}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                  </div>
                  <div dir="rtl">
                    <label
                      className={`mb-1 block text-[11px] font-semibold text-left ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Address (Farsi) *
                    </label>
                    <textarea
                      value={addForm.address_fa}
                      onChange={(e) =>
                        setAddForm({ ...addForm, address_fa: e.target.value })
                      }
                      rows={2}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm text-right focus:outline-none focus:ring-1 transition-all ${addErrors.address_fa ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {addErrors.address_fa && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600 text-left">
                        ✕ {addErrors.address_fa}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Persons (Legal only) */}
              {addForm.company_type && (
                <div
                  className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2
                      className={`text-xs font-bold flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                    >
                      👥 Contact Persons{" "}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                      >
                        {addForm.contactPersons.length}
                      </span>
                    </h2>
                    <button
                      type="button"
                      onClick={addContactPerson}
                      className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      + ADD LIAISON
                    </button>
                  </div>
                  {addErrors.contactPersons && (
                    <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                      ✕ {addErrors.contactPersons}
                    </div>
                  )}
                  <div className="space-y-2">
                    {addForm.contactPersons.map((cp) => (
                      <div
                        key={cp.id}
                        className={`grid grid-cols-12 gap-2 p-3 rounded-lg border transition-all ${isDark ? "border-slate-700 bg-slate-900/50 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <label
                            className={`mb-0.5 block text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Name *
                          </label>
                          <input
                            value={cp.name}
                            onChange={(e) =>
                              updateContactPerson(cp.id, "name", e.target.value)
                            }
                            className={`w-full rounded border px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-slate-50"}`}
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          <label
                            className={`mb-0.5 block text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Position
                          </label>
                          <input
                            value={cp.position}
                            onChange={(e) =>
                              updateContactPerson(
                                cp.id,
                                "position",
                                e.target.value,
                              )
                            }
                            className={`w-full rounded border px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-slate-50"}`}
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          <label
                            className={`mb-0.5 block text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                          >
                            Mobile *
                          </label>
                          <input
                            value={cp.mobile}
                            onChange={(e) =>
                              updateContactPerson(
                                cp.id,
                                "mobile",
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                            className={`w-full rounded border px-2 py-1 text-xs font-mono focus:border-indigo-500 focus:outline-none ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-slate-50"}`}
                          />
                        </div>
                        <div className="col-span-12 sm:col-span-2 flex items-end gap-1">
                          <div className="flex-1">
                            <label
                              className={`mb-0.5 block text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              Email
                            </label>
                            <input
                              value={cp.email}
                              onChange={(e) =>
                                updateContactPerson(
                                  cp.id,
                                  "email",
                                  e.target.value,
                                )
                              }
                              className={`w-full rounded border px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-slate-50"}`}
                            />
                          </div>
                          {addForm.contactPersons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeContactPerson(cp.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors mb-0.5"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 🔧 مودال هشدار تکراری */}
      {showDuplicateModal && duplicateClient && (
        <DuplicateWarningModal
          isOpen={showDuplicateModal}
          onClose={handleCloseAll}
          onSaveContact={(newContact) => performSave(newContact)}
          duplicateClient={duplicateClient}
          currentDepartment={currentDepartment}
          isSameDepartmentDuplicate={isSameDepartmentDuplicate}
        />
      )}
    </>
  );
}
