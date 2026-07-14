// src/features/client-management/ui/ClientEditModal.tsx

import { useState, useEffect, useMemo } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Client } from "@entities/contract/types";
import { validateMobile } from "@shared/lib/validators";
import { showToast } from "@shared/ui/ToastContainer";
import { clientService } from "../services/ClientService";

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClient: Client) => void;
  client: Client | null;
  currentDepartment: string;
}

export function ClientEditModal({
  isOpen,
  onClose,
  onSave,
  client,
  currentDepartment,
}: ClientEditModalProps) {
  const { isDark } = useTheme();
  const [editForm, setEditForm] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadClientFromSupabase = async (clientId: string) => {
    setIsLoading(true);
    try {
      const latestClient = await clientService.getById(clientId);
      if (latestClient) {
        setEditForm({
          ...latestClient,
          contactPersons: (latestClient.contactPersons || [])
            .filter((cp: any) => cp.department === currentDepartment)
            .map((cp: any) => ({ ...cp })),
        });
        setErrors({});
      } else {
        showToast("error", "Not Found", "Client not found");
      }
    } catch (error) {
      showToast("error", "Load Failed", "Failed to load client data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (client && isOpen) loadClientFromSupabase(client.id);
  }, [client?.id, isOpen]);

  const validateForm = useMemo(() => {
    const newErrors: any = {};
    if (!editForm.phone && !editForm.primary_phone)
      newErrors.phone = "Primary phone required";
    else if (!validateMobile(editForm.phone || editForm.primary_phone || ""))
      newErrors.phone = "Invalid mobile format";
    if (!editForm.address_en?.trim())
      newErrors.address_en = "English address required";
    if (!editForm.address_fa?.trim())
      newErrors.address_fa = "آدرس فارسی الزامی است";
    if (editForm.type === "LEGAL" && editForm.contactPersons) {
      if (
        editForm.contactPersons.some(
          (cp: any) => !cp.name.trim() || !validateMobile(cp.mobile),
        )
      )
        newErrors.contactPersons =
          "All contacts must have valid name and mobile";
    }
    return newErrors;
  }, [editForm]);

  if (!client) return null;

  const handleSave = async () => {
    if (Object.keys(validateForm).length > 0) {
      setErrors(validateForm);
      showToast("error", "Validation Error", "Please fix errors first");
      return;
    }
    setIsSaving(true);
    try {
      const updated: Partial<Client> = {
        ...client,
        address_en: editForm.address_en,
        address_fa: editForm.address_fa,
        email: editForm.email_inbox || editForm.email,
        emails: editForm.email_inbox ? [editForm.email_inbox] : [],
        phone: editForm.primary_phone || editForm.phone,
      };
      if (client.type === "LEGAL") {
        const otherDepts = (client.contactPersons || []).filter(
          (cp: any) => cp.department !== currentDepartment,
        );
        updated.contactPersons = [
          ...otherDepts,
          ...editForm.contactPersons.map((cp: any) => ({
            ...cp,
            department: currentDepartment,
          })),
        ];
        updated.contacts = updated.contactPersons.length;
      }
      const savedClient = await clientService.update(client.id, updated);
      showToast("success", "Updated", "Client updated successfully");
      await onSave(savedClient);
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
  };

  const addEditContactPerson = () =>
    setEditForm({
      ...editForm,
      contactPersons: [
        ...(editForm.contactPersons || []),
        {
          id: Date.now().toString(),
          name: "",
          position: "",
          mobile: "",
          email: "",
          department: currentDepartment,
        },
      ],
    });
  const removeEditContactPerson = (id: string) =>
    setEditForm({
      ...editForm,
      contactPersons: editForm.contactPersons.filter((cp: any) => cp.id !== id),
    });
  const updateEditContactPerson = (id: string, field: string, value: string) =>
    setEditForm({
      ...editForm,
      contactPersons: editForm.contactPersons.map((cp: any) =>
        cp.id === id ? { ...cp, [field]: value } : cp,
      ),
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✏️ Edit Client Information"
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
            onClick={handleSave}
            disabled={isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? "⏳ Saving..." : "💾 Save Changes"}
          </Button>
        </div>
      }
    >
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
            {/* Read-Only Information */}
            <div
              className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs">🔒</span>
                <h3
                  className={`text-xs font-bold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Read-Only Information
                </h3>
                <Badge tone="slate" className="text-[9px]">
                  Cannot be changed
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label
                    className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Full Name (English)
                  </label>
                  <div
                    className={`w-full rounded-lg border py-1.5 px-2.5 text-sm ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                  >
                    {editForm.name_en}
                  </div>
                </div>
                <div dir="rtl">
                  <label
                    className={`mb-1 block text-[11px] font-semibold text-left ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Full Name (Farsi)
                  </label>
                  <div
                    className={`w-full rounded-lg border py-1.5 px-2.5 text-sm text-right ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                  >
                    {editForm.name_fa}
                  </div>
                </div>
                {editForm.type === "LEGAL" && (
                  <>
                    <div>
                      <label
                        className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Abbreviated Name
                      </label>
                      <div
                        className={`w-full rounded-lg border py-1.5 px-2.5 text-sm ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                      >
                        {editForm.abbreviated_name || "—"}
                      </div>
                    </div>
                    <div>
                      <label
                        className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Company Type
                      </label>
                      <div
                        className={`w-full rounded-lg border py-1.5 px-2.5 text-sm ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                      >
                        {editForm.company_type || "—"}
                      </div>
                    </div>
                    <div>
                      <label
                        className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        National ID
                      </label>
                      <div
                        className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                      >
                        {editForm.national_id}
                      </div>
                    </div>
                    <div>
                      <label
                        className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Registration Number
                      </label>
                      <div
                        className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                      >
                        {editForm.registration_no || "—"}
                      </div>
                    </div>
                    <div>
                      <label
                        className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Economic Code
                      </label>
                      <div
                        className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                      >
                        {editForm.economic_code || "—"}
                      </div>
                    </div>
                  </>
                )}
                {editForm.type === "INDIVIDUAL" && (
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      National Code
                    </label>
                    <div
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                    >
                      {editForm.national_id}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editable Information */}
            <div
              className={`rounded-xl border-2 p-4 ${isDark ? "border-indigo-700/50 bg-indigo-950/20" : "border-indigo-200 bg-indigo-50/30"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs">✏️</span>
                <h3
                  className={`text-xs font-bold uppercase tracking-wide ${isDark ? "text-indigo-300" : "text-indigo-800"}`}
                >
                  Editable Information
                </h3>
                <Badge tone="indigo" className="text-[9px]">
                  Can be changed
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Primary Phone *
                    </label>
                    <input
                      value={editForm.phone || editForm.primary_phone || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          primary_phone: e.target.value,
                          phone: e.target.value,
                        })
                      }
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${errors.phone ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {errors.phone}
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
                      value={editForm.email || editForm.email_inbox || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          email_inbox: e.target.value,
                          email: e.target.value,
                        })
                      }
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Address (English) *
                    </label>
                    <textarea
                      value={editForm.address_en || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address_en: e.target.value })
                      }
                      rows={2}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${errors.address_en ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.address_en && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {errors.address_en}
                      </p>
                    )}
                  </div>
                  <div dir="rtl">
                    <label
                      className={`mb-1 block text-[11px] font-semibold text-left ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Address (Farsi) *
                    </label>
                    <textarea
                      value={editForm.address_fa || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address_fa: e.target.value })
                      }
                      rows={2}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm text-right focus:outline-none focus:ring-1 transition-all ${errors.address_fa ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.address_fa && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600 text-left">
                        ✕ {errors.address_fa}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Persons (Legal only) */}
            {editForm.type === "LEGAL" && (
              <div
                className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-xs font-bold flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    👥 Contact Persons{" "}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      {editForm.contactPersons?.length || 0}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={addEditContactPerson}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    + ADD LIAISON
                  </button>
                </div>
                <p
                  className={`text-[11px] mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Only contacts related to your department ({currentDepartment})
                  are shown.
                </p>
                {errors.contactPersons && (
                  <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800 p-2 text-[11px] font-medium text-rose-700 dark:text-rose-300">
                    ✕ {errors.contactPersons}
                  </div>
                )}
                <div className="space-y-2">
                  {editForm.contactPersons?.map((cp: any) => (
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
                            updateEditContactPerson(
                              cp.id,
                              "name",
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
                          Position
                        </label>
                        <input
                          value={cp.position}
                          onChange={(e) =>
                            updateEditContactPerson(
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
                            updateEditContactPerson(
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
                              updateEditContactPerson(
                                cp.id,
                                "email",
                                e.target.value,
                              )
                            }
                            className={`w-full rounded border px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none ${isDark ? "border-slate-700 bg-slate-800 text-slate-100" : "border-slate-200 bg-slate-50"}`}
                          />
                        </div>
                        {editForm.contactPersons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditContactPerson(cp.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded transition-colors mb-0.5"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!editForm.contactPersons ||
                    editForm.contactPersons.length === 0) && (
                    <div
                      className={`text-center py-4 text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      No contacts for {currentDepartment}. Click "+ ADD
                      LIAISON".
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
