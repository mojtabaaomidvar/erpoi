// src/pages/Settings.tsx

import { useTheme } from "@app/providers/ThemeProvider";

export function Settings() {
  const { isDark } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          ⚙️ Settings
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Application preferences and configuration
        </p>
      </div>

      <div className={`rounded-xl border p-8 text-center ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
        <div className="text-6xl mb-4">🚧</div>
        <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          Coming Soon
        </h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          This page is under construction. Settings will be available soon.
        </p>
      </div>
    </div>
  );
}