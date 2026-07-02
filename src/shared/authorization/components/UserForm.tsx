// src/shared/authorization/components/UserForm.tsx

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

interface UserFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  customPermissions: string[];
}

interface UserFormProps {
  onClose: () => void;
  onSave: (data: UserFormData) => void;
}

export function UserForm({ onClose, onSave }: UserFormProps) {
  const { isDark } = useTheme();
  const [allRoles, setAllRoles] = useState<CustomRole[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: '',
    department: '',
    status: 'active',
    customPermissions: [],
  });

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const roles = await roleService.getAllRoles();
        setAllRoles(roles);
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };
    loadRoles();
  }, []);

  const handleRoleChange = (roleName: string) => {
    const selectedRole = allRoles.find((r: CustomRole) => r.name === roleName);
    setFormData({
      ...formData,
      role: roleName,
      customPermissions: selectedRole?.permissions || [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const selectedRole = allRoles.find((r: CustomRole) => r.name === formData.role);

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-3">
      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Full Name *
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Username *
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
          />
        </div>
        <div>
          <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
          />
        </div>
      </div>

      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Password *
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
        />
      </div>

      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Role *
        </label>
        <select
          value={formData.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          required
          className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
        >
          <option value="">Select role...</option>
          {allRoles.map((role: CustomRole) => (
            <option key={role.id} value={role.name}>{role.displayName}</option>
          ))}
        </select>
        {selectedRole && (
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            💡 Permissions are pre-loaded from role "{selectedRole.displayName}". You can customize them here.
          </p>
        )}
      </div>

      <div className={`flex gap-2 pt-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          type="button"
          onClick={onClose}
          className={`flex-1 px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
        >
          Create
        </button>
      </div>
    </form>
  );
}