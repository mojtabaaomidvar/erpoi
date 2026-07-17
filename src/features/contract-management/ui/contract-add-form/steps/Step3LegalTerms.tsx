// src/features/contract-management/ui/contract-add-form/steps/Step3LegalTerms.tsx

import { useState, useEffect } from "react";
import { JalaaliDatePicker } from "@shared/ui/JalaaliDatePicker";
import { useTheme } from "@app/providers/ThemeProvider";
import type { StepProps } from "../types";
import {
  formatNumberInput,
  parseNumberInput,
  getNextJalaaliYearStart,
} from "@entities/contract/services/contractCalculations";
import { formatCurrency } from "@shared/lib/formatters";
import { GUARANTEE_TYPES, ADJUSTMENT_MODES } from "../constants";

// 🔧 NEW: کامپوننت اختصاصی برای ورودی درصد که مشکل تایپ نقطه را حل می‌کند
// src/features/contract-management/ui/contract-add-form/steps/Step3LegalTerms.tsx

// ... (بخش ایمپورت‌ها بدون تغییر)

function PercentageInput({
  label,
  value,
  onChange,
  placeholder = "0.00",
  showCurrencyCalc = false,
  totalValue = 0,
  currency = "IRR",
}: {
  label: string;
  value: number | string;
  onChange: (val: number) => void;
  placeholder?: string;
  showCurrencyCalc?: boolean;
  totalValue?: number;
  currency?: string;
}) {
  const { isDark } = useTheme();
  const [rawValue, setRawValue] = useState(String(value ?? ""));

  useEffect(() => {
    setRawValue(String(value ?? ""));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setRawValue(val);
      onChange(val === "" ? 0 : parseFloat(val));
    }
  };

  // 🔧 FIX: تبدیل value به Number برای محاسبات
  const numValue = Number(value || 0);

  return (
    <div>
      <label
        className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={rawValue}
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 pr-8 text-sm font-mono text-right input-themed"
          placeholder={placeholder}
        />
        <span
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          %
        </span>
      </div>
      {showCurrencyCalc && totalValue > 0 && numValue > 0 && (
        <p
          className={`text-[10px] mt-1 font-semibold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
        >
          ≈ {formatCurrency((totalValue * numValue) / 100, currency)}
        </p>
      )}
    </div>
  );
}

// ... (بقیه کد Step3LegalTerms بدون تغییر)

export function Step3LegalTerms({
  docType,
  formData,
  updateCurrentFormData,
  errors,
}: StepProps) {
  const { isDark } = useTheme();

  if (docType !== "CONTRACT") {
    return (
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center ${isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-300 bg-slate-50/50"}`}
      >
        <div className="text-3xl mb-2">⚖️</div>
        <p
          className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
        >
          Legal Terms
        </p>
        <p
          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          This section is only available for Contracts
        </p>
      </div>
    );
  }

  const data = formData.CONTRACT;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-lg border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
      >
        <h3
          className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          💼 Financial & Legal Terms
        </h3>

        {/* Price Adjustment & Contract Modification */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Price Adjustment */}
          <div
            className={`rounded-lg border p-4 ${data.adjustment.enabled ? (isDark ? "border-indigo-700 bg-indigo-950/30" : "border-indigo-200 bg-indigo-50/30") : isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-200 bg-slate-50/20"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📊</span>
                <h4
                  className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  Price Adjustment
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newEnabled = !data.adjustment.enabled;
                  const effectiveDate =
                    newEnabled &&
                    !data.adjustment.effective_date &&
                    data.start_date
                      ? getNextJalaaliYearStart(data.start_date)
                      : data.adjustment.effective_date;
                  updateCurrentFormData({
                    adjustment: {
                      ...data.adjustment,
                      enabled: newEnabled,
                      effective_date: effectiveDate,
                    },
                  });
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.adjustment.enabled ? "bg-indigo-600" : isDark ? "bg-slate-700" : "bg-slate-300"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.adjustment.enabled ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {data.adjustment.enabled && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {ADJUSTMENT_MODES.map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() =>
                        updateCurrentFormData({
                          adjustment: {
                            ...data.adjustment,
                            mode: mode.value,
                            percentage:
                              mode.value === "TBD"
                                ? 0
                                : data.adjustment.percentage,
                          },
                        })
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${data.adjustment.mode === mode.value ? (mode.value === "FIXED" ? "bg-indigo-600 text-white shadow-md" : "bg-amber-600 text-white shadow-md") : isDark ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-600"}`}
                    >
                      {mode.icon} {mode.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    {/* 🔧 استفاده از کامپوننت جدید PercentageInput */}
                    <PercentageInput
                      label="Percentage (%)"
                      value={data.adjustment.percentage}
                      onChange={(val) =>
                        updateCurrentFormData({
                          adjustment: { ...data.adjustment, percentage: val },
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label
                      className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Effective Date
                    </label>
                    <JalaaliDatePicker
                      value={data.adjustment.effective_date || ""}
                      onChange={(date) =>
                        updateCurrentFormData({
                          adjustment: {
                            ...data.adjustment,
                            effective_date: date,
                          },
                        })
                      }
                      placeholder="Select date"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contract Modification */}
          <div
            className={`rounded-lg border p-4 ${(data.contract_modification.percentage || 0) > 0 ? (isDark ? "border-indigo-700 bg-indigo-950/30" : "border-indigo-200 bg-indigo-50/30") : isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-200 bg-slate-50/20"}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🔄</span>
              <h4
                className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Contract Modification
              </h4>
            </div>
            {/* 🔧 استفاده از کامپوننت جدید PercentageInput */}
            <PercentageInput
              label="Percentage (%)"
              value={data.contract_modification.percentage}
              onChange={(val) =>
                updateCurrentFormData({
                  contract_modification: { percentage: val },
                })
              }
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Guarantee */}
        <div
          className={`rounded-lg border p-4 mb-4 ${data.guarantee.has_guarantee ? (isDark ? "border-emerald-700 bg-emerald-950/30" : "border-emerald-200 bg-emerald-50/30") : isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-200 bg-slate-50/20"}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🏦</span>
              <h4
                className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                Performance Guarantee
              </h4>
              {data.total_value <= 0 && (
                <span
                  className={`text-[10px] ${isDark ? "text-amber-400" : "text-amber-600"}`}
                >
                  ⚠️ Enter Total Value first
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (data.total_value <= 0) return;
                updateCurrentFormData({
                  guarantee: {
                    ...data.guarantee,
                    has_guarantee: !data.guarantee.has_guarantee,
                  },
                });
              }}
              disabled={data.total_value <= 0}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.total_value <= 0 ? "opacity-40 cursor-not-allowed bg-slate-400" : data.guarantee.has_guarantee ? "bg-emerald-600" : isDark ? "bg-slate-700" : "bg-slate-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.guarantee.has_guarantee ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {data.guarantee.has_guarantee && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                {/* 🔧 استفاده از کامپوننت جدید PercentageInput با نمایش محاسبه ارزی */}
                <PercentageInput
                  label="Percentage (%)"
                  value={data.guarantee.percentage}
                  onChange={(val) =>
                    updateCurrentFormData({
                      guarantee: { ...data.guarantee, percentage: val },
                    })
                  }
                  placeholder="0.00"
                  showCurrencyCalc={true}
                  totalValue={data.total_value}
                  currency={data.currency}
                />
              </div>
              <div>
                <label
                  className={`mb-1 block text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                >
                  Guarantee Type
                </label>
                <select
                  value={data.guarantee.type}
                  onChange={(e) =>
                    updateCurrentFormData({
                      guarantee: {
                        ...data.guarantee,
                        type: e.target.value as any,
                      },
                    })
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm input-themed"
                >
                  {GUARANTEE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Good Performance & Insurance */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-lg border p-4 ${isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-200 bg-slate-50/20"}`}
          >
            {/* 🔧 استفاده از کامپوننت جدید PercentageInput */}
            <PercentageInput
              label="Good Performance (%)"
              value={data.good_performance_percentage}
              onChange={(val) =>
                updateCurrentFormData({ good_performance_percentage: val })
              }
              placeholder="10.00"
            />
          </div>

          <div
            className={`rounded-lg border p-4 ${isDark ? "border-slate-700 bg-slate-800/20" : "border-slate-200 bg-slate-50/20"}`}
          >
            {/* 🔧 استفاده از کامپوننت جدید PercentageInput */}
            <PercentageInput
              label="Insurance Deduction (%)"
              value={data.insurance_deduction_percentage}
              onChange={(val) =>
                updateCurrentFormData({ insurance_deduction_percentage: val })
              }
              placeholder="16.67"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
