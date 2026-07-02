// src/shared/authorization/ui/modals/UserPermissionsModal.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { PermissionSelector } from '../components/PermissionSelector';
import type { DBUser } from '@shared/database/types';

interface UserPermissionsModalProps {
  user: DBUser;
  onClose: () => void;
  onSave: (permissions: string[]) => void;
}

export function UserPermissionsModal({ user, onClose, onSave }: UserPermissionsModalProps) {
  const { isDark } = useTheme();
  const [permissions, setPermissions] = useState<string[]>(user.customPermissions || []);

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
                🔐 Assign Permissions to User
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {user.fullName} (@{user.username})
              </p>
            </div>
            <button onClick={onClose} className={`text-2xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className={`p-3 rounded-lg border ${isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'}`}>
            <p className={`text-xs ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
              💡 These permissions are <strong>in addition to</strong> the permissions from the user's role.
            </p>
          </div>

          <PermissionSelector
            selectedPermissions={permissions}
            onChange={setPermissions}
            label="Custom Permissions"
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