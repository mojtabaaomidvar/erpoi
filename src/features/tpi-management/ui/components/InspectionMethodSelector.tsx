//src/features/tpi-management/ui/components/InspectionMethodSelector.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import type { SystemListItem } from "@/shared/repositories/MasterDataRepository";

interface InspectionMethodSelectorProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: SystemListItem[];
  isLoading: boolean;
  error?: string;
  /** Smaller tiles (used inside New Inspection Session) */
  compact?: boolean;
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
  compact = false,
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
      <div
        className={`grid ${
          compact
            ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
            : "grid-cols-2 md:grid-cols-3 gap-3"
        }`}
      >
        {options.map((method) => {
          const isSelected = value.includes(method.value);
          const icon = getIcon(method.value);

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => handleToggle(method.value)}
              className={`relative ${
                compact ? "p-2 rounded-md border" : "p-4 rounded-lg border-2"
              } transition-all text-left ${
                isSelected
                  ? isDark
                    ? "border-indigo-500 bg-indigo-900/30 shadow-lg"
                    : "border-indigo-500 bg-indigo-50 shadow-lg"
                  : isDark
                    ? "border-slate-700 bg-slate-800 hover:border-slate-600"
                    : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div
                className={`${
                  compact ? "text-[11px]" : "text-sm"
                } font-semibold mb-1 ${
                  isSelected
                    ? isDark
                      ? "text-indigo-200"
                      : "text-indigo-900"
                    : isDark
                      ? "text-slate-200"
                      : "text-slate-700"
                }`}
              >
                 {icon} {method.value}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-[11px] text-rose-600 mt-1.5">✕ {error}</p>}
    </div>
  );
}
