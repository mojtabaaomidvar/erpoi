import { Search, Bell, HelpCircle, Command, Menu, PanelLeftClose, ShieldCheck, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

export function Header({ title, subtitle, action, isSidebarExpanded, onToggleSidebar }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={`flex items-center justify-between border-b px-8 py-4 backdrop-blur transition-colors ${
      isDark 
        ? "border-slate-800 bg-slate-900/80" 
        : "border-slate-200 bg-white/80"
    }`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
            isDark
              ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          }`}
          title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarExpanded ? <PanelLeftClose className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div>
          <h1 className={`text-xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h1>
          {subtitle && <p className={`mt-0.5 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
            isDark ? "text-slate-500" : "text-slate-400"
          }`} />
          <input
            placeholder="Search clients, contracts, inspections…"
            className={`w-80 rounded-lg border py-2 pl-9 pr-20 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-200 placeholder-slate-500"
                : "border-slate-200 bg-white text-slate-700 placeholder-slate-400"
            }`}
          />
          <span className={`absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] md:inline-flex ${
            isDark
              ? "border-slate-700 bg-slate-800 text-slate-400"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}>
            <Command className="h-3 w-3" /> K
          </span>
        </div>

        {/* 🔑 دکمه تغییر تم */}
        <button
          onClick={toggleTheme}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
            isDark
              ? "border-slate-700 bg-slate-800 text-amber-400 hover:bg-slate-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          }`}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
          isDark
            ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}>
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <button className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
          isDark
            ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        }`}>
          <HelpCircle className="h-4 w-4" />
        </button>
        {action}
      </div>
    </header>
  );
}