// src/features/contract-management/ui/contract-add-form/components/ProgressBar.tsx

import { useTheme } from "@app/providers/ThemeProvider";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function ProgressBar({
  currentStep,
  totalSteps,
  steps,
}: ProgressBarProps) {
  const { isDark } = useTheme();

  // 🔧 FIX: جلوگیری از تقسیم بر صفر و گرد کردن درصد
  const progressPercentage =
    totalSteps > 1
      ? Math.round(((currentStep - 1) / (totalSteps - 1)) * 100)
      : 100;

  return (
    <div className="mb-6">
      {/* مرحله‌ها */}
      <div className="flex items-center justify-between mb-2 relative">
        {/* خط پس‌زمینه برای اتصال دایره‌ها */}
        <div
          className={`absolute top-4 left-0 right-0 h-0.5 -z-10 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />

        {steps.map((label, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div
              key={label}
              className="flex flex-col items-center flex-1 relative"
            >
              {/* دایره شماره مرحله */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : isCompleted
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isDark
                        ? "bg-slate-800 border-slate-600 text-slate-400"
                        : "bg-white border-slate-300 text-slate-500"
                }`}
              >
                {isCompleted ? "✓" : stepNum}
              </div>

              {/* لیبل مرحله */}
              <span
                className={`text-[10px] mt-2 font-medium hidden sm:block transition-colors ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* نوار پیشرفت */}
      <div
        className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
