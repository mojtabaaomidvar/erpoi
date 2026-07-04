// src/shared/authorization/ui/modals/UserModal.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { DepartmentSelect } from '@shared/authorization/components/DepartmentSelect';
import type { DBUser } from '@shared/database/types';

interface UserModalProps {
  user: DBUser | null;
  onClose: () => void;
  onSave: (formData: any) => void;
}

// 🔧 لیست سمت‌های شغلی (فقط نمایشی)
const JOB_TITLES = [
  { value: 'admin', label: '👑 Administrator' },
  { value: 'manager', label: '👔 Manager' },
  { value: 'coordinator', label: '👷 Coordinator' },
  { value: 'expert', label: '🎯 Expert' },
  { value: 'inspector', label: '🔍 Inspector' },
];

export function UserModal({ user, onClose, onSave }: UserModalProps) {
  const { isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    password: '',
    role: user?.role || 'viewer',
    department: user?.department || '',
    status: user?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`rounded-xl shadow-2xl max-w-md w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`px-5 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {user ? '✏️ Edit User' : '➕ Create User'}
            </h2>
            <button onClick={onClose} className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
          </div>
        </div>

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

          {!user && (
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!user}
                className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
              />
            </div>
          )}

          {/* 🔧 Position */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              📋 Job Position
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
            >
              {JOB_TITLES.map(title => (
                <option key={title.value} value={title.value}>{title.label}</option>
              ))}
            </select>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              For display purposes only. Manage actual permissions via 🔐 button.
            </p>
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Department
            </label>
            <DepartmentSelect
              value={formData.department}
              onChange={(value) => setFormData({ ...formData, department: value })}
              className="text-sm py-1.5"
              placeholder="Select department..."
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
              className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
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
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}