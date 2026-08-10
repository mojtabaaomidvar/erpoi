// src/widgets/layout/Sidebar.tsx

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  ClipboardCheck,
  Receipt,
  BarChart3,
  ShieldCheck,
  Shield,
  Folder,
  Search,
  FileCheck,
} from "lucide-react";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { usePermissionMapping } from "@shared/authorization/hooks/usePermissionMapping";
import { supabase } from "@shared/database/supabase";
import { amendmentAppService } from "@/features/contract-management/application";

export type ViewKey =
  | "dashboard"
  | "clients"
  | "contracts"
  | "project"
  | "inspectors"
  | "inspections"
  | "tpi"
  | "billing"
  | "reports"
  | "audit"
  | "settings"
  | "approvals"
  | "user-management";

interface SidebarProps {
  active: ViewKey;
  onSelect: (view: ViewKey) => void;
  isExpanded: boolean;
  expiringContractsCount?: number;
}

interface NavItem {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  entity?: string;
  gradient: string;
  unitManagerOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    key: "clients",
    label: "Clients",
    icon: Users,
    entity: "client",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    key: "contracts",
    label: "Agreements",
    icon: FileText,
    entity: "contract",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    key: "project",
    label: "Projects",
    icon: Folder,
    entity: "project",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    key: "inspectors",
    label: "Inspectors",
    icon: UserCheck,
    entity: "inspector",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    key: "tpi",
    label: "TPI",
    icon: Search,
    entity: "inspector",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    key: "inspections",
    label: "Inspections",
    icon: ClipboardCheck,
    entity: "inspection",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    key: "approvals",
    label: "Approvals",
    icon: FileCheck,
    entity: "approval",
    unitManagerOnly: true,
    gradient: "from-amber-500 to-yellow-600",
  },
  {
    key: "billing",
    label: "Billing",
    icon: Receipt,
    entity: "invoice",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    key: "reports",
    label: "Reports",
    icon: BarChart3,
    entity: "report",
    gradient: "from-indigo-500 to-violet-600",
  },
  {
    key: "audit",
    label: "Audit Log",
    icon: ShieldCheck,
    entity: "audit",
    gradient: "from-slate-500 to-gray-600",
  },
];

export function Sidebar({
  active,
  onSelect,
  isExpanded,
  expiringContractsCount,
}: SidebarProps) {
  const { isDark, themePreferences } = useTheme();
  const { user } = useAuth();
  const { canAccess, isAdmin } = usePermissionMapping();

  const [pendingAmendmentsCount, setPendingAmendmentsCount] = useState(0);

  const isManagerOrAdmin =
    isAdmin || user?.role === "manager" || user?.role === "unit_manager";

  const loadPendingAmendmentsCount = async () => {
    try {
      // Prefer application service instead of direct supabase query in UI
      try {
        const pending = await amendmentAppService.getPending();
        setPendingAmendmentsCount(pending.length);
        return;
      } catch (err) {
        console.warn(
          "[Sidebar] amendmentAppService.getPending failed, falling back to direct query:",
          err,
        );
      }

      // fallback to direct query if app service is unavailable
      const { count, error } = await supabase
        .schema("contracts")
        .from("contract_amendments")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "PENDING");

      if (!error) {
        setPendingAmendmentsCount(count || 0);
      }
    } catch (error) {
      console.error(
        "[Sidebar] Failed to load pending amendments count:",
        error,
      );
    }
  };

  useEffect(() => {
    loadPendingAmendmentsCount();
    const interval = setInterval(loadPendingAmendmentsCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const visibleNavItems = navItems.filter((item) => {
    if (item.key === "dashboard") return true;

    if (item.unitManagerOnly && !isManagerOrAdmin) return false;

    if (!item.entity) return true;
    return canAccess(item.entity);
  });

  // Read sidebar style preference from theme preferences
  const sidebarStyle = themePreferences?.sidebarStyle ?? "floating";

  // Compute variant classes and inline styles so changes are visible immediately
  const variantClass =
    sidebarStyle === "floating"
      ? "rounded-2xl shadow-2xl mx-3 my-3 backdrop-blur bg-opacity-95"
      : sidebarStyle === "inset"
        ? "rounded-none shadow-none"
        : "";

  const topValue =
    sidebarStyle === "floating"
      ? "calc(var(--header-height) + 1rem)"
      : "var(--header-height)";
  const leftValue = sidebarStyle === "floating" ? "0.5rem" : "0";
  const heightValue =
    sidebarStyle === "floating"
      ? "calc(100vh - var(--header-height) - 1rem)"
      : "calc(100vh - var(--header-height))";

  return (
    <aside
      className={`fixed z-30 flex flex-col transition-all duration-300 ${
        isExpanded ? "w-64" : "w-20"
      } ${
        isDark
          ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50"
          : "bg-gradient-to-b from-white via-slate-50 to-white border-r border-slate-200/70"
      } ${variantClass}`}
      style={{ top: topValue, left: leftValue, height: heightValue }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;

          const isContracts = item.key === "contracts";
          const hasExpiringContracts = (expiringContractsCount ?? 0) > 0;
          const hasPendingAmendments = pendingAmendmentsCount > 0;

          const showBadge = isContracts
            ? hasExpiringContracts || hasPendingAmendments
            : !!item.badge;

          const badgeText = isContracts
            ? hasPendingAmendments
              ? pendingAmendmentsCount
              : expiringContractsCount
            : item.badge;

          const isAmendmentBadge = isContracts && hasPendingAmendments;
          const isAlert =
            isContracts && hasExpiringContracts && !hasPendingAmendments;

          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={!isExpanded ? item.label : undefined}
              className={`group relative w-full flex items-center rounded-xl transition-all duration-300 ${
                isExpanded ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
              } ${
                isActive
                  ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                  : isDark
                    ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-white shadow-lg" />
              )}

              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  isActive
                    ? "bg-white/20 shadow-inner"
                    : isDark
                      ? "bg-slate-800/50 group-hover:bg-slate-700/50"
                      : "bg-slate-100 group-hover:bg-white group-hover:shadow-sm"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-all ${
                    isActive
                      ? "text-white"
                      : isDark
                        ? "text-slate-400 group-hover:text-slate-200"
                        : "text-slate-500 group-hover:text-slate-700"
                  }`}
                />
              </div>

              {isExpanded && (
                <>
                  <span className="flex-1 text-left text-sm font-medium truncate">
                    {item.label}
                  </span>

                  {showBadge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                        isAmendmentBadge
                          ? "bg-amber-500/20 text-amber-300 ring-amber-500/40 animate-pulse"
                          : isAlert
                            ? "bg-rose-500/20 text-rose-300 ring-rose-500/40 animate-pulse"
                            : isActive
                              ? "bg-white/20 text-white ring-white/30"
                              : isDark
                                ? "bg-slate-700 text-slate-300 ring-slate-600"
                                : "bg-slate-200 text-slate-700 ring-slate-300"
                      }`}
                    >
                      {badgeText}
                    </span>
                  )}
                </>
              )}

              {!isExpanded && showBadge && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    isAmendmentBadge
                      ? "bg-amber-500 animate-pulse"
                      : isAlert
                        ? "bg-rose-500 animate-pulse"
                        : isActive
                          ? "bg-white"
                          : "bg-indigo-500"
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER - User Management (Admin Only) */}
      <div
        className={`border-t ${isDark ? "border-slate-800/50" : "border-slate-200/70"}`}
      >
        {isAdmin ? (
          <div className="p-3">
            <button
              onClick={() => onSelect("user-management")}
              title={!isExpanded ? "User Management" : undefined}
              className={`group relative w-full flex items-center rounded-xl transition-all duration-300 ${
                isExpanded ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
              } ${
                active === "user-management"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                  : isDark
                    ? "text-slate-400 hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-pink-900/30 hover:text-purple-300"
                    : "text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700"
              }`}
            >
              {active === "user-management" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-white shadow-lg" />
              )}

              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  active === "user-management"
                    ? "bg-white/20 shadow-inner"
                    : isDark
                      ? "bg-purple-900/30 group-hover:bg-purple-800/40"
                      : "bg-purple-100 group-hover:bg-purple-200"
                }`}
              >
                <Shield
                  className={`h-4 w-4 transition-all ${
                    active === "user-management"
                      ? "text-white"
                      : isDark
                        ? "text-purple-400"
                        : "text-purple-600"
                  }`}
                />
              </div>

              {isExpanded && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">
                    User Management
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                      active === "user-management"
                        ? "bg-white/20 text-white"
                        : isDark
                          ? "bg-purple-900/50 text-purple-300"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    ADMIN
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-3">
            <div
              className={`flex items-center justify-center rounded-xl py-2.5 ${
                isDark ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {isExpanded && (
                <span className="text-[10px] uppercase font-semibold tracking-wider">
                  {user?.role === "unit_manager" || user?.role === "manager"
                    ? "Unit Manager"
                    : user?.role || "User"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
