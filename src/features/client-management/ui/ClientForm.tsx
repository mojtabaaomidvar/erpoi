// src/features/client-management/ui/ClientForm.tsx

import { useState, useEffect } from "react";
import { Button, Badge } from "@design-system";
import { Modal } from "@shared/ui/Modal"; // 🔧 FIX: حذف ModalFooter
import { useTheme } from "@app/providers/ThemeProvider";
import type { Client } from "@/types/contract";
import {
  validateNationalCode,
  validateNationalId,
  validateMobile,
} from "@shared/lib/validators";
import { usePermission } from "@shared/authorization/hooks/usePermission";
import { showToast } from "@shared/ui/ToastContainer";
import { clientService } from "../services/ClientService";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: any) => void;
  clients: Client[];
  currentDepartment: string;
  mode?: "add" | "edit";
  initialData?: Partial<Client>;
  onDuplicateWarning?: React.Dispatch<
    React.SetStateAction<{
      field: string;
      client: any;
      message: string;
    } | null>
  >;
}

export function ClientForm({
  isOpen,
  onClose,
  onSave,
  clients,
  currentDepartment,
  mode = "add",
  initialData,
}: ClientFormProps) {
  const { isDark } = useTheme();
  const { can } = usePermission();
  const canCreate = can("client:create");
  const canUpdate = can("client:update");
  const hasPermission = mode === "add" ? canCreate : canUpdate;

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
    category: "OIL_GAS" as const,
    contactPersons: [
      { id: "1", name: "", position: "", mobile: "", email: "" },
    ],
  });

  const [addErrors, setAddErrors] = useState<any>({});
  const [duplicateWarning, setDuplicateWarning] = useState<{
    field: string;
    client: any;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && !hasPermission) {
      showToast(
        "error",
        "Access Denied",
        `You do not have permission to ${mode === "add" ? "create" : "edit"} clients`,
      );
      onClose();
    }
  }, [isOpen, hasPermission, mode, onClose]);

  const loadClientFromSupabase = async (clientId: string) => {
    setIsLoading(true);
    try {
      console.log("[ClientForm] 📥 Loading client from Supabase:", clientId);
      const client = await clientService.getById(clientId);

      if (client) {
        console.log("[ClientForm] ✅ Client loaded:", client);
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
          category: (client.category as "OIL_GAS" | undefined) || "OIL_GAS",
          contactPersons:
            client.contactPersons && client.contactPersons.length > 0
              ? client.contactPersons.map((cp) => ({
                  id: cp.id,
                  name: cp.name,
                  position: cp.position || "",
                  mobile: cp.mobile,
                  email: cp.email || "",
                }))
              : [{ id: "1", name: "", position: "", mobile: "", email: "" }],
        });
      } else {
        showToast("error", "Not Found", "Client not found in database");
      }
    } catch (error) {
      console.error("[ClientForm] ❌ Failed to load client:", error);
      showToast("error", "Load Failed", "Failed to load client data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && hasPermission) {
      if (mode === "edit" && initialData?.id) {
        loadClientFromSupabase(initialData.id);
      } else {
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
          category: "OIL_GAS",
          contactPersons: [
            { id: "1", name: "", position: "", mobile: "", email: "" },
          ],
        });
      }
      setAddErrors({});
      setDuplicateWarning(null);
    }
  }, [isOpen, hasPermission, mode, initialData?.id]);

  useEffect(() => {
    if (!isOpen || mode === "edit") return;

    const timer = setTimeout(() => {
      let found: any = null;
      let field = "";
      const normalize = (str: string) =>
        str.toLowerCase().replace(/\s+/g, "").trim();

      if (addForm.name_en.trim().length >= 3) {
        found = clients.find(
          (c) => normalize(c.name_en) === normalize(addForm.name_en),
        );
        if (found) field = "name_en";
      }

      if (!found && addForm.national_id && addForm.national_id.length >= 10) {
        found = clients.find(
          (c) => c.national_id && c.national_id === addForm.national_id,
        );
        if (found) field = "national_id";
      }

      if (!found && addForm.company_type && addForm.registration_no.trim()) {
        found = clients.find(
          (c) => (c as any).registration_no === addForm.registration_no,
        );
        if (found) field = "registration_no";
      }

      if (found) {
        const dept = (found as any).departments?.[0] || "Unknown";
        const totalContacts = (found as any).contactPersons?.length || 0;
        setDuplicateWarning({
          field,
          client: found,
          message: `⚠️ This client already exists in ${dept}. Total contacts: ${totalContacts}`,
        });
      } else {
        setDuplicateWarning(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [
    addForm.national_id,
    addForm.name_en,
    addForm.registration_no,
    clients,
    addForm.company_type,
    isOpen,
    mode,
  ]);

  const validateAddForm = () => {
    const errors: any = {};
    if (!addForm.name_en.trim()) errors.name_en = "English name is required";
    if (!addForm.name_fa.trim()) errors.name_fa = "نام فارسی الزامی است";
    if (!addForm.national_id)
      errors.national_id = "National ID/Code is required";
    else if (addForm.company_type && !validateNationalId(addForm.national_id))
      errors.national_id = "Must be exactly 11 digits";
    else if (
      !addForm.company_type &&
      !validateNationalCode(addForm.national_id)
    )
      errors.national_id = "Invalid national code";

    if (addForm.company_type && !addForm.registration_no)
      errors.registration_no = "Registration number is required";

    if (!addForm.primary_phone)
      errors.primary_phone = "Primary phone is required";
    else if (!validateMobile(addForm.primary_phone))
      errors.primary_phone = "Invalid mobile format";

    if (!addForm.address_en.trim())
      errors.address_en = "English address is required";
    if (!addForm.address_fa.trim()) errors.address_fa = "آدرس فارسی الزامی است";

    const validContacts = addForm.contactPersons.filter(
      (cp) => cp.name.trim() && validateMobile(cp.mobile),
    );
    if (addForm.company_type && validContacts.length === 0)
      errors.contactPersons = "At least one valid contact person required";

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!hasPermission) {
      showToast(
        "error",
        "Access Denied",
        `You do not have permission to ${mode === "add" ? "create" : "edit"} clients`,
      );
      return;
    }

    if (!validateAddForm()) return;
    if (duplicateWarning && mode === "add") {
      showToast(
        "warning",
        "Duplicate Warning",
        "Please resolve the duplicate client warning first.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const clientData: Partial<Client> = {
        type: addForm.company_type ? "LEGAL" : "INDIVIDUAL",
        name_en: addForm.name_en,
        name_fa: addForm.name_fa,
        national_id: addForm.national_id,
        category: addForm.category,
        contacts: addForm.company_type
          ? addForm.contactPersons.filter((cp) => cp.name.trim()).length
          : 0,
        contracts: initialData?.contracts || 0,
        logoColor: initialData?.logoColor || "from-indigo-500 to-violet-600",
        email: addForm.email_inbox,
        emails: addForm.email_inbox ? [addForm.email_inbox] : [],
        phone: addForm.primary_phone,
        address_en: addForm.address_en,
        address_fa: addForm.address_fa,
        departments: initialData?.departments || [currentDepartment],
        contactPersons: addForm.company_type
          ? addForm.contactPersons
              .filter((cp) => cp.name.trim())
              .map((cp) => ({ ...cp, department: currentDepartment }))
          : [],
      };

      if (addForm.company_type) {
        clientData.company_type = addForm.company_type;
        clientData.registration_no = addForm.registration_no;
        clientData.economic_code = addForm.economic_code;
        clientData.abbreviated_name = addForm.abbreviated_name;
      }

      let savedClient: Client;

      if (mode === "edit" && initialData?.id) {
        console.log(
          "[ClientForm] 📝 Updating client in Supabase:",
          initialData.id,
        );
        savedClient = await clientService.update(initialData.id, clientData);
        showToast("success", "Updated", "Client updated successfully");
      } else {
        console.log("[ClientForm] 💾 Saving client to Supabase");
        savedClient = await clientService.create(clientData);
        showToast("success", "Created", "Client created successfully");
      }

      onSave(savedClient);
      onClose();
    } catch (error: any) {
      console.error("[ClientForm] ❌ Save failed:", error);
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

  if (!hasPermission) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setDuplicateWarning(null);
      }}
      title={mode === "add" ? "🏢 Entity Onboarding" : "✏️ Edit Client"}
      size="xl"
      // 🔧 FIX: دکمه‌ها در footer prop - ثابت در پایین
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              onClose();
              setDuplicateWarning(null);
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? "⏳ Saving..."
              : `💾 ${mode === "add" ? "Save Entity" : "Update Client"}`}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-4xl mb-2 animate-pulse">⏳</div>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
            >
              Loading client data...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Type Selector */}
          <div
            className={`flex gap-2 p-1.5 rounded-xl border w-fit ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-slate-50 border-slate-200"
            }`}
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
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                addForm.company_type
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-slate-600 hover:bg-white"
              } ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              🏢 LEGAL
            </button>
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, company_type: "" })}
              disabled={mode === "edit"}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !addForm.company_type
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700"
                    : "text-slate-600 hover:bg-white"
              } ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              👤 INDIVIDUAL
            </button>
          </div>

          {/* Basic Identity */}
          <div
            className={`rounded-2xl border p-6 ${
              isDark
                ? "border-slate-700 bg-slate-800/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <h2
              className={`text-lg font-bold mb-6 flex items-center gap-2 ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              🌐 BASIC IDENTITY
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Name EN */}
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Full Name (English) *
                </label>
                <input
                  value={addForm.name_en}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name_en: e.target.value })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    addErrors.name_en
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {duplicateWarning?.field === "name_en" && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-900 mb-2">
                      {duplicateWarning.message}
                    </p>
                  </div>
                )}
                {addErrors.name_en && !duplicateWarning && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {addErrors.name_en}
                  </p>
                )}
              </div>

              {/* Name FA */}
              <div dir="rtl">
                <label
                  className={`mb-1.5 block text-xs font-semibold text-left ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Full Name (Farsi) *
                </label>
                <input
                  value={addForm.name_fa}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name_fa: e.target.value })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 transition-all ${
                    addErrors.name_fa
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {addErrors.name_fa && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">
                    ✕ {addErrors.name_fa}
                  </p>
                )}
              </div>

              {/* Abbreviated Name */}
              {addForm.company_type && (
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
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
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                  />
                </div>
              )}

              {/* Company Type */}
              {addForm.company_type && (
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Company Type *
                  </label>
                  <select
                    value={addForm.company_type}
                    onChange={(e) =>
                      setAddForm({ ...addForm, company_type: e.target.value })
                    }
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                  >
                    <option value="Private Joint Stock">
                      Private Joint Stock
                    </option>
                    <option value="Public Joint Stock">
                      Public Joint Stock
                    </option>
                    <option value="Limited Liability">Limited Liability</option>
                  </select>
                </div>
              )}

              {/* National ID */}
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
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
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                    addErrors.national_id
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {duplicateWarning?.field === "national_id" && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-900 mb-2">
                      {duplicateWarning.message}
                    </p>
                  </div>
                )}
                {addErrors.national_id && !duplicateWarning && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {addErrors.national_id}
                  </p>
                )}
              </div>

              {/* Economic Code */}
              {addForm.company_type && (
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
                  >
                    Economic Code
                  </label>
                  <input
                    value={addForm.economic_code}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        economic_code: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                  />
                </div>
              )}

              {/* Registration No */}
              {addForm.company_type && (
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-700"
                    }`}
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
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                      addErrors.registration_no
                        ? "border-rose-300 focus:ring-rose-100"
                        : isDark
                          ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                          : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                  />
                  {duplicateWarning?.field === "registration_no" && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-medium text-amber-900 mb-2">
                        {duplicateWarning.message}
                      </p>
                    </div>
                  )}
                  {addErrors.registration_no && !duplicateWarning && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                      ✕ {addErrors.registration_no}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Hub */}
          <div
            className={`rounded-2xl border p-6 ${
              isDark
                ? "border-slate-700 bg-slate-800/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <h2
              className={`text-lg font-bold mb-6 flex items-center gap-2 ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              📞 CONTACT HUB
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
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
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                    addErrors.primary_phone
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {addErrors.primary_phone && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {addErrors.primary_phone}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Email Inbox
                </label>
                <input
                  type="email"
                  value={addForm.email_inbox}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email_inbox: e.target.value })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                      : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Official Address */}
          <div
            className={`rounded-2xl border p-6 ${
              isDark
                ? "border-slate-700 bg-slate-800/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <h2
              className={`text-lg font-bold mb-6 flex items-center gap-2 ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              🏠 OFFICIAL ADDRESS
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Address (English) *
                </label>
                <textarea
                  value={addForm.address_en}
                  onChange={(e) =>
                    setAddForm({ ...addForm, address_en: e.target.value })
                  }
                  rows={3}
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    addErrors.address_en
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {addErrors.address_en && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {addErrors.address_en}
                  </p>
                )}
              </div>
              <div dir="rtl">
                <label
                  className={`mb-1.5 block text-xs font-semibold text-left ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Address (Farsi) *
                </label>
                <textarea
                  value={addForm.address_fa}
                  onChange={(e) =>
                    setAddForm({ ...addForm, address_fa: e.target.value })
                  }
                  rows={3}
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 transition-all ${
                    addErrors.address_fa
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:border-indigo-400 focus:ring-indigo-900"
                        : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                {addErrors.address_fa && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">
                    ✕ {addErrors.address_fa}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Persons (Legal only) */}
          {addForm.company_type && (
            <div
              className={`rounded-2xl border p-6 ${
                isDark
                  ? "border-slate-700 bg-slate-800/30"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2
                  className={`text-lg font-bold flex items-center gap-2 ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  👥 CONTACT PERSONS
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      isDark
                        ? "bg-indigo-900/50 text-indigo-300"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {addForm.contactPersons.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={addContactPerson}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  + ADD LIAISON
                </button>
              </div>

              {addErrors.contactPersons && (
                <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                  ✕ {addErrors.contactPersons}
                </div>
              )}

              <div className="space-y-3">
                {addForm.contactPersons.map((cp) => (
                  <div
                    key={cp.id}
                    className={`grid grid-cols-12 gap-3 p-4 rounded-xl border transition-all ${
                      isDark
                        ? "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                        : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                    }`}
                  >
                    <div className="col-span-4">
                      <label
                        className={`mb-1 block text-[10px] font-semibold ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        Liaison Name *
                      </label>
                      <input
                        value={cp.name}
                        onChange={(e) =>
                          updateContactPerson(cp.id, "name", e.target.value)
                        }
                        className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none transition-all ${
                          isDark
                            ? "border-slate-700 bg-slate-800 text-slate-100"
                            : "border-slate-200 bg-white"
                        }`}
                      />
                    </div>
                    <div className="col-span-3">
                      <label
                        className={`mb-1 block text-[10px] font-semibold ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        Position/Rank
                      </label>
                      <input
                        value={cp.position}
                        onChange={(e) =>
                          updateContactPerson(cp.id, "position", e.target.value)
                        }
                        className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none transition-all ${
                          isDark
                            ? "border-slate-700 bg-slate-800 text-slate-100"
                            : "border-slate-200 bg-white"
                        }`}
                      />
                    </div>
                    <div className="col-span-3">
                      <label
                        className={`mb-1 block text-[10px] font-semibold ${
                          isDark ? "text-slate-300" : "text-slate-600"
                        }`}
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
                        className={`w-full rounded border px-2 py-1.5 text-xs font-mono focus:border-indigo-400 focus:outline-none transition-all ${
                          isDark
                            ? "border-slate-700 bg-slate-800 text-slate-100"
                            : "border-slate-200 bg-white"
                        }`}
                      />
                    </div>
                    <div className="col-span-2 flex items-end gap-1">
                      <div className="flex-1">
                        <label
                          className={`mb-1 block text-[10px] font-semibold ${
                            isDark ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          Direct Email
                        </label>
                        <input
                          value={cp.email}
                          onChange={(e) =>
                            updateContactPerson(cp.id, "email", e.target.value)
                          }
                          className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none transition-all ${
                            isDark
                              ? "border-slate-700 bg-slate-800 text-slate-100"
                              : "border-slate-200 bg-white"
                          }`}
                        />
                      </div>
                      {addForm.contactPersons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactPerson(cp.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
    </Modal>
  );
}
