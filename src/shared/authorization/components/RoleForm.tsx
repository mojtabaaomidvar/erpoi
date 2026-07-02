// src/shared/authorization/components/RoleForm.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { roleService } from '../services/RoleService';
import { showToast } from '@shared/ui/ToastContainer';

interface RoleFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function RoleForm({ onClose, onSuccess }: RoleFormProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await roleService.createRole({
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        permissions: formData.permissions,
      });
      showToast('success', 'Created', `Role "${formData.displayName}" created`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showToast('error', 'Create Failed', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-3">
      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Display Name *
        </label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          required
          className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
        />
      </div>

      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Technical Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          required
          className={`w-full px-3 py-1.5 rounded border text-sm font-mono ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
        />
      </div>

      <div>
        <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
        />
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