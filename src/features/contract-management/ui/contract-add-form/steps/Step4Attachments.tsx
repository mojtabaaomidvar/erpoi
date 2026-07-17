// src/features/contract-management/ui/contract-add-form/steps/Step4Attachments.tsx

import { ContractAttachmentsEditor } from "@entities/contract/ui/ContractAttachmentsEditor";
import { useTheme } from "@app/providers/ThemeProvider";
import type { StepProps } from "../types";

export function Step4Attachments({
  docType,
  formData,
  updateCurrentFormData,
  errors,
}: StepProps) {
  const { isDark } = useTheme();
  const data = formData[docType];

  // ═══════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* Attachments Editor */}
      <div>
        <h3
          className={`text-sm font-bold mb-3 flex items-center gap-2 ${
            isDark ? "text-slate-100" : "text-slate-900"
          }`}
        >
          📎 Attachments
        </h3>
        <ContractAttachmentsEditor
          attachments={data.attachments as any}
          onChange={(attachments) => updateCurrentFormData({ attachments })}
        />
      </div>

      {/* Contract Numbers (فقط Contract) */}
      {docType === "CONTRACT" && (
        <div
          className={`rounded-lg border p-4 ${
            isDark
              ? "border-slate-700 bg-slate-800/30"
              : "border-slate-200 bg-slate-50/50"
          }`}
        >
          <h3
            className={`text-sm font-bold mb-3 flex items-center gap-2 ${
              isDark ? "text-slate-100" : "text-slate-900"
            }`}
          >
            📋 Contract Numbers
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Internal Contract No. (Read-only) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Internal Contract No. (ICS)
              </label>
              <div
                className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono font-semibold ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-200"
                    : "border-slate-200 bg-slate-100 text-slate-800"
                }`}
              >
                {data.contract_no}
              </div>
              <p
                className={`text-[10px] mt-1 ${
                  isDark ? "text-slate-500" : "text-slate-500"
                }`}
              >
                Auto-generated, Unique per ICS Department
              </p>
            </div>

            {/* External Contract No. (Editable) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                External Contract No (Optional)
              </label>
              <input
                value={data.external_contract_no}
                onChange={(e) =>
                  updateCurrentFormData({
                    external_contract_no: e.target.value,
                  })
                }
                className={`w-full rounded-lg border px-3 py-2.5 text-sm font-mono input-themed`}
                placeholder="Client's Contract No."
              />
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-primary">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) =>
            updateCurrentFormData({ description: e.target.value })
          }
          rows={4}
          className={`w-full rounded-lg px-3 py-2 text-sm input-themed ${
            isDark
              ? "border-slate-700 bg-slate-800 text-slate-100"
              : "border-slate-200 bg-white text-slate-900"
          }`}
          placeholder="Optional description..."
        />
        <p
          className={`text-[10px] mt-1 ${
            isDark ? "text-slate-500" : "text-slate-500"
          }`}
        >
          Additional notes or details about this{" "}
          {docType === "CONTRACT" ? "contract" : "work order"}
        </p>
      </div>
    </div>
  );
}
