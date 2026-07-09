// src/features/client-management/ui/ClientEditModal.tsx

import { useState, useEffect, useMemo } from "react";
import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Client } from "@entities/contract/types";
import { validateMobile } from "@shared/lib/validators";

// 🔐 RBAC Imports
import { usePermission } from "@shared/authorization/hooks/usePermission";
import { showToast } from "@shared/ui/ToastContainer";

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

  // 🔐 RBAC: چک کردن permission
  const { can } = usePermission();
  const canUpdate = can("client:update");

  const [editForm, setEditForm] = useState<any>({});
  const [errors, setErrors] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // 🔐 RBAC: اگر دسترسی نداره، مودال رو ببند
  useEffect(() => {
    if (isOpen && !canUpdate) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to edit clients",
      );
      onClose();
    }
  }, [isOpen, canUpdate, onClose]);

  // Initialize form when client changes
  useEffect(() => {
    if (client && isOpen && canUpdate) {
      setEditForm({
        ...client,
        contactPersons: (client.contactPersons || [])
          .filter((cp: any) => cp.department === currentDepartment)
          .map((cp: any) => ({ ...cp })),
      });
      setErrors({});
    }
  }, [client, isOpen, currentDepartment, canUpdate]);

  // Validation
  const validateForm = useMemo(() => {
    const newErrors: any = {};

    if (!editForm.phone && !editForm.primary_phone) {
      newErrors.phone = "Primary phone is required";
    } else if (
      !validateMobile(editForm.phone || editForm.primary_phone || "")
    ) {
      newErrors.phone = "Invalid mobile format";
    }

    if (!editForm.address_en?.trim()) {
      newErrors.address_en = "English address is required";
    }
    if (!editForm.address_fa?.trim()) {
      newErrors.address_fa = "آدرس فارسی الزامی است";
    }

    // Validate contact persons
    if (editForm.type === "LEGAL" && editForm.contactPersons) {
      const invalidContacts = editForm.contactPersons.filter(
        (cp: any) => !cp.name.trim() || !validateMobile(cp.mobile),
      );
      if (invalidContacts.length > 0) {
        newErrors.contactPersons =
          "All contact persons must have valid name and mobile";
      }
    }

    return newErrors;
  }, [editForm]);

  if (!client) return null;

  const handleSave = async () => {
    // 🔐 RBAC: چک کردن permission قبل از submit
    if (!canUpdate) {
      showToast(
        "error",
        "Access Denied",
        "You do not have permission to edit clients",
      );
      return;
    }

    // Validation
    if (Object.keys(validateForm).length > 0) {
      setErrors(validateForm);
      showToast(
        "error",
        "Validation Error",
        "Please fix the errors before saving",
      );
      return;
    }

    setIsSaving(true);

    try {
      const updated = {
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

      await onSave(updated);
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
    >
      <div className="space-y-6">
        {/* ═══════════════════════════════════════ */}
        {/* 🔹 Read-Only Information */}
        {/* ═══════════════════════════════════════ */}
        <div
          className={`rounded-2xl border p-6 ${
            isDark
              ? "border-slate-700 bg-slate-800/30"
              : "border-slate-200 bg-slate-50/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">🔒</span>
            <h3
              className={`text-sm font-semibold ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Read-Only Information
            </h3>
            <Badge tone="slate" className="text-[9px]">
              Cannot be changed
            </Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label
                className={`mb-1.5 block text-xs font-semibold ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Full Name (English)
              </label>
              <div
                className={`w-full rounded-lg border py-2.5 px-3 text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-400"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {editForm.name_en}
              </div>
            </div>
            <div dir="rtl">
              <label
                className={`mb-1.5 block text-xs font-semibold text-left ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Full Name (Farsi)
              </label>
              <div
                className={`w-full rounded-lg border py-2.5 px-3 text-sm text-right ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-400"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {editForm.name_fa}
              </div>
            </div>

            {editForm.type === "LEGAL" && (
              <>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Abbreviated Name
                  </label>
                  <div
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-400"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {editForm.abbreviated_name || "—"}
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Company Type
                  </label>
                  <div
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-400"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {editForm.company_type || "—"}
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    National ID
                  </label>
                  <div
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-400"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {editForm.national_id}
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Registration Number
                  </label>
                  <div
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-400"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {editForm.registration_no || "—"}
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-1.5 block text-xs font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Economic Code
                  </label>
                  <div
                    className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono ${
                      isDark
                        ? "border-slate-700 bg-slate-800 text-slate-400"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {editForm.economic_code || "—"}
                  </div>
                </div>
              </>
            )}

            {editForm.type === "INDIVIDUAL" && (
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  National Code
                </label>
                <div
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-400"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {editForm.national_id}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 🔹 Editable Information */}
        {/* ═══════════════════════════════════════ */}
        <div
          className={`rounded-2xl border-2 p-6 ${
            isDark
              ? "border-indigo-700/50 bg-indigo-950/30"
              : "border-indigo-200 bg-indigo-50/30"
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">✏️</span>
            <h3
              className={`text-sm font-semibold ${
                isDark ? "text-indigo-200" : "text-indigo-900"
              }`}
            >
              Editable Information
            </h3>
            <Badge tone="indigo" className="text-[9px]">
              Can be changed
            </Badge>
          </div>
          <div className="space-y-4">
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
                  value={editForm.phone || editForm.primary_phone || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      primary_phone: e.target.value,
                      phone: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${
                    errors.phone
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-indigo-500/50 focus:border-indigo-400"
                        : "border-slate-200 bg-white focus:ring-indigo-500/30 focus:border-indigo-400"
                  }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {errors.phone}
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
                  value={editForm.email || editForm.email_inbox || ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      email_inbox: e.target.value,
                      email: e.target.value,
                    })
                  }
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-indigo-500/50 focus:border-indigo-400"
                      : "border-slate-200 bg-white focus:ring-indigo-500/30 focus:border-indigo-400"
                  }`}
                />
              </div>
            </div>
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
                  value={editForm.address_en || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address_en: e.target.value })
                  }
                  rows={3}
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.address_en
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-indigo-500/50 focus:border-indigo-400"
                        : "border-slate-200 bg-white focus:ring-indigo-500/30 focus:border-indigo-400"
                  }`}
                />
                {errors.address_en && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {errors.address_en}
                  </p>
                )}
              </div>
              <div>
                <label
                  className={`mb-1.5 block text-xs font-semibold text-left ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  Address (Farsi) *
                </label>
                <textarea
                  value={editForm.address_fa || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, address_fa: e.target.value })
                  }
                  rows={3}
                  dir="rtl"
                  className={`w-full rounded-lg border py-2.5 px-3 text-sm text-right focus:outline-none focus:ring-2 transition-all ${
                    errors.address_fa
                      ? "border-rose-300 focus:ring-rose-100"
                      : isDark
                        ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-indigo-500/50 focus:border-indigo-400"
                        : "border-slate-200 bg-white focus:ring-indigo-500/30 focus:border-indigo-400"
                  }`}
                />
                {errors.address_fa && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600 text-right">
                    ✕ {errors.address_fa}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════ */}
        {/* 🔹 Contact Persons (Legal only) */}
        {/* ═══════════════════════════════════════ */}
        {editForm.type === "LEGAL" && (
          <div
            className={`rounded-2xl border p-6 ${
              isDark
                ? "border-slate-700 bg-slate-800/30"
                : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-sm font-semibold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                👥 Contact Persons
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isDark
                      ? "bg-indigo-900/50 text-indigo-300"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {editForm.contactPersons?.length || 0}
                </span>
              </h3>
              <button
                type="button"
                onClick={addEditContactPerson}
                className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                + ADD LIAISON
              </button>
            </div>
            <p
              className={`text-xs mb-4 ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Only contact persons related to your department (
              {currentDepartment}) are shown and editable. Other departments'
              contacts (if any) are hidden.
            </p>

            {errors.contactPersons && (
              <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                ✕ {errors.contactPersons}
              </div>
            )}

            <div className="space-y-3">
              {editForm.contactPersons?.map((cp: any) => (
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
                        updateEditContactPerson(cp.id, "name", e.target.value)
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
                        updateEditContactPerson(
                          cp.id,
                          "position",
                          e.target.value,
                        )
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
                        updateEditContactPerson(
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
                          updateEditContactPerson(
                            cp.id,
                            "email",
                            e.target.value,
                          )
                        }
                        className={`w-full rounded border px-2 py-1.5 text-xs focus:border-indigo-400 focus:outline-none transition-all ${
                          isDark
                            ? "border-slate-700 bg-slate-800 text-slate-100"
                            : "border-slate-200 bg-white"
                        }`}
                      />
                    </div>
                    {editForm.contactPersons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEditContactPerson(cp.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                  className={`text-center py-6 text-sm ${
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  No contact persons for {currentDepartment} yet. Click "+ ADD
                  LIAISON" to add one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* 🔹 Actions */}
        {/* ═══════════════════════════════════════ */}
        <div
          className={`flex justify-end gap-3 pt-4 border-t ${
            isDark ? "border-slate-700" : "border-slate-100"
          }`}
        >
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={isSaving ? "opacity-70 cursor-wait" : ""}
          >
            {isSaving ? "⏳ Saving..." : "💾 Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
