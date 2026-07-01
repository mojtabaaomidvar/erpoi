// src/shared/authorization/components/PermissionSelector.tsx

import { useState } from 'react';
import { Permission } from '../types';
import { PERMISSION_GROUPS, getPermissionLabel, getPermissionDescription } from '../permissions';

interface Props {
  selectedPermissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  readonly?: boolean;
}

export function PermissionSelector({ selectedPermissions, onChange, readonly = false }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const togglePermission = (permission: Permission) => {
    if (readonly) return;
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter(p => p !== permission)
      : [...selectedPermissions, permission];
    onChange(newPermissions);
  };

  const selectAllInGroup = (group: string, e: React.MouseEvent) => {
    e.preventDefault(); // ✅ جلوگیری از submit فرم
    e.stopPropagation();
    if (readonly) return;
    const groupPermissions = PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]?.permissions || [];
    const newPermissions = [...new Set([...selectedPermissions, ...groupPermissions])];
    onChange(newPermissions);
  };

  const deselectAllInGroup = (group: string, e: React.MouseEvent) => {
    e.preventDefault(); // ✅ جلوگیری از submit فرم
    e.stopPropagation();
    if (readonly) return;
    const groupPermissions = PERMISSION_GROUPS[group as keyof typeof PERMISSION_GROUPS]?.permissions || [];
    const newPermissions = selectedPermissions.filter(p => !groupPermissions.includes(p));
    onChange(newPermissions);
  };

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto">
      {Object.entries(PERMISSION_GROUPS).map(([entity, group]) => {
        const isExpanded = expandedGroups.includes(entity);
        const grantedCount = group.permissions.filter(p => selectedPermissions.includes(p)).length;
        const isFullAccess = grantedCount === group.permissions.length;

        return (
          <div key={entity} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div
              className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              onClick={() => toggleGroup(entity)}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  {group.icon} {group.label}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({grantedCount}/{group.permissions.length})
                </span>
              </div>
              {!readonly && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => selectAllInGroup(entity, e)}
                    className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={(e) => deselectAllInGroup(entity, e)}
                    className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {isExpanded && (
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white dark:bg-slate-800">
                {group.permissions.map((permission) => {
                  const isSelected = selectedPermissions.includes(permission);
                  const desc = getPermissionDescription(permission);
                  const label = getPermissionLabel(permission);

                  return (
                    <label
                      key={permission}
                      className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      } ${readonly ? 'cursor-default' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePermission(permission)}
                        disabled={readonly}
                        className="mt-0.5 w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {label}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {desc}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {permission}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}