// src/pages/Settings.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { RoleManager } from '@shared/authorization/components/RoleManager';
import { UserRoleManager } from '@shared/authorization/components/UserRoleManager';
import { PermissionExplorer } from '@shared/authorization/components/PermissionExplorer';

type SettingsTab = 'roles' | 'users' | 'permissions';

const tabs: Array<{ key: SettingsTab; label: string; icon: string; description: string }> = [
  { 
    key: 'roles', 
    label: 'Roles', 
    icon: '👥',
    description: 'Define roles and assign permissions'
  },
  { 
    key: 'users', 
    label: 'Users', 
    icon: '👤',
    description: 'Manage user accounts and access'
  },
  { 
    key: 'permissions', 
    label: 'Permissions', 
    icon: '🔐',
    description: 'Explore and assign permissions'
  },
];

export function Settings() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('roles');

  const currentTab = tabs.find(t => t.key === activeTab)!;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            ⚙️ Settings
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {currentTab.description}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg w-fit ${
        isDark ? 'bg-slate-900' : 'bg-slate-100'
      }`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? isDark 
                  ? 'bg-slate-800 text-slate-100 shadow-sm' 
                  : 'bg-white text-slate-900 shadow-sm'
                : isDark 
                  ? 'text-slate-400 hover:text-slate-200' 
                  : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'roles' && <RoleManager />}
        {activeTab === 'users' && <UserRoleManager />}
        {activeTab === 'permissions' && <PermissionExplorer />}
      </div>
    </div>
  );
}