import { LayoutDashboard, Users, FileText, UserCheck, ClipboardCheck, Receipt, BarChart3, ShieldCheck } from "lucide-react";
import { cn } from "../lib/cn";
import { useTheme } from "../contexts/ThemeContext";

export type ViewKey = "dashboard" | "clients" | "contracts" | "inspectors" | "inspections" | "billing" | "reports";

interface SidebarProps {
  active: ViewKey;
  onSelect: (key: ViewKey) => void;
  isExpanded: boolean;
}

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard; badge?: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "clients", label: "Clients", icon: Users },
  { key: "contracts", label: "Contracts", icon: FileText },
  { key: "inspectors", label: "Inspectors", icon: UserCheck },
  { key: "inspections", label: "Workflow", icon: ClipboardCheck, badge: "3" },
  { key: "billing", label: "Billing", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ active, onSelect, isExpanded }: SidebarProps) {
  const { isDark } = useTheme();

  return (
    <aside className={cn(
      "flex h-screen shrink-0 flex-col border-r transition-all duration-300",
      isExpanded ? "w-64" : "w-20",
      isDark
        ? "border-slate-800 bg-slate-950 text-slate-300"
        : "border-slate-200 bg-white text-slate-700"
    )}>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-900/50">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        {isExpanded && (
          <div>
            <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>ICS</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Offshore & Energy
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        <div className={cn(
          "px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider",
          isDark ? "text-slate-500" : "text-slate-400",
          !isExpanded && "text-center"
        )}>
          {isExpanded ? "Operations" : "•••"}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                "group flex w-full items-center rounded-lg transition-colors",
                isExpanded ? "gap-3 px-2.5 py-2 text-sm" : "justify-center px-2 py-2.5",
                isActive
                  ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600"
                  : isDark
                    ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-indigo-500" : isDark ? "text-slate-500" : "text-slate-400"
              )} />
              {isExpanded && <span className="flex-1 text-left">{item.label}</span>}
              {item.badge && isExpanded && (
                <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-500 ring-1 ring-inset ring-rose-500/30">
                  {item.badge}
                </span>
              )}
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
            </button>
          );
        })}
      </nav>

      <div className={cn("border-t p-3", isDark ? "border-slate-800" : "border-slate-200")}>
        <div className={cn(
          "flex items-center rounded-lg p-2 transition-colors",
          isExpanded ? "gap-3" : "justify-center",
          isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-100"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
            MO
          </div>
          {isExpanded && (
            <>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-medium ${isDark ? "text-white" : "text-slate-900"}`}>Mojtaba Omidvar</div>
                <div className="text-[10px] text-slate-500">Department Manager</div>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}