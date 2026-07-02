// src/widgets/layout/Sidebar.tsx

import {
  LayoutDashboard, Users, FileText, UserCheck, ClipboardCheck,
  Receipt, BarChart3, ShieldCheck, Shield, Settings,
} from "lucide-react";
import { useTheme } from "@app/providers/ThemeProvider";
import { UserDropdown } from './UserDropdown';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useRole } from '@shared/authorization/hooks/useRole';
import { useEntityAccess } from '@shared/authorization/hooks/useEntityAccess';

// 🔧 FIX: تغییر 'permission-manager' به 'user-management'
export type ViewKey =
  | 'dashboard'
  | 'clients'
  | 'contracts'
  | 'inspectors'
  | 'inspections'
  | 'billing'
  | 'reports'
  | 'audit'
  | 'settings'
  | 'user-management';  // 🔧 FIX: تغییر نام

interface SidebarProps {
  active: ViewKey;
  onSelect: (view: ViewKey) => void;
  isExpanded: boolean;
  expiringContractsCount?: number;
  onLogout?: () => void | Promise<void>;
}

const navItems: Array<{
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}> = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "clients", label: "Clients", icon: Users },
  { key: "contracts", label: "Agreements", icon: FileText },
  { key: "inspectors", label: "Inspectors", icon: UserCheck },
  { key: "inspections", label: "Workflow", icon: ClipboardCheck, badge: "3" },
  { key: "billing", label: "Billing", icon: Receipt },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: 'audit', label: 'Audit Log', icon: ShieldCheck },
];

export function Sidebar({ active, onSelect, isExpanded, expiringContractsCount, onLogout }: SidebarProps) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { isAdmin } = useRole();

  const clientAccess = useEntityAccess('client');
  const contractAccess = useEntityAccess('contract');
  const inspectorAccess = useEntityAccess('inspector');
  const inspectionAccess = useEntityAccess('inspection');
  const invoiceAccess = useEntityAccess('invoice');
  const reportAccess = useEntityAccess('report');
  const auditAccess = useEntityAccess('audit_log');
  const settingAccess = useEntityAccess('setting');

  const visibleNavItems = navItems.filter((item) => {
    if (item.key === 'dashboard') return true;
    if (item.key === 'clients') return clientAccess.hasAccess;
    if (item.key === 'contracts') return contractAccess.hasAccess;
    if (item.key === 'inspectors') return inspectorAccess.hasAccess;
    if (item.key === 'inspections') return inspectionAccess.hasAccess;
    if (item.key === 'billing') return invoiceAccess.hasAccess;
    if (item.key === 'reports') return reportAccess.hasAccess;
    if (item.key === 'audit') return auditAccess.hasAccess;
    if (item.key === 'settings') return settingAccess.hasAccess;
    return true;
  });

  return (
    <aside className={`fixed left-0 top-16 z-30 flex flex-col border-r transition-all duration-300 ${
      isExpanded ? "w-64" : "w-20"} ${
      isDark
        ? "bg-slate-900/95 border-slate-800 shadow-xl shadow-black/30 backdrop-blur-xl"
        : "bg-white/95 border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-xl"}`}
      style={{ height: "calc(100vh - 4rem)" }}>

      {/* لوگو */}
      <div className="flex items-center gap-3 px-5 py-5">
      </div>

      {/* منو */}
      <nav className="flex-1 space-y-0.5 px-3 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const showBadge = item.key === "contracts" ? (expiringContractsCount ?? 0) > 0 : !!item.badge;
          const badgeText = item.key === "contracts" ? expiringContractsCount : item.badge;
          const isAlert = item.key === "contracts" && (expiringContractsCount ?? 0) > 0;

          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={!isExpanded ? item.label : undefined}
              className={`group flex w-full items-center rounded-lg transition-all ${
                isExpanded ? "gap-3 px-2.5 py-2 text-sm" : "justify-center px-2 py-2.5"} ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-indigo-600 shadow-md shadow-indigo-500/20"
                  : isDark
                    ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${
                isActive ? "text-indigo-500" : isDark ? "text-slate-500" : "text-slate-400"}`} />
              {isExpanded && <span className="flex-1 text-left">{item.label}</span>}

              {showBadge && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  isAlert
                    ? "bg-rose-500/20 text-rose-500 ring-rose-500/40 animate-pulse"
                    : "bg-rose-500/15 text-rose-500 ring-rose-500/30"}`}>
                  {badgeText}
                </span>
              )}

              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/80"/>}
            </button>
          );
        })}

        {/* 🔧 FIX: User Management - فقط برای admin */}
        {isAdmin && (
          <button
            onClick={() => onSelect('user-management')}
            title={!isExpanded ? 'User Management' : undefined}
            className={`group flex w-full items-center rounded-lg transition-all ${
              isExpanded ? "gap-3 px-2.5 py-2 text-sm" : "justify-center px-2 py-2.5"} ${
              active === 'user-management'
                ? "bg-gradient-to-r from-purple-500/15 to-pink-500/10 text-purple-600 shadow-md shadow-purple-500/20"
                : isDark
                  ? "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
          >
            <Shield className={`h-4 w-4 shrink-0 ${
              active === 'user-management' ? "text-purple-500" : isDark ? "text-slate-500" : "text-slate-400"}`} />
            {isExpanded && (
              <>
                <span className="flex-1 text-left">User Management</span>
                <span className="px-1.5 py-0.5 bg-purple-500 text-white text-[10px] rounded-full font-bold">ADMIN</span>
              </>
            )}
            {active === 'user-management' && <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-lg shadow-purple-500/80"/>}
          </button>
        )}
      </nav>

      {/* فوتر - User Dropdown */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <UserDropdown
          userName={user?.fullName || 'Admin User'}
          userEmail={user?.email || 'admin@ics.com'}
          onNavigateSettings={() => onSelect('settings')}
          onLogout={onLogout}
          isExpanded={isExpanded}
        />
      </div>
    </aside>
  );
}