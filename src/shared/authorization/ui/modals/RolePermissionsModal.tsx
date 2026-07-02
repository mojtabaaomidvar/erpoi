// src/shared/authorization/ui/modals/RolePermissionsModal.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { PermissionSelector } from '../components/PermissionSelector';
import type { DBRole } from '@shared/database/types';

interface RolePermissionsModalProps {
  role: DBRole;
  onClose: () => void;
  onSave: (permissions: string[]) => void;
}

export function RolePermissionsModal({ role, onClose, onSave }: RolePermissionsModalProps) {
  const { isDark } = useTheme();
  const [permissions, setPermissions] = useState<string[]>(role.permissions || []);

  const handleSave = () => {
    onSave(permissions);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`rounded-xl shadow-2xl max-w-2xl w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                🔐 Assign Permissions to Role
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {role.displayName} ({role.name})
              </p>
            </div>
            <button onClick={onClose} className={`text-2xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {role.isSystem && (
            <div className={`p-3 rounded-lg border ${isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                ⚠️ This is a <strong>system role</strong>. Changes will affect all users with this role.
              </p>
            </div>
          )}

          <PermissionSelector
            selectedPermissions={permissions}
            onChange={setPermissions}
            label="Role Permissions"
          />

          <div className={`flex gap-3 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Save Permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}