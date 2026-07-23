// src/features/contract-management/ui/contract-add-form/steps/Step5Preview.tsx

import { useState } from "react";
import { Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { StepProps, ContractFormData, WorkOrderFormData } from "../types";
import { SERVICE_TYPES, GUARANTEE_TYPES } from "../constants";
import { formatCurrency } from "@shared/lib/formatters";

// مودال پیش‌نمایش فایل
function FilePreviewModal({
  file,
  isOpen,
  onClose,
}: {
  file: any;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { isDark } = useTheme();
  const url = file?.preview || file?.url;

  if (!isOpen || !file) return null;

  const isImage =
    file.type?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || "");
  const isPdf =
    file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={`relative z-10 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scaleIn ${
          isDark
            ? "bg-slate-900 border border-slate-700"
            : "bg-white border border-slate-200"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="text-xl flex-shrink-0">
              {isImage ? "🖼️" : isPdf ? "📄" : "📎"}
            </span>
            <div className="min-w-0 flex-1">
              <h3
                className={`text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {file.name}
              </h3>
              <p
                className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {isImage
                  ? "Image Preview"
                  : isPdf
                    ? "PDF Preview"
                    : "File Preview"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all ${
                isDark
                  ? "hover:bg-slate-700 text-slate-300 hover:text-rose-400"
                  : "hover:bg-slate-200 text-slate-600 hover:text-rose-600"
              }`}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body - Preview */}
        <div
          className={`flex-1 overflow-auto p-4 ${isDark ? "bg-slate-950" : "bg-slate-100"}`}
        >
          {!url ? (
            <div
              className={`flex flex-col items-center justify-center h-full py-20 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              <div className="text-5xl mb-3">📭</div>
              <p className="text-sm font-semibold">No preview available</p>
              <p className="text-xs mt-1">
                This file has not been uploaded yet
              </p>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={url}
                alt={file.name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full h-[75vh] rounded-lg bg-white"
              title={file.name}
            />
          ) : (
            <div
              className={`flex flex-col items-center justify-center h-full py-20 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              <div className="text-5xl mb-3">📎</div>
              <p className="text-sm font-semibold">Preview not supported</p>
              <p className="text-xs mt-1">
                Click "Open in New Tab" to view this file
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                ↗️ Open File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// دکمه پیش‌نمایش که مودال را باز می‌کند
function FilePreviewButton({
  file,
  onPreview,
}: {
  file: any;
  onPreview: (file: any) => void;
}) {
  const { isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={() => onPreview(file)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:scale-[1.02] w-full ${
        isDark
          ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
      }`}
    >
      <span className="text-base">👁️</span>
      <span className="truncate flex-1 text-left">Preview: {file.name}</span>
      <span className="text-[10px] opacity-60">Click to view</span>
    </button>
  );
}

const InfoField = ({
  label,
  children,
  className = "",
  isDark,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  isDark: boolean;
}) => (
  <div className={className}>
    <div
      className={`text-[10px] uppercase font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
    >
      {label}
    </div>
    <div className={`text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>
      {children}
    </div>
  </div>
);

const SectionCard = ({
  icon,
  title,
  children,
  isDark,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) => (
  <div
    className={`rounded-lg border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
  >
    <h3
      className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
    >
      {icon} {title}
    </h3>
    {children}
  </div>
);

export function Step5Preview({
  docType,
  formData,
  onFillDummyData,
  isAdmin,
  clientName = "Unknown Client", // ✅ دریافت مستقیم نام به جای آرایه clients
}: StepProps & { clientName?: string }) {
  const { isDark } = useTheme();
  const data = formData[docType];
  const isEmpty =
    !data.contract_title &&
    data.tariffs.length <= 1 &&
    !data.tariffs[0].description;

  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenPreview = (file: any) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setTimeout(() => setPreviewFile(null), 300);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Admin Testing Mode */}
        {isAdmin && isEmpty && (
          <div className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
              🧪 Admin Testing Mode
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
              The form is currently empty. Click below to populate it with
              realistic dummy data for preview testing.
            </p>
            <button
              onClick={onFillDummyData}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              🎲 Fill Dummy Data
            </button>
          </div>
        )}

        {/* Success Banner */}
        <div
          className={`rounded-lg border-2 p-4 ${isDark ? "border-emerald-700 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"}`}
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl">✅</div>
            <div className="flex-1">
              <h3
                className={`text-sm font-bold mb-1 ${isDark ? "text-emerald-200" : "text-emerald-900"}`}
              >
                Ready for Submission
              </h3>
              <p
                className={`text-xs ${isDark ? "text-emerald-300" : "text-emerald-800"}`}
              >
                Please review all information below. Once submitted, it will be
                sent to the Technical Manager for approval.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <SectionCard icon="📋" title="Basic Information" isDark={isDark}>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Document Type" isDark={isDark}>
              <Badge
                tone={docType === "CONTRACT" ? "indigo" : "amber"}
                className="text-[10px]"
              >
                {docType === "CONTRACT" ? "📄 Contract" : "📦 Work Order"}
              </Badge>
            </InfoField>

            <InfoField label="Client" isDark={isDark}>
              <span className="text-sm font-semibold">{clientName}</span>{" "}
              {/* ✅ استفاده مستقیم */}
            </InfoField>

            <InfoField label="Title" className="col-span-2" isDark={isDark}>
              <span className="font-semibold">
                {data.contract_title || "—"}
              </span>
            </InfoField>

            {data.service_description.length > 0 && (
              <InfoField
                label="Service Types"
                className="col-span-2"
                isDark={isDark}
              >
                <div className="flex flex-wrap gap-1">
                  {data.service_description.map((service) => {
                    const info = SERVICE_TYPES.find(
                      (s: any) => s.value === service,
                    );
                    return (
                      <Badge
                        key={service}
                        tone="indigo"
                        className="text-[10px]"
                      >
                        {info?.icon} {info?.label || service}
                      </Badge>
                    );
                  })}
                </div>
              </InfoField>
            )}
          </div>
        </SectionCard>

        {/* Financial Details (Contract only) */}
        {docType === "CONTRACT" && (
          <SectionCard icon="💰" title="Financial Details" isDark={isDark}>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Start Date" isDark={isDark}>
                <span className="text-xs font-mono">
                  {(data as ContractFormData).start_date || "—"}
                </span>
              </InfoField>
              <InfoField label="End Date" isDark={isDark}>
                <span className="text-xs font-mono">
                  {(data as ContractFormData).end_date || "—"}
                </span>
              </InfoField>
              <InfoField label="Total Value" isDark={isDark}>
                <span
                  className={`text-sm font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                >
                  {(data as ContractFormData).total_value > 0
                    ? formatCurrency(
                        (data as ContractFormData).total_value,
                        (data as ContractFormData).currency,
                      )
                    : "—"}
                </span>
              </InfoField>
              <InfoField label="Currency" isDark={isDark}>
                <Badge tone="slate" className="text-[10px]">
                  {(data as ContractFormData).currency}
                </Badge>
              </InfoField>
            </div>
          </SectionCard>
        )}

        {/* Source Information (Work Order only) */}
        {docType === "WORK_ORDER" && (
          <SectionCard icon="📨" title="Source Information" isDark={isDark}>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Source Type" isDark={isDark}>
                <Badge
                  tone={
                    (data as WorkOrderFormData).source_type === "LETTER"
                      ? "emerald"
                      : "indigo"
                  }
                  className="text-[10px]"
                >
                  {(data as WorkOrderFormData).source_type === "LETTER"
                    ? "📄 Letter"
                    : "📧 Email"}
                </Badge>
              </InfoField>

              {(data as WorkOrderFormData).source_type === "LETTER" ? (
                <>
                  <InfoField label="Letter Number" isDark={isDark}>
                    <span className="text-xs font-mono">
                      {(data as WorkOrderFormData).source_ref || "—"}
                    </span>
                  </InfoField>
                  <InfoField label="Letter Date" isDark={isDark}>
                    <span className="text-xs font-mono">
                      {(data as WorkOrderFormData).source_letter_date || "—"}
                    </span>
                  </InfoField>
                  <InfoField
                    label="Letter Image"
                    className="col-span-2"
                    isDark={isDark}
                  >
                    <span className="text-xs mb-1 block">
                      {(data as WorkOrderFormData).source_letter_image || "—"}
                    </span>
                    {(data as WorkOrderFormData)
                      .source_letter_image_preview && (
                      <FilePreviewButton
                        file={{
                          name: "Letter Image",
                          url: (data as WorkOrderFormData)
                            .source_letter_image_preview,
                          type: "image/jpeg",
                        }}
                        onPreview={handleOpenPreview}
                      />
                    )}
                  </InfoField>
                </>
              ) : (
                <>
                  <InfoField label="Email Method" isDark={isDark}>
                    <Badge tone="slate" className="text-[10px]">
                      {(data as WorkOrderFormData).email_input_method}
                    </Badge>
                  </InfoField>
                  {(data as WorkOrderFormData).email_input_method ===
                    "MANUAL" && (
                    <>
                      <InfoField label="From Email" isDark={isDark}>
                        <span className="text-xs font-mono">
                          {(data as WorkOrderFormData).source_email_from || "—"}
                        </span>
                      </InfoField>
                      <InfoField label="Email Date" isDark={isDark}>
                        <span className="text-xs font-mono">
                          {(data as WorkOrderFormData).source_email_date || "—"}
                        </span>
                      </InfoField>
                    </>
                  )}
                  {(data as WorkOrderFormData).email_input_method ===
                    "UPLOAD" && (
                    <InfoField
                      label="Email File"
                      className="col-span-2"
                      isDark={isDark}
                    >
                      <span className="text-xs mb-1 block">
                        {(data as WorkOrderFormData).source_email_file || "—"}
                      </span>
                    </InfoField>
                  )}
                </>
              )}
            </div>
          </SectionCard>
        )}

        {/* Tariff Lines Summary */}
        <SectionCard
          icon="📊"
          title={`Tariff Lines (${data.tariffs.length})`}
          isDark={isDark}
        >
          {data.tariffs.length > 0 ? (
            <div
              className={`overflow-x-auto rounded-lg border ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <table className="w-full text-xs">
                <thead
                  className={
                    isDark
                      ? "bg-slate-800/50 text-slate-300"
                      : "bg-slate-100 text-slate-700"
                  }
                >
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">Unit</th>
                    <th className="px-3 py-2 text-right font-semibold">Rate</th>
                  </tr>
                </thead>
                <tbody
                  className={
                    isDark
                      ? "divide-y divide-slate-700"
                      : "divide-y divide-slate-200"
                  }
                >
                  {data.tariffs.map((t) => (
                    <tr key={t.id}>
                      <td
                        className={`px-3 py-2 ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {t.description || "—"}
                      </td>
                      <td
                        className={`px-3 py-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {t.unit}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}
                      >
                        {t.rate
                          ? formatCurrency(
                              Number(String(t.rate).replace(/,/g, "")) || 0,
                              t.currency,
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p
              className={`text-xs italic ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              No tariff lines added
            </p>
          )}
        </SectionCard>

        {/* Legal Terms (Contract only) */}
        {docType === "CONTRACT" && (
          <SectionCard icon="⚖️" title="Legal Terms" isDark={isDark}>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Price Adjustment" isDark={isDark}>
                <Badge
                  tone={
                    (data as ContractFormData).adjustment.enabled
                      ? "emerald"
                      : "slate"
                  }
                  className="text-[10px]"
                >
                  {(data as ContractFormData).adjustment.enabled
                    ? `✅ ${(data as ContractFormData).adjustment.percentage}% (${(data as ContractFormData).adjustment.mode})`
                    : "❌ Disabled"}
                </Badge>
              </InfoField>
              <InfoField label="Modification" isDark={isDark}>
                <Badge
                  tone={
                    (data as ContractFormData).contract_modification
                      .percentage > 0
                      ? "indigo"
                      : "slate"
                  }
                  className="text-[10px]"
                >
                  {(data as ContractFormData).contract_modification.percentage >
                  0
                    ? `${(data as ContractFormData).contract_modification.percentage}%`
                    : "0%"}
                </Badge>
              </InfoField>
              <InfoField label="Guarantee" isDark={isDark}>
                <Badge
                  tone={
                    (data as ContractFormData).guarantee.has_guarantee
                      ? "emerald"
                      : "slate"
                  }
                  className="text-[10px]"
                >
                  {(data as ContractFormData).guarantee.has_guarantee
                    ? `✅ ${(data as ContractFormData).guarantee.percentage}% (${GUARANTEE_TYPES.find((g: any) => g.value === (data as ContractFormData).guarantee.type)?.label || (data as ContractFormData).guarantee.type})`
                    : "❌ None"}
                </Badge>
              </InfoField>
              <InfoField label="Good Performance" isDark={isDark}>
                <Badge tone="indigo" className="text-[10px]">
                  {(data as ContractFormData).good_performance_percentage}%
                </Badge>
              </InfoField>
              <InfoField
                label="Insurance Deduction"
                className="col-span-2"
                isDark={isDark}
              >
                <Badge tone="indigo" className="text-[10px]">
                  {(data as ContractFormData).insurance_deduction_percentage}%
                </Badge>
              </InfoField>
            </div>
          </SectionCard>
        )}

        {/* Attachments & Notes (Contract only) */}
        {docType === "CONTRACT" && (
          <SectionCard icon="📎" title="Attachments & Notes" isDark={isDark}>
            <div className="space-y-3">
              <InfoField label="Attachments" isDark={isDark}>
                <Badge
                  tone={data.attachments.length > 0 ? "indigo" : "slate"}
                  className="text-[10px]"
                >
                  {data.attachments.length} file(s)
                </Badge>
                {data.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {data.attachments.map((file: any, idx: number) => (
                      <FilePreviewButton
                        key={idx}
                        file={file}
                        onPreview={handleOpenPreview}
                      />
                    ))}
                  </div>
                )}
              </InfoField>
              <InfoField label="Description" isDark={isDark}>
                <div
                  className={`text-xs p-2 rounded ${isDark ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-700"}`}
                >
                  {data.description || (
                    <span className="italic">No description provided</span>
                  )}
                </div>
              </InfoField>
            </div>
          </SectionCard>
        )}
      </div>

      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </>
  );
}
