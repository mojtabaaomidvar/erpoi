// src/shared/authorization/components/PermissionMatrix.tsx
import React, { useState } from 'react';
import { Role, Permission } from '../types';
import { ROLES } from '../roles';
import { ENTITIES, ENTITY_GROUPS, DEFAULT_ACTIONS } from '../permissions';

type PermissionGroup = {
  label: string;
  icon: string;
  permissions: string[];
};

const permissionGroups: Record<string, PermissionGroup> =
  Object.fromEntries(
    ENTITIES.map(entity => [
      entity,
      {
        label: ENTITY_GROUPS[entity].label,
        icon: ENTITY_GROUPS[entity].icon,
        permissions: DEFAULT_ACTIONS.map(action => `${entity}:${action}`),
      },
    ])
  );
  
export function PermissionMatrix() {
  const roles = Object.values(ROLES);
  const [expandedEntities, setExpandedEntities] = useState<string[]>(
	Object.keys(permissionGroups)
  );

  const toggleEntity = (entity: string) => {
    setExpandedEntities(prev =>
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    );
  };

  const expandAll = () => setExpandedEntities(Object.keys(permissionGroups));
  const collapseAll = () => setExpandedEntities([]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          🔐 Permission Matrix
        </h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 dark:border-slate-600">
              <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 min-w-[200px]">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 min-w-[100px]"
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(permissionGroups).map(([entity, group]) => {
              const isExpanded = expandedEntities.includes(entity);
              return (
                <React.Fragment key={entity}>
                  <tr
                    key={`header-${entity}`}
                    className="bg-slate-100 dark:bg-slate-900 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => toggleEntity(entity)}
                  >
                    <td
                      colSpan={roles.length + 1}
                      className="py-2 px-4 font-bold text-slate-900 dark:text-slate-100"
                    >
                      <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
                      {group.icon} {group.label}
                      <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({group.permissions.length} permissions)
                      </span>
                    </td>
                  </tr>
                  {isExpanded &&
                    group.permissions.map((permission) => (
                      <tr
                        key={permission}
                        className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="py-2 px-4 font-mono text-xs text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800">
                          {permission}
                        </td>
                        {roles.map((role) => {
                          const hasPermission = role.permissions.includes(permission);
                          return (
                            <td key={role.id} className="text-center py-2 px-4">
                              <span
                                className={`inline-block w-6 h-6 rounded-full ${
                                  hasPermission
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                }`}
                              >
                                {hasPermission ? '✓' : '×'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 rounded-full bg-green-500 text-white text-center leading-6">
            ✓
          </span>
          <span className="text-slate-700 dark:text-slate-300">Has Permission</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-400 text-center leading-6">
            ×
          </span>
          <span className="text-slate-700 dark:text-slate-300">No Permission</span>
        </div>
      </div>
    </div>
  );
}