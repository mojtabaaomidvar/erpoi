// src/widgets/layout/Sidebar.tsx

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
import { usePendingAmendmentsCount } from "@shared/hooks/usePendingAmendmentsCount";

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
    label: "TPI Management",
    icon: Search,
    entity: "tpi",
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
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { canAccess, isAdmin } = usePermissionMapping();
  const { count: pendingAmendmentsCount } = usePendingAmendmentsCount();

  const isManagerOrAdmin =
    isAdmin || user?.role === "manager" || user?.role === "unit_manager";

  const visibleNavItems = navItems.filter((item) => {
    if (item.key === "dashboard") return true;

    if (item.unitManagerOnly && !isManagerOrAdmin) return false;

    if (!item.entity) return true;
    return canAccess(item.entity);
  });

  return (
    <aside
      className={`fixed z-30 flex flex-col transition-all duration-300 ease-out ${
        isExpanded ? "w-64" : "w-20"
      }`}
      style={{
        top: "calc(var(--header-height) + 0.75rem)",
        left: "0.75rem",
        height: "calc(100vh - var(--header-height) - 3rem)",
        borderRadius: "var(--radius-card, 12px)",
        backgroundColor: `color-mix(in srgb, var(--color-surface) 85%, transparent)`,
        backdropFilter: "blur(var(--effect-glass-blur, 12px))",
        WebkitBackdropFilter: "blur(var(--effect-glass-blur, 12px))",
        border:
          "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)",
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-hide">
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
              className={`group relative w-full flex items-center transition-all duration-200 ${
                isExpanded ? "gap-3 px-2 py-2" : "justify-center px-1 py-2"
              }`}
              style={{
                borderRadius: "var(--radius-button, 8px)",
                backgroundColor: isActive
                  ? `color-mix(in srgb, var(--color-accent-from) 15%, transparent)`
                  : "transparent",
                color: isActive
                  ? "var(--color-accent-from)"
                  : "var(--color-text-secondary)",
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: "var(--color-accent-from)" }}
                />
              )}

              {/* Hover background */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{
                  borderRadius: "inherit",
                  backgroundColor: isActive
                    ? "transparent"
                    : `color-mix(in srgb, var(--color-text-primary) 5%, transparent)`,
                }}
              />

              {/* Icon container */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 shrink-0 transition-all duration-200`}
                style={{
                  borderRadius: "var(--radius-button, 8px)",
                  backgroundColor: isActive
                    ? `color-mix(in srgb, var(--color-accent-from) 20%, transparent)`
                    : "transparent",
                }}
              >
                <Icon
                  className={`w-4 h-4 transition-colors duration-200`}
                  style={{
                    color: isActive
                      ? "var(--color-accent-from)"
                      : "var(--color-text-muted)",
                  }}
                />
              </div>

              {/* Label & Badge */}
              {isExpanded && (
                <>
                  <span
                    className="flex-1 text-left text-[13px] font-medium truncate transition-colors duration-200"
                    style={{
                      color: isActive
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {item.label}
                  </span>

                  {showBadge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isAmendmentBadge || isAlert ? "animate-pulse" : ""
                      }`}
                      style={{
                        backgroundColor: isAmendmentBadge
                          ? "rgba(245, 158, 11, 0.15)"
                          : isAlert
                            ? "rgba(244, 63, 94, 0.15)"
                            : isActive
                              ? `color-mix(in srgb, var(--color-accent-from) 20%, transparent)`
                              : `color-mix(in srgb, var(--color-text-muted) 15%, transparent)`,
                        color: isAmendmentBadge
                          ? "#f59e0b"
                          : isAlert
                            ? "#f43f5e"
                            : isActive
                              ? "var(--color-accent-from)"
                              : "var(--color-text-muted)",
                      }}
                    >
                      {badgeText}
                    </span>
                  )}
                </>
              )}

              {/* Collapsed badge dot */}
              {!isExpanded && showBadge && (
                <span
                  className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                    isAmendmentBadge || isAlert ? "animate-pulse" : ""
                  }`}
                  style={{
                    backgroundColor: isAmendmentBadge
                      ? "#f59e0b"
                      : isAlert
                        ? "#f43f5e"
                        : "var(--color-accent-from)",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer separator */}
      <div
        className="mx-3 my-1"
        style={{
          height: "1px",
          backgroundColor: `color-mix(in srgb, var(--color-border) 40%, transparent)`,
        }}
      />

      {/* FOOTER - User Management (Admin Only) */}
      <div className="p-2">
        {isAdmin ? (
          <button
            onClick={() => onSelect("user-management")}
            title={!isExpanded ? "User Management" : undefined}
            className={`group relative w-full flex items-center transition-all duration-200 ${
              isExpanded ? "gap-3 px-2 py-2" : "justify-center px-1 py-2"
            }`}
            style={{
              borderRadius: "var(--radius-button, 8px)",
              backgroundColor:
                active === "user-management"
                  ? `color-mix(in srgb, var(--color-accent-from) 15%, transparent)`
                  : "transparent",
              color:
                active === "user-management"
                  ? "var(--color-accent-from)"
                  : "var(--color-text-secondary)",
            }}
          >
            {/* Active indicator */}
            {active === "user-management" && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                style={{ backgroundColor: "var(--color-accent-from)" }}
              />
            )}

            {/* Hover background */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                borderRadius: "inherit",
                backgroundColor:
                  active === "user-management"
                    ? "transparent"
                    : `color-mix(in srgb, var(--color-text-primary) 5%, transparent)`,
              }}
            />

            <div
              className="relative flex items-center justify-center w-8 h-8 shrink-0 transition-all duration-200"
              style={{
                borderRadius: "var(--radius-button, 8px)",
                backgroundColor:
                  active === "user-management"
                    ? `color-mix(in srgb, var(--color-accent-from) 20%, transparent)`
                    : "transparent",
              }}
            >
              <Shield
                className="w-4 h-4 transition-colors duration-200"
                style={{
                  color:
                    active === "user-management"
                      ? "var(--color-accent-from)"
                      : "var(--color-text-muted)",
                }}
              />
            </div>

            {isExpanded && (
              <>
                <span
                  className="flex-1 text-left text-[13px] font-medium transition-colors duration-200"
                  style={{
                    color:
                      active === "user-management"
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                  }}
                >
                  User Management
                </span>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--color-accent-from) 15%, transparent)`,
                    color: "var(--color-accent-from)",
                  }}
                >
                  ADMIN
                </span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center py-2">
            {isExpanded && (
              <span
                className="text-[10px] font-medium tracking-wide uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                {user?.role === "unit_manager" || user?.role === "manager"
                  ? "Unit Manager"
                  : user?.role || "User"}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
