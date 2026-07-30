//src/features/tpi-management/ui/components/InspectionMethodSelector.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import type { SystemListItem } from "@/shared/repositories/MasterDataRepository";

interface InspectionMethodSelectorProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: SystemListItem[];
  isLoading: boolean;
  error?: string;
}

// آیکون‌های مرتبط با روش‌های بازرسی
const METHOD_ICONS: Record<string, string> = {
  "Visual Inspection": "👁️",
  "Dimensional Inspection": "📏",
  "Document Review": "📋",
  "Functional Verification": "⚙️",
  "Hydrostatic Test": "💧",
  "Laboratory Test": "🧪",
  "Marking / ID Verification": "🏷️",
  "NDT (PT, MT, ...)": "🔬",
  "Performance Verification": "📊",
  PMI: "🧬",
  Quantity: "🔢",
  Sampling: "🎯",
  Default: "🔍",
};

export function InspectionMethodSelector({
  value,
  onChange,
  options,
  isLoading,
  error,
}: InspectionMethodSelectorProps) {
  const { isDark } = useTheme();

  const handleToggle = (methodValue: string) => {
    if (value.includes(methodValue)) {
      onChange(value.filter((v) => v !== methodValue));
    } else {
      onChange([...value, methodValue]);
    }
  };

  const getIcon = (methodValue: string) => {
    return METHOD_ICONS[methodValue] || METHOD_ICONS["Default"];
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <span className="text-xs text-slate-500 animate-pulse">
          Loading methods...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map((method) => {
          const isSelected = value.includes(method.value);
          const icon = getIcon(method.value);

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleToggle(method.value)}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? isDark
                    ? "border-indigo-500 bg-indigo-900/30 shadow-lg"
                    : "border-indigo-500 bg-indigo-50 shadow-lg"
                  : isDark
                    ? "border-slate-700 bg-slate-800 hover:border-slate-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* آیکون */}
              <div className="text-2xl mb-2">{icon}</div>

              {/* نام متد */}
              <div
                className={`text-sm font-semibold mb-1 ${
                  isSelected
                    ? isDark
                      ? "text-indigo-200"
                      : "text-indigo-900"
                    : isDark
                      ? "text-slate-200"
                      : "text-slate-700"
                }`}
              >
                {method.value}
              </div>

              {/* تیک انتخاب */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isDark ? "bg-indigo-500" : "bg-indigo-600"
                    }`}
                  >
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-[11px] text-rose-600 mt-1.5">✕ {error}</p>}
    </div>
  );
}
