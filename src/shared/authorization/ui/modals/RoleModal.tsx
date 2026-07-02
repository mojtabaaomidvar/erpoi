// src/shared/authorization/ui/modals/RoleModal.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { PermissionSelector } from '../components/PermissionSelector';
import type { DBRole } from '@shared/database/types';

interface RoleModalProps {
  role: DBRole | null;
  onClose: () => void;
  onSave: (formData: any) => void;
}

export function RoleModal({ role, onClose, onSave }: RoleModalProps) {
  const { isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    name: role?.name || '',
    displayName: role?.displayName || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`rounded-xl shadow-2xl max-w-xl w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`px-5 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {role ? '✏️ Edit Role' : '➕ Create Role'}
            </h2>
            <button onClick={onClose} className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Names */}
          <div className="grid grid-cols-2 gap-2">
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
                disabled={role?.isSystem}
                className={`w-full px-3 py-1.5 rounded border text-sm font-mono ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'} ${role?.isSystem ? 'opacity-50' : ''}`}
              />
            </div>
          </div>

          {/* Description */}
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

          {/* Permissions */}
          <PermissionSelector
            selectedPermissions={formData.permissions}
            onChange={(permissions) => setFormData({ ...formData, permissions })}
            label="Permissions"
          />

          {/* Buttons */}
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
              {role ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}