// src/features/tpi-management/ui/components/SessionSelector.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import { useActiveSession } from "@/features/inspection-management/context/ActiveSessionContext";
import { formatJalaliDate } from "@/shared/utils/dateUtils";

interface SessionSelectorProps {
  onCreateNew: () => void;
}

export function SessionSelector({ onCreateNew }: SessionSelectorProps) {
  const { isDark } = useTheme();
  const { sessions, activeSession, switchSession, loading } =
    useActiveSession();

  // If no sessions exist, show a CTA
  if (!loading && sessions.length === 0) {
    return (
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${
          isDark
            ? "bg-amber-900/20 border-amber-800/40"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">📅</span>
          <div>
            <p
              className={`text-xs font-bold ${
                isDark ? "text-amber-300" : "text-amber-800"
              }`}
            >
              No sessions yet
            </p>
            <p
              className={`text-[10px] ${
                isDark ? "text-amber-400" : "text-amber-600"
              }`}
            >
              Create the first inspection session to get started
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCreateNew}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isDark
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            ➕ Start Session 1
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex items-center gap-3 px-4 py-2.5 border-b ${
          isDark
            ? "border-slate-700 bg-slate-900/30"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500">Loading sessions...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-2 border-b overflow-x-auto ${
        isDark
          ? "border-slate-700 bg-slate-900/30"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">
        📅 Sessions
      </span>

      {sessions.map((session) => {
        const isActive = activeSession?.id === session.id;
        const isCancelled = session.status === "CANCELLED";

        return (
          <button
            key={session.id}
            onClick={() => switchSession(session.id)}
            title={`Session ${session.session_number}: ${formatJalaliDate(session.session_date)}`}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? isDark
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-indigo-500 text-white shadow-md"
                : isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } ${isCancelled ? "opacity-60" : ""}`}
          >
            <span
              className={`text-[11px] ${
                isActive
                  ? "text-white"
                  : isDark
                    ? "text-slate-300"
                    : "text-slate-700"
              }`}
            >
              #{session.session_number}
            </span>
            <span className="text-[10px] opacity-70">•</span>
            <span
              className={`text-[11px] ${
                isActive
                  ? "text-white/90"
                  : isDark
                    ? "text-slate-400"
                    : "text-slate-500"
              }`}
            >
              {formatJalaliDate(session.session_date)}
            </span>
            {isCancelled && <span className="text-[10px]">🚫</span>}
          </button>
        );
      })}
    </div>
  );
}
