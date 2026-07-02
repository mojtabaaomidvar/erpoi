// src/shared/authorization/components/PermissionExplorer.tsx

import { useState, useEffect } from 'react';
import { Permission, Role } from '../types';
import { PERMISSION_GROUPS, ALL_PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../permissions';
import { roleService } from '../services/RoleService';
import { userService } from '../services/UserService';
import { showToast } from '@shared/ui/ToastContainer';

type AssignMode = 'role' | 'user';

interface PermissionInfo {
  permission: Permission;
  label: string;
  description: string;
  entity: string;
  action: string;
}

export function PermissionExplorer() {
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<AssignMode>('role');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [roles, setRoles] = useState(roleService.getAllRoles());
  const [users, setUsers] = useState(userService.getAll());
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);

  // Auto-detect new entities from ALL_PERMISSIONS
  const entities = Object.keys(PERMISSION_GROUPS);

  const getPermissionInfo = (permission: Permission): PermissionInfo => {
    const [entity, action] = permission.split(':');
    return {
      permission,
      label: PERMISSION_DESCRIPTIONS[permission]?.label || permission,
      description: PERMISSION_DESCRIPTIONS[permission]?.description || '',
      entity,
      action,
    };
  };

  const filteredPermissions = ALL_PERMISSIONS.filter(p => {
    const info = getPermissionInfo(p);
    const matchesSearch = !search || 
      p.toLowerCase().includes(search.toLowerCase()) ||
      info.label.toLowerCase().includes(search.toLowerCase()) ||
      info.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesEntity = !selectedEntity || p.startsWith(`${selectedEntity}:`);
    
    return matchesSearch && matchesEntity;
  });

  const toggleEntity = (entity: string) => {
    setExpandedEntities(prev =>
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    );
  };

  const expandAll = () => setExpandedEntities(entities);
  const collapseAll = () => setExpandedEntities([]);

  const getCurrentPermissions = (): Permission[] => {
    if (assignMode === 'role' && selectedRoleId) {
      return roleService.getRolePermissions(selectedRoleId);
    }
    if (assignMode === 'user' && selectedUserId) {
      const user = userService.getById(selectedUserId);
      return user?.customPermissions || [];
    }
    return [];
  };

  const currentPermissions = getCurrentPermissions();

  // 🔧 FIX: async کردن togglePermission
  const togglePermission = async (permission: Permission) => {
    const hasPermission = currentPermissions.includes(permission);
    const newPermissions = hasPermission
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    if (assignMode === 'role' && selectedRoleId) {
      try {
        // 🔧 FIX: await اضافه شد چون updateRole الان async هست
        await roleService.updateRole(selectedRoleId, { permissions: newPermissions });
        setRoles(roleService.getAllRoles());
        showToast('success', 'Permission Updated', `${hasPermission ? 'Removed' : 'Added'} ${permission}`);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    } else if (assignMode === 'user' && selectedUserId) {
      try {
        userService.updateCustomPermissions(selectedUserId, newPermissions);
        setUsers(userService.getAll());
        showToast('success', 'Permission Updated', `${hasPermission ? 'Removed' : 'Added'} ${permission}`);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    }
  };

  // 🔧 FIX: async کردن selectAllInEntity
  const selectAllInEntity = async (entity: string) => {
    const entityPermissions = PERMISSION_GROUPS[entity as keyof typeof PERMISSION_GROUPS]?.permissions || [];
    const newPermissions = [...new Set([...currentPermissions, ...entityPermissions])];

    if (assignMode === 'role' && selectedRoleId) {
      try {
        // 🔧 FIX: await اضافه شد
        await roleService.updateRole(selectedRoleId, { permissions: newPermissions });
        setRoles(roleService.getAllRoles());
        showToast('success', 'Permissions Added', `All ${entity} permissions added`);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    } else if (assignMode === 'user' && selectedUserId) {
      try {
        userService.updateCustomPermissions(selectedUserId, newPermissions);
        setUsers(userService.getAll());
        showToast('success', 'Permissions Added', `All ${entity} permissions added`);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    }
  };

  // 🔧 FIX: async کردن deselectAllInEntity
  const deselectAllInEntity = async (entity: string) => {
    const entityPermissions = PERMISSION_GROUPS[entity as keyof typeof PERMISSION_GROUPS]?.permissions || [];
    const newPermissions = currentPermissions.filter(p => !entityPermissions.includes(p));

    if (assignMode === 'role' && selectedRoleId) {
      try {
        // 🔧 FIX: await اضافه شد
        await roleService.updateRole(selectedRoleId, { permissions: newPermissions });
        setRoles(roleService.getAllRoles());
        showToast('success', 'Permissions Removed', `All ${entity} permissions removed`);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    } else if (assignMode === 'user' && selectedUserId) {
      try {
        userService.updateCustomPermissions(selectedUserId, newPermissions);
        setUsers(userService.getAll());
        showToast('success', 'Permissions Removed', `All ${entity} permissions removed`);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    }
  };

  const stats = {
    total: ALL_PERMISSIONS.length,
    assigned: currentPermissions.length,
    unassigned: ALL_PERMISSIONS.length - currentPermissions.length,
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            🔐 Permission Explorer
          </h2>
          <div className="flex gap-4 text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              Total: <strong className="text-slate-900 dark:text-slate-100">{stats.total}</strong>
            </div>
            <div className="text-green-600 dark:text-green-400">
              Assigned: <strong>{stats.assigned}</strong>
            </div>
            <div className="text-slate-400">
              Unassigned: <strong>{stats.unassigned}</strong>
            </div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search permissions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
        />
      </div>

      {/* Assign To Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          🎯 Assign Permissions To
        </h3>

        <div className="flex gap-4 items-center flex-wrap">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <button
              onClick={() => setAssignMode('role')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                assignMode === 'role'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              👥 Role
            </button>
            <button
              onClick={() => setAssignMode('user')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                assignMode === 'user'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              👤 User
            </button>
          </div>

          {/* Role Select */}
          {assignMode === 'role' && (
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm flex-1 min-w-[200px]"
            >
              <option value="">Select a role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.permissions.length} permissions)
                </option>
              ))}
            </select>
          )}

          {/* User Select */}
          {assignMode === 'user' && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm flex-1 min-w-[200px]"
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.customPermissions?.length || 0} custom permissions)
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedRoleId && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            💡 Click on any permission to toggle it for role "{roles.find(r => r.id === selectedRoleId)?.name}"
          </p>
        )}
        {selectedUserId && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            💡 Click on any permission to toggle it for user "{users.find(u => u.id === selectedUserId)?.fullName}"
          </p>
        )}
      </div>

      {/* Entity Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
            Filter by Entity
          </span>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs text-slate-600 dark:text-slate-400 hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedEntity(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedEntity
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            All ({ALL_PERMISSIONS.length})
          </button>
          {entities.map((entity) => {
            const group = PERMISSION_GROUPS[entity as keyof typeof PERMISSION_GROUPS];
            const count = filteredPermissions.filter(p => p.startsWith(`${entity}:`)).length;
            return (
              <button
                key={entity}
                onClick={() => setSelectedEntity(entity === selectedEntity ? null : entity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedEntity === entity
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {group.icon} {group.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="space-y-2">
        {entities.map((entity) => {
          const group = PERMISSION_GROUPS[entity as keyof typeof PERMISSION_GROUPS];
          const entityPermissions = filteredPermissions.filter(p => p.startsWith(`${entity}:`));
          
          if (entityPermissions.length === 0) return null;

          const isExpanded = expandedEntities.includes(entity);
          const assignedCount = entityPermissions.filter(p => currentPermissions.includes(p)).length;

          return (
            <div key={entity} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Entity Header */}
              <div
                className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => toggleEntity(entity)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
                  <span className="text-lg">{group.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {group.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {assignedCount}/{entityPermissions.length} assigned
                    </p>
                  </div>
                </div>
                {(selectedRoleId || selectedUserId) && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); selectAllInEntity(entity); }}
                      className="text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deselectAllInEntity(entity); }}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Permissions Grid */}
              {isExpanded && (
                <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {entityPermissions.map((permission) => {
                    const info = getPermissionInfo(permission);
                    const isAssigned = currentPermissions.includes(permission);

                    return (
                      <button
                        key={permission}
                        onClick={() => (selectedRoleId || selectedUserId) && togglePermission(permission)}
                        disabled={!selectedRoleId && !selectedUserId}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          isAssigned
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        } ${!selectedRoleId && !selectedUserId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {info.label}
                          </span>
                          <span className="text-lg">{isAssigned ? '✅' : '⬜'}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">
                          {info.description}
                        </p>
                        <code className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-1 block">
                          {permission}
                        </code>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPermissions.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <div className="text-4xl mb-2">🔍</div>
          <div className="text-sm">No permissions found</div>
        </div>
      )}
    </div>
  );
}