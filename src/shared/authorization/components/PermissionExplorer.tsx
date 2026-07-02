// src/shared/authorization/components/PermissionExplorer.tsx

import { useState, useEffect } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { roleService } from '../services/RoleService';


interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isCustom: boolean;
  isSystem?: boolean;
}

export function PermissionExplorer() {
  const { isDark } = useTheme();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const loadedRoles = await roleService.getAllRoles();
        setRoles(loadedRoles);
        if (loadedRoles.length > 0) {
          setSelectedRoleId(loadedRoles[0].id);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRoles();
  }, []);

  const selectedRole = roles.find((r: CustomRole) => r.id === selectedRoleId);
  const selectedPermissions = selectedRole?.permissions || [];
  
  const allPermissions = Array.from(
	  new Set(
		roles.flatMap(role => role.permissions)
	  )
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-6xl animate-pulse">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          Permission Explorer
        </h2>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          💡 Click on any permission to toggle it for role "{selectedRole?.displayName}"
        </p>
      </div>

      <select
        value={selectedRoleId}
        onChange={(e) => setSelectedRoleId(e.target.value)}
        className={`px-3 py-2 rounded-lg border ${
          isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white text-slate-900'
        }`}
      >
        {roles.map((role: CustomRole) => (
          <option key={role.id} value={role.id}>{role.displayName}</option>
        ))}
      </select>

      <div className={`rounded-lg border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {allPermissions.map((permission) => {
            const isSelected = selectedPermissions.includes(permission);
            return (
              <div
                key={permission}
                className={`px-2 py-1.5 rounded text-xs font-mono cursor-pointer ${
                  isSelected
                    ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {permission}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}