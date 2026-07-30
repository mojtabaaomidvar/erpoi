//src/features/tpi-management/ui/components/InspectionStageSelector.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import type { SystemListItem } from "@/shared/repositories/MasterDataRepository";

interface InspectionStageSelectorProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: SystemListItem[];
  isLoading: boolean;
  error?: string;
}

// آیکون‌های مرتبط با مراحل بازرسی
const STAGE_ICONS: Record<string, string> = {
  "Pre-Inspection Meeting": "📋",
  "In-Process": "⚙️",
  "Pre-Shipment": "📦",
  "Final Inspection": "✅",
  Default: "🔍",
};

export function InspectionStageSelector({
  value,
  onChange,
  options,
  isLoading,
  error,
}: InspectionStageSelectorProps) {
  const { isDark } = useTheme();

  const handleToggle = (stageValue: string) => {
    if (value.includes(stageValue)) {
      onChange(value.filter((v) => v !== stageValue));
    } else {
      onChange([...value, stageValue]);
    }
  };

  const getIcon = (stageValue: string) => {
    return STAGE_ICONS[stageValue] || STAGE_ICONS["Default"];
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <span className="text-xs text-slate-500 animate-pulse">
          Loading stages...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {options.map((stage) => {
          const isSelected = value.includes(stage.value);
          const icon = getIcon(stage.value);

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => handleToggle(stage.value)}
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

              {/* نام مرحله */}
              <div
                className={`text-sm font-semibold ${
                  isSelected
                    ? isDark
                      ? "text-indigo-200"
                      : "text-indigo-900"
                    : isDark
                      ? "text-slate-200"
                      : "text-slate-700"
                }`}
              >
                {stage.value}
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
