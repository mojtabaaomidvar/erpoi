// src/pages/Settings.tsx
import { useState } from 'react';
import { RoleManager } from '@shared/authorization/components/RoleManager';
import { UserRoleManager } from '@shared/authorization/components/UserRoleManager';
import { PermissionExplorer } from '@shared/authorization/components/PermissionExplorer';

type SettingsTab = 'roles' | 'users' | 'permissions';

const tabs: Array<{ key: SettingsTab; label: string; icon: string }> = [
  { key: 'roles', label: 'Roles', icon: '👥' },
  { key: 'users', label: 'Users', icon: '👤' },
  { key: 'permissions', label: 'Permissions', icon: '🔐' },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('roles');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            ⚙️ Settings
          </h1>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'roles' && <RoleManager />}
        {activeTab === 'users' && <UserRoleManager />}
        {activeTab === 'permissions' && <PermissionExplorer />}
      </div>
    </div>
  );
}