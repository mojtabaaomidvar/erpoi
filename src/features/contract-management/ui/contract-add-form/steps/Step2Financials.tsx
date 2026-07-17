// src/features/contract-management/ui/contract-add-form/steps/Step2Financials.tsx

import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { TariffEditor } from "@entities/contract/ui/TariffEditor";
import { useTheme } from "@app/providers/ThemeProvider";
import type { StepProps, ContractFormData } from "../types";
import {
  formatNumberInput,
  parseNumberInput,
} from "@entities/contract/services/contractCalculations";
import { CURRENCIES } from "../constants";

export function Step2Financials({
  docType,
  formData,
  updateCurrentFormData,
  errors,
  isEditMode = false,
}: StepProps) {
  const { isDark } = useTheme();
  const data = formData[docType];

  const contractData =
    docType === "CONTRACT" ? (data as ContractFormData) : null;

  return (
    <div className="space-y-4">
      {/* Contract-specific: Dates and Value */}
      {docType === "CONTRACT" && contractData && (
        <>
          <div
            className={`rounded-lg border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
          >
            <h3
              className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              📅 Contract Duration & Value
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  Start Date *
                </label>
                <JalaaliDatePicker
                  value={contractData.start_date}
                  onChange={(date) =>
                    !isEditMode && updateCurrentFormData({ start_date: date })
                  }
                  disabled={isEditMode}
                  placeholder="Select start date"
                />
                {errors.start_date && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {errors.start_date}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  End Date *
                </label>
                <JalaaliDatePicker
                  value={contractData.end_date}
                  onChange={(date) => updateCurrentFormData({ end_date: date })}
                  minDate={contractData.start_date}
                  placeholder={
                    contractData.start_date
                      ? "Select end date"
                      : "Select start date first"
                  }
                  disabled={!contractData.start_date}
                />
                {errors.end_date && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {errors.end_date}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  Total Value *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberInput(contractData.total_value)} // 🔧 FIX: هندل کردن عدد مستقیم
                  onChange={(e) =>
                    updateCurrentFormData({
                      total_value: parseNumberInput(e.target.value),
                    })
                  }
                  className={`w-full rounded-lg px-3 py-2 text-sm font-mono text-right input-themed ${errors.total_value ? "border-rose-300" : ""}`}
                  placeholder="0"
                />
                {errors.total_value && (
                  <p className="mt-1 text-[11px] font-medium text-rose-600">
                    ✕ {errors.total_value}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-primary">
                  Currency
                </label>
                <select
                  value={contractData.currency}
                  onChange={(e) =>
                    updateCurrentFormData({ currency: e.target.value })
                  }
                  className="w-full rounded-lg px-3 py-2 text-sm input-themed"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.symbol} {curr.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Work Order Info */}
      {docType === "WORK_ORDER" && (
        <div
          className={`rounded-lg border-2 border-dashed p-6 text-center ${isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-300 bg-slate-50/50"}`}
        >
          <div className="text-3xl mb-2">📦</div>
          <p
            className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Work Order Financial Details
          </p>
          <p
            className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
          >
            Financial details will be calculated from tariff lines
          </p>
        </div>
      )}

      {/* Tariff Editor */}
      <div>
        <h3
          className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          📊 Tariff Lines
        </h3>
        <TariffEditor
          tariffs={data.tariffs}
          onChange={(tariffs) =>
            updateCurrentFormData({ tariffs: tariffs as any })
          }
          error={errors.tariffs}
        />
      </div>
    </div>
  );
}
