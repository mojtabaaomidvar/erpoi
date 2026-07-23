// src/features/client-management/ui/ClientEditModal.tsx

import { Button, Badge, Modal } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Client } from "@/features/client-management/domain/models/Client";
import { useClientEdit } from "../hooks/useClientEdit";

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

  const {
    formData,
    errors,
    isLoading,
    isSaving,
    setFieldValue,
    addContactPerson,
    removeContactPerson,
    updateContactPerson,
    handleSubmit,
  } = useClientEdit(client, currentDepartment, onSave, onClose);

  if (!client || !isOpen) return null;

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
            onClick={handleSubmit}
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
        ) : formData ? (
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
                    {formData.name_en}
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
                    {formData.name_fa}
                  </div>
                </div>
                {formData.type === "LEGAL" && (
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
                        {formData.abbreviated_name || "—"}
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
                        {formData.company_type || "—"}
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
                        {formData.national_id}
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
                        {formData.registration_no || "—"}
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
                        {formData.economic_code || "—"}
                      </div>
                    </div>
                  </>
                )}
                {formData.type === "INDIVIDUAL" && (
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      National Code
                    </label>
                    <div
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono ${isDark ? "border-slate-700 bg-slate-900 text-slate-400" : "border-slate-200 bg-slate-100 text-slate-600"}`}
                    >
                      {formData.national_id}
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
                      value={formData.phone}
                      onChange={(e) => setFieldValue("phone", e.target.value)}
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
                      value={formData.email}
                      onChange={(e) => setFieldValue("email", e.target.value)}
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
                      value={formData.address_en}
                      onChange={(e) =>
                        setFieldValue("address_en", e.target.value)
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
                      value={formData.address_fa}
                      onChange={(e) =>
                        setFieldValue("address_fa", e.target.value)
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
            {formData.type === "LEGAL" && (
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
                      {formData.contactPersons.length}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={addContactPerson}
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
                  {formData.contactPersons.map((cp) => (
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
                        {formData.contactPersons.length > 1 && (
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
                  {formData.contactPersons.length === 0 && (
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
        ) : null}
      </div>
    </Modal>
  );
}
