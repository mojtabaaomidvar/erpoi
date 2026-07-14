// src/shared/authorization/ui/user-management/components/UserManagementTabs.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import type { UserManagementTab, TabConfig } from "../types";
import { USER_MANAGEMENT_TABS } from "../types";

interface UserManagementTabsProps {
  activeTab: UserManagementTab;
  onTabChange: (tab: UserManagementTab) => void;
}

export function UserManagementTabs({
  activeTab,
  onTabChange,
}: UserManagementTabsProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={`flex gap-1 p-1 rounded-lg w-fit ${
        isDark ? "bg-slate-900" : "bg-slate-100"
      }`}
    >
      {USER_MANAGEMENT_TABS.map((tab: TabConfig) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
            activeTab === tab.key
              ? isDark
                ? "bg-slate-800 text-slate-100 shadow-sm"
                : "bg-white text-slate-900 shadow-sm"
              : isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}