// src/shared/authorization/components/RoleManager.tsx

import { useState } from 'react';
import { RoleForm } from './RoleForm';
import { roleService } from '../services/RoleService';
import { PermissionMatrix } from './PermissionMatrix';
import { confirmDialog } from '@shared/ui/ConfirmDialog';
import { showToast } from '@shared/ui/ToastContainer';

type ViewMode = 'list' | 'matrix';

export function RoleManager() {
  const [roles, setRoles] = useState(roleService.getAllRoles());
  const [editingRole, setEditingRole] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const refresh = () => setRoles(roleService.getAllRoles());

  const handleEdit = (role: any) => {
    if (!role.isCustom) {
      // برای role های سیستمی، یک کپی می‌سازیم
      const newId = `${role.id}_custom`;
      try {
        const duplicated = roleService.duplicateRole(role.id, newId, `${role.name} (Custom)`);
        showToast('info', 'System Role Copied', `Create a custom copy to edit. Editing "${duplicated.name}"`);
        setEditingRole(duplicated);
      } catch (e: any) {
        showToast('error', 'Error', e.message);
      }
    } else {
      setEditingRole(role);
    }
  };

  const handleDelete = async (role: any) => {
    if (!role.isCustom) {
      showToast('warning', 'Cannot Delete', 'System roles cannot be deleted');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Delete Role',
      message: `Are you sure you want to delete role "${role.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      roleService.deleteRole(role.id);
      showToast('success', 'Role Deleted', `Role "${role.name}" has been deleted`);
      refresh();
    } catch (e: any) {
      showToast('error', 'Error', e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Role Management</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Define roles and assign permissions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'matrix' : 'list')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium"
          >
            {viewMode === 'list' ? ' Matrix View' : '📋 List View'}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            + Create Role
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <PermissionMatrix />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{role.name}</h3>
                    {role.isSystem && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
                        System
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{role.id}</div>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                {role.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {role.permissions.length} permissions
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  {role.isCustom && (
                    <button
                      onClick={() => handleDelete(role)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 5).map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] rounded"
                  >
                    {p.split(':')[1]}
                  </span>
                ))}
                {role.permissions.length > 5 && (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] rounded">
                    +{role.permissions.length - 5}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateForm && (
        <RoleForm onClose={() => setShowCreateForm(false)} onSuccess={refresh} />
      )}

      {editingRole && (
        <RoleForm role={editingRole} onClose={() => setEditingRole(null)} onSuccess={refresh} />
      )}
    </div>
  );
}