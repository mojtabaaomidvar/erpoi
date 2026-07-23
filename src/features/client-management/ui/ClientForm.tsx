// src/features/client-management/ui/ClientForm.tsx

import { Button } from "@design-system";
import { Modal } from "@shared/ui/Modal";
import { useTheme } from "@app/providers/ThemeProvider";
import type { Client } from "@/features/client-management/domain/models/Client";
import { DuplicateWarningModal } from "./DuplicateWarningModal";
import { useClientForm } from "../hooks/useClientForm";

interface ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  clients: Client[]; // نگه داشته شده برای سازگاری، هرچند در هوک استفاده نمی‌شود
  currentDepartment: string;
  departments: { id: string; name: string }[];
  mode?: "add" | "edit";
  initialData?: Partial<Client>;
}

export function ClientForm({
  isOpen,
  onClose,
  onSave,
  currentDepartment,
  departments,
  mode = "add",
  initialData,
}: ClientFormProps) {
  const { isDark } = useTheme();

  // ✅ تمام منطق در هوک مدیریت می‌شود
  const {
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
  } = useClientForm(
    isOpen,
    mode,
    initialData,
    currentDepartment,
    departments,
    onClose,
    onSave,
  );

  // محاسبه اعتبار فرم برای غیرفعال کردن دکمه (فقط برای UI)
  const isFormValid = (() => {
    const isLegal = !!formData.company_type;
    const hasBasic =
      formData.name_en.trim().length >= 3 &&
      formData.name_fa.trim().length >= 3 &&
      formData.address_fa.trim().length >= 5;
    const hasValidPhone = formData.primary_phone.length >= 10; // ساده‌سازی برای UI disable

    if (!isLegal)
      return hasBasic && formData.national_id.length === 10 && hasValidPhone;

    const hasLegalFields =
      formData.registration_no.trim().length > 0 &&
      formData.economic_code.trim().length > 0;
    const hasValidContact = formData.contactPersons.some(
      (cp) => cp.name.trim().length >= 3 && cp.mobile.length >= 10,
    );

    return (
      hasBasic &&
      formData.national_id.length === 11 &&
      hasValidPhone &&
      hasLegalFields &&
      hasValidContact
    );
  })();

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
                    handleChange("company_type", "Private Joint Stock")
                  }
                  disabled={mode === "edit"}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    formData.company_type
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                  } ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  🏢 LEGAL
                </button>
                <button
                  type="button"
                  onClick={() => handleChange("company_type", "")}
                  disabled={mode === "edit"}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    !formData.company_type
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                      : isDark
                        ? "text-slate-400 hover:text-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                  } ${mode === "edit" ? "opacity-60 cursor-not-allowed" : ""}`}
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
                      value={formData.name_en}
                      onChange={(e) => handleChange("name_en", e.target.value)}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${errors.name_en ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.name_en && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {errors.name_en}
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
                      value={formData.name_fa}
                      onChange={(e) => handleChange("name_fa", e.target.value)}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm text-right focus:outline-none focus:ring-1 transition-all ${errors.name_fa ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.name_fa && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600 text-left">
                        ✕ {errors.name_fa}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {formData.company_type
                        ? "National ID (11 digits) *"
                        : "National Code (10 digits) *"}
                    </label>
                    <input
                      value={formData.national_id}
                      onChange={(e) =>
                        handleChange(
                          "national_id",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      maxLength={formData.company_type ? 11 : 10}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${errors.national_id ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.national_id && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {errors.national_id}
                      </p>
                    )}
                  </div>

                  {formData.company_type && (
                    <>
                      <div>
                        <label
                          className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                        >
                          Registration Number *
                        </label>
                        <input
                          value={formData.registration_no}
                          onChange={(e) =>
                            handleChange("registration_no", e.target.value)
                          }
                          className={`w-full rounded-lg border py-1.5 px-2.5 text-sm focus:outline-none focus:ring-1 transition-all ${errors.registration_no ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                        />
                        {errors.registration_no && (
                          <p className="mt-1 text-[10px] font-medium text-rose-600">
                            ✕ {errors.registration_no}
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
                          value={formData.economic_code}
                          onChange={(e) =>
                            handleChange(
                              "economic_code",
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
                          className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${errors.economic_code ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                        />
                        {errors.economic_code && (
                          <p className="mt-1 text-[10px] font-medium text-rose-600">
                            ✕ {errors.economic_code}
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
                          value={formData.abbreviated_name}
                          onChange={(e) =>
                            handleChange("abbreviated_name", e.target.value)
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
                      value={formData.primary_phone}
                      onChange={(e) =>
                        handleChange(
                          "primary_phone",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      maxLength={11}
                      className={`w-full rounded-lg border py-1.5 px-2.5 text-sm font-mono focus:outline-none focus:ring-1 transition-all ${errors.primary_phone ? "border-rose-300 focus:ring-rose-100" : isDark ? "border-slate-700 bg-slate-900 text-slate-100 focus:border-indigo-500" : "border-slate-200 bg-white focus:border-indigo-500"}`}
                    />
                    {errors.primary_phone && (
                      <p className="mt-1 text-[10px] font-medium text-rose-600">
                        ✕ {errors.primary_phone}
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
                      value={formData.email_inbox}
                      onChange={(e) =>
                        handleChange("email_inbox", e.target.value)
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
                      value={formData.address_en}
                      onChange={(e) =>
                        handleChange("address_en", e.target.value)
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
                      value={formData.address_fa}
                      onChange={(e) =>
                        handleChange("address_fa", e.target.value)
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

              {/* Contact Persons (Legal only) */}
              {formData.company_type && (
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
                        {formData.contactPersons.length}
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* 🔧 مودال هشدار تکراری */}
      {showDuplicateModal && duplicateInfo && (
        <DuplicateWarningModal
          isOpen={showDuplicateModal}
          onClose={handleCloseAll}
          onSaveContact={(newContact) => performSave(newContact)}
          duplicateClient={{
            ...duplicateInfo.client,
            _resolvedDepartmentNames: duplicateInfo.resolvedDeptNames,
          }}
          currentDepartment={currentDepartment}
          isSameDepartmentDuplicate={duplicateInfo.isSameDepartment}
        />
      )}
    </>
  );
}
