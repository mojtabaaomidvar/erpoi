// src/shared/authorization/components/RoleForm.tsx

import { useState } from 'react';
import { RoleInfo, Permission } from '../types';
import { roleService } from '../services/RoleService';
import { PermissionSelector } from './PermissionSelector';
import { showToast } from '@shared/ui/ToastContainer';

interface Props {
  role?: RoleInfo & { isCustom?: boolean };
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleForm({ role, onClose, onSuccess }: Props) {
  const isEdit = !!role;

  const [formData, setFormData] = useState({
    id: role?.id || '',
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [] as Permission[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.id.trim()) newErrors.id = 'Role ID is required';
    else if (!/^[a-z_]+$/.test(formData.id)) newErrors.id = 'Only lowercase letters and underscores';
    else if (!isEdit && roleService.getRoleById(formData.id)) newErrors.id = 'Role ID already exists';

    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && role) {
        roleService.updateRole(role.id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        });
        showToast('success', 'Role Updated', `Role "${formData.name}" has been updated`);
      } else {
        roleService.createRole(formData);
        showToast('success', 'Role Created', `Role "${formData.name}" has been created`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role ID *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                disabled={isEdit}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                  errors.id ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                } ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="e.g., senior_manager"
              />
              {errors.id && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                  errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
                placeholder="e.g., Senior Manager"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${
                errors.description ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              rows={2}
              placeholder="Describe what this role can do..."
            />
            {errors.description && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description}</p>}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Permissions ({formData.permissions.length})
              </h3>
            </div>
            <PermissionSelector
              selectedPermissions={formData.permissions}
              onChange={(permissions) => setFormData({ ...formData, permissions })}
            />
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}