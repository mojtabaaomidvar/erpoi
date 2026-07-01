// src/shared/authorization/components/UserForm.tsx

import { useState, useEffect } from 'react';
import { User, UserFormData, Role, UserStatus } from '../types';
import { roleService } from '../services/RoleService';
import { userService } from '../services/UserService';
import { DepartmentSelect } from './DepartmentSelect';
import { PermissionSelector } from './PermissionSelector';
import { showToast } from '@shared/ui/ToastContainer';

interface Props {
  user?: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserForm({ user, onClose, onSuccess }: Props) {
  const isEdit = !!user;
  const [showPermissions, setShowPermissions] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    password: '',
    role: user?.role || 'viewer',
    department: user?.department || '',
    phone: user?.phone || '',
    status: user?.status || 'active',
    customPermissions: user?.customPermissions || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ وقتی role عوض میشه، permissions اون role رو لود کن
  useEffect(() => {
    if (!isEdit) {
      const rolePerms = roleService.getRolePermissions(formData.role);
      setFormData(prev => ({ ...prev, customPermissions: rolePerms }));
    }
  }, [formData.role, isEdit]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'At least 3 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!isEdit && !formData.password) newErrors.password = 'Password required for new users';
    else if (formData.password && formData.password.length < 6) newErrors.password = 'At least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && user) {
        userService.update(user.id, formData);
        showToast('success', 'User Updated', `${formData.fullName} has been updated`);
      } else {
        userService.create(formData);
        showToast('success', 'User Created', `${formData.fullName} has been created`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const allRoles = roleService.getAllRoles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {errors.submit}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username *</label>
                <input type="text" value={formData.username} onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${errors.username ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
                {errors.username && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${errors.fullName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`} />
              {errors.fullName && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password {!isEdit && '*'}
              </label>
              <input type="password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 ${errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Minimum 6 characters'} />
              {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                <select value={formData.role} onChange={(e) => handleChange('role', e.target.value as Role)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  {allRoles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {allRoles.find(r => r.id === formData.role)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <DepartmentSelect value={formData.department} onChange={(v) => handleChange('department', v)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select value={formData.status} onChange={(e) => handleChange('status', e.target.value as UserStatus)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setShowPermissions(!showPermissions)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                {showPermissions ? '▼ Hide' : '▶ Show'} Custom Permissions ({formData.customPermissions?.length || 0})
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Permissions are pre-loaded from role "{allRoles.find(r => r.id === formData.role)?.name}". You can customize them here.
              </p>
            </div>

            {showPermissions && (
              <div className="pt-2">
                <PermissionSelector
                  selectedPermissions={formData.customPermissions || []}
                  onChange={(permissions) => handleChange('customPermissions', permissions)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}