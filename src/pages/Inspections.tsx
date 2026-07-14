// src/pages/Inspections.tsx

import { useTheme } from "@app/providers/ThemeProvider";

export function Inspections() {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div
        className={`rounded-2xl border p-12 text-center max-w-md ${
          isDark
            ? "border-slate-700 bg-slate-800/30"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="text-6xl mb-4">🔍</div>
        <h2
          className={`text-2xl font-bold mb-2 ${
            isDark ? "text-slate-100" : "text-slate-900"
          }`}
        >
          Inspections
        </h2>
        <p
          className={`text-sm mb-6 ${
            isDark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          This module is under development and will be available soon.
        </p>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ${
            isDark
              ? "bg-amber-900/30 text-amber-300"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          <span>⏳</span>
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
