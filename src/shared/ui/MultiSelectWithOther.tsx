//// src/shared/ui/MultiSelectWithOther.tsx

import { useState } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { showToast } from "@shared/ui/ToastContainer";
import { approvalAppService } from "@/features/master-data/application/ApprovalApplicationService";
import type { ApprovalFieldType } from "@/features/master-data/domain/types";
import { sortSpecialties } from "../utils/formatUtils";

interface MultiSelectWithOtherProps<T extends string> {
  options: readonly T[];
  value: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  otherPrefix?: string;
  maxOthers?: number;
  fieldType?: ApprovalFieldType;
  isBlocking?: boolean;
  onPendingChange?: (hasPending: boolean) => void;
}

export function MultiSelectWithOther<T extends string>({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  otherPrefix = "Others:",
  maxOthers = 10,
  fieldType = "TPI_DISCIPLINE",
  isBlocking = false,
  onPendingChange,
}: MultiSelectWithOtherProps<T>) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInputValue, setOtherInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedOptions =
    fieldType === "INSPECTOR_SPECIALTY"
      ? (sortSpecialties(
          options as unknown as string[],
        ) as unknown as readonly T[])
      : options;

  const otherCount = value.filter((v) => v.startsWith(otherPrefix)).length;

  const toggleOption = (option: T) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleAddOther = async () => {
    const trimmed = otherInputValue.trim();
    if (!trimmed) return;
    if (otherCount >= maxOthers) return;

    setIsSubmitting(true);
    try {
      await approvalAppService.requestApproval(
        fieldType,
        trimmed,
        user?.id || "unknown",
      );

      const otherValue = `${otherPrefix}${trimmed}` as T;
      onChange([...value, otherValue]);

      setOtherInputValue("");
      setShowOtherInput(false);

      if (isBlocking && onPendingChange) {
        onPendingChange(true);
      }

      showToast(
        "success",
        isBlocking ? "Approval Required" : "Request Submitted",
        isBlocking
          ? `"${trimmed}" requires manager approval. You cannot proceed until it is approved.`
          : `"${trimmed}" has been sent for approval. You can continue for now.`,
      );
    } catch (err: any) {
      showToast("error", "Request Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveOther = (otherValue: T) => {
    onChange(value.filter((v) => v !== otherValue));
  };

  const otherValues = value
    .filter((v) => v.startsWith(otherPrefix))
    .map((v) => v.replace(otherPrefix, ""));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : isDark
                    ? "bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-500"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400"
              }`}
            >
              {isSelected && "✓ "}
              {option}
            </button>
          );
        })}

        {otherCount < maxOthers && (
          <button
            type="button"
            onClick={() => setShowOtherInput(!showOtherInput)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showOtherInput
                ? "bg-amber-600 text-white border-amber-600"
                : isDark
                  ? "bg-amber-900/30 text-amber-300 border-amber-700 hover:bg-amber-900/50"
                  : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {showOtherInput ? "✕ Cancel" : "➕ Others"}
          </button>
        )}
      </div>

      {otherValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {otherValues.map((val, idx) => (
            <div
              key={idx}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                isDark
                  ? "bg-amber-900/30 text-amber-300 border border-amber-700"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              <span>📝 {val}</span>
              <span className="text-[9px] opacity-70">(Pending)</span>
              <button
                type="button"
                onClick={() => handleRemoveOther(`${otherPrefix}${val}` as T)}
                className="text-amber-600 hover:text-rose-600 font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showOtherInput && (
        <div
          className={`flex gap-2 p-3 rounded-lg border ${
            isDark
              ? "bg-slate-800/50 border-slate-700"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <input
            type="text"
            value={otherInputValue}
            onChange={(e) => setOtherInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddOther();
              }
            }}
            placeholder="Enter custom value..."
            className="flex-1 rounded px-3 py-1.5 text-sm input-themed"
            autoFocus
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={handleAddOther}
            disabled={!otherInputValue.trim() || isSubmitting}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "⏳ Adding..." : "✓ Add"}
          </button>
        </div>
      )}
    </div>
  );
}
