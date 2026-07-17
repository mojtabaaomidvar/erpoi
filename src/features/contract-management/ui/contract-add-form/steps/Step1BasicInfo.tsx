// src/features/contract-management/ui/contract-add-form/steps/Step1BasicInfo.tsx

import { ClientSelectorModal } from "@entities/client/ui/ClientSelectorModal";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { showToast } from "@shared/ui/ToastContainer";
import type { StepProps, WorkOrderFormData } from "../types";
import { SERVICE_TYPES, SOURCE_TYPES, EMAIL_INPUT_METHODS } from "../constants";

export function Step1BasicInfo({
  docType,
  formData,
  updateCurrentFormData,
  errors,
  onNavigateToClients,
  onTypeChange,
  isAdmin,
  isEditMode = false,
}: StepProps) {
  const { isDark } = useTheme();
  const data = formData[docType];
  const woData = docType === "WORK_ORDER" ? (data as WorkOrderFormData) : null;

  const toggleServiceType = (value: string) => {
    const current = data.service_description;
    const newServices = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value];
    updateCurrentFormData({ service_description: newServices });
  };

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-primary">
          Document Type *{" "}
          {isAdmin && (
            <span className="text-amber-500">(Admin: Click to switch)</span>
          )}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isEditMode}
            onClick={() => !isEditMode && onTypeChange?.("CONTRACT")}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              docType === "CONTRACT"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                : isDark
                  ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            } ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            📄 Contract
          </button>
          <button
            type="button"
            disabled={isEditMode}
            onClick={() => !isEditMode && onTypeChange?.("WORK_ORDER")}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              docType === "WORK_ORDER"
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md"
                : isDark
                  ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            } ${isEditMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            📦 Work Order
          </button>
        </div>
      </div>

      {/* Client Selector */}
      <div>
        <div
          className={
            isEditMode
              ? "opacity-60 pointer-events-none cursor-not-allowed"
              : ""
          }
        >
          <ClientSelectorModal
            value={data.client_id}
            onChange={(clientId) =>
              updateCurrentFormData({ client_id: clientId })
            }
            onAddNew={onNavigateToClients}
            error={errors.client_id}
          />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-primary">
          {docType === "CONTRACT" ? "Contract Title" : "Work Order Title"} *
        </label>
        <input
          value={data.contract_title}
          onChange={(e) =>
            updateCurrentFormData({ contract_title: e.target.value })
          }
          className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${
            errors.contract_title ? "border-rose-300" : ""
          }`}
          placeholder={
            docType === "CONTRACT"
              ? "e.g., South Pars Phase 22 — Inspection Services"
              : "Brief title of the work order"
          }
        />
        {errors.contract_title && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">
            ✕ {errors.contract_title}
          </p>
        )}
      </div>

      {/* Work Order-specific: Source Type */}
      {docType === "WORK_ORDER" && woData && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-primary">
              Source Type *
            </label>
            <div className="flex gap-2">
              {SOURCE_TYPES.map((source) => (
                <button
                  key={source.value}
                  type="button"
                  onClick={() =>
                    updateCurrentFormData({ source_type: source.value })
                  }
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    woData.source_type === source.value
                      ? source.color === "emerald"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-blue-600 text-white shadow-md"
                      : isDark
                        ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {source.icon} {source.label}
                </button>
              ))}
            </div>
          </div>

          {woData.source_type === "LETTER" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">
                    Letter Number *
                  </label>
                  <input
                    value={woData.source_ref}
                    onChange={(e) =>
                      updateCurrentFormData({ source_ref: e.target.value })
                    }
                    className={`w-full rounded-lg px-3 py-2 text-sm font-mono input-themed ${
                      errors.source_ref ? "border-rose-300" : ""
                    }`}
                    placeholder="e.g., 1404/1234"
                  />
                  {errors.source_ref && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                      ✕ {errors.source_ref}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">
                    Letter Date *
                  </label>
                  <JalaaliDatePicker
                    value={woData.source_letter_date}
                    onChange={(date) =>
                      updateCurrentFormData({ source_letter_date: date })
                    }
                    placeholder="Select letter date"
                  />
                  {errors.source_letter_date && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                      ✕ {errors.source_letter_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Letter Image Upload */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  Letter Image *{" "}
                  <span className="text-rose-500">(Required)</span>
                </label>
                <input
                  type="file"
                  id="letter-image-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const preview = URL.createObjectURL(file);
                      updateCurrentFormData({
                        source_letter_image: file.name,
                        source_letter_image_object: file,
                        source_letter_image_preview: preview,
                      });
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="letter-image-input"
                  className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-poStep1BasicInfo transition-colors ${
                    woData.source_letter_image
                      ? isDark
                        ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                        : "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : isDark
                        ? "border-dashed border-slate-600 bg-slate-800/30 text-slate-400"
                        : "border-dashed border-slate-300 bg-slate-50 text-slate-600"
                  } ${errors.source_letter_image ? "border-rose-300" : ""}`}
                >
                  {woData.source_letter_image ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span>🖼️</span>
                      <span className="truncate font-medium">
                        {woData.source_letter_image}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>📎</span>
                      <span>Click to attach letter image</span>
                    </div>
                  )}
                </label>
                {errors.source_letter_image && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {errors.source_letter_image}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Email Input Method Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  Email Input Method *
                </label>
                <div className="flex gap-2">
                  {EMAIL_INPUT_METHODS.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        if (method.comingSoon) {
                          showToast(
                            "info",
                            "Coming Soon",
                            "Direct Outlook integration will be available in future updates",
                          );
                        } else {
                          updateCurrentFormData({
                            email_input_method: method.value as any,
                          });
                        }
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                        woData.email_input_method === method.value
                          ? "bg-indigo-600 text-white shadow-md"
                          : isDark
                            ? "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {method.icon} {method.label}
                      {method.comingSoon && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] px-1 rounded">
                          Soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Entry */}
              {woData.email_input_method === "MANUAL" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      From Email Address *
                    </label>
                    <input
                      type="email"
                      value={woData.source_email_from}
                      onChange={(e) =>
                        updateCurrentFormData({
                          source_email_from: e.target.value,
                        })
                      }
                      className={`w-full rounded-lg px-3 py-2 text-sm font-mono input-themed ${
                        errors.source_email_from ? "border-rose-300" : ""
                      }`}
                      placeholder="sender@example.com"
                    />
                    {errors.source_email_from && (
                      <p className="mt-1 text-[11px] font-medium text-rose-600">
                        ✕ {errors.source_email_from}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-primary">
                      Email Date
                    </label>
                    <input
                      type="date"
                      value={woData.source_email_date}
                      onChange={(e) =>
                        updateCurrentFormData({
                          source_email_date: e.target.value,
                        })
                      }
                      className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                    />
                  </div>
                </div>
              )}

              {/* Upload File */}
              {woData.email_input_method === "UPLOAD" && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-primary">
                    Upload Outlook Email File *{" "}
                    <span className="text-slate-500 font-normal">
                      (.msg, .eml)
                    </span>
                  </label>
                  <input
                    type="file"
                    id="email-file-input"
                    accept=".msg,.eml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateCurrentFormData({
                          source_email_file: file.name,
                          source_email_file_object: file,
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="email-file-input"
                    className={`flex items-center justify-between gap-2 w-full rounded-lg border-2 px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      woData.source_email_file
                        ? isDark
                          ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                          : "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : isDark
                          ? "border-dashed border-slate-600 bg-slate-800/30 text-slate-400"
                          : "border-dashed border-slate-300 bg-slate-50 text-slate-600"
                    } ${errors.source_email_file ? "border-rose-300" : ""}`}
                  >
                    {woData.source_email_file ? (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span>📧</span>
                        <span className="truncate font-medium">
                          {woData.source_email_file}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>📎</span>
                        <span>Click to upload Outlook email file</span>
                      </div>
                    )}
                  </label>
                  {errors.source_email_file && (
                    <p className="mt-1 text-[11px] font-medium text-rose-600">
                      ✕ {errors.source_email_file}
                    </p>
                  )}
                </div>
              )}

              {/* Outlook Integration (Coming Soon) */}
              {woData.email_input_method === "OUTLOOK" && (
                <div
                  className={`rounded-lg border-2 border-dashed p-6 text-center ${isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-300 bg-slate-50/50"}`}
                >
                  <div className="text-3xl mb-2">🔗</div>
                  <p
                    className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Direct Outlook Integration
                  </p>
                  <p
                    className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
                  >
                    This feature will be available in future updates
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Service Description - Multi-select */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-primary">
          Service Type *{" "}
          <span className="text-slate-500 font-normal">
            (Select multiple if applicable)
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SERVICE_TYPES.map((service) => {
            const isSelected = data.service_description.includes(service.value);
            return (
              <button
                key={service.value}
                type="button"
                onClick={() => toggleServiceType(service.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                  isSelected
                    ? isDark
                      ? "border-indigo-500 bg-indigo-900/30 text-indigo-300"
                      : "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : isDark
                      ? "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-base">{service.icon}</span>
                <span className="flex-1 text-left">{service.label}</span>
                {isSelected && <span className="text-emerald-500">✓</span>}
              </button>
            );
          })}
        </div>

        {data.service_description.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.service_description.map((service) => {
              const serviceInfo = SERVICE_TYPES.find(
                (s) => s.value === service,
              );
              return (
                <Badge
                  key={service}
                  tone="indigo"
                  className="text-[10px] flex items-center gap-1"
                >
                  <span>{serviceInfo?.icon}</span>
                  <span>{serviceInfo?.value}</span>
                  <button
                    type="button"
                    onClick={() => toggleServiceType(service)}
                    className="ml-1 hover:text-rose-400"
                  >
                    ×
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {errors.service_description && (
          <p className="mt-1 text-[11px] font-medium text-rose-600">
            ✕ {errors.service_description}
          </p>
        )}
      </div>
    </div>
  );
}
