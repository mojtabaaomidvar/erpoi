// src/shared/authorization/components/RoleManager.tsx

import { useState, useEffect } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { roleService } from '../services/RoleService';
import { showToast } from '@shared/ui/ToastContainer';
import { confirmDialog } from '@shared/ui/ConfirmDialog';

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
  isSystem?: boolean;
}

export function RoleManager() {
  const { isDark } = useTheme();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const loadedRoles = await roleService.getAllRoles();
        setRoles(loadedRoles);
      } catch (error) {
        console.error('Failed to load roles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRoles();
  }, []);

  const handleDelete = async (role: CustomRole) => {
    if (role.isSystem) {
      showToast('error', 'Cannot Delete', 'System roles cannot be deleted');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.displayName}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      await roleService.deleteRole(role.id);
      setRoles(prev => prev.filter(r => r.id !== role.id));
      showToast('success', 'Deleted', `Role "${role.displayName}" deleted`);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.message);
    }
  };

  const handleDuplicate = async (role: CustomRole) => {
    try {
      const duplicated = await roleService.duplicateRole(role.id, `${role.displayName} (Custom)`);
      setRoles(prev => [...prev, duplicated]);
      showToast('success', 'Duplicated', `Role "${duplicated.displayName}" created`);
    } catch (error: any) {
      showToast('error', 'Duplicate Failed', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Roles ({roles.length})
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Define roles and their permissions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role: CustomRole) => (
          <div
            key={role.id}
            className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {role.displayName}
                  </h3>
                  {role.isSystem && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                    }`}>
                      SYSTEM
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {role.description}
                </p>
              </div>
            </div>

            <div className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <strong>{role.permissions.length}</strong> permissions
            </div>

            <div className="flex flex-wrap gap-1 mb-3 max-h-20 overflow-y-auto">
              {role.permissions.slice(0, 5).map((p: string) => (
                <span
                  key={p}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p}
                </span>
              ))}
              {role.permissions.length > 5 && (
                <span className={`text-[9px] px-1.5 py-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  +{role.permissions.length - 5} more
                </span>
              )}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => handleDuplicate(role)}
                className={`flex-1 px-2 py-1.5 text-xs rounded ${
                  isDark ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                📋 Duplicate
              </button>
              <button
                onClick={() => handleDelete(role)}
                disabled={role.isSystem}
                className={`flex-1 px-2 py-1.5 text-xs rounded ${
                  role.isSystem
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                }`}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}