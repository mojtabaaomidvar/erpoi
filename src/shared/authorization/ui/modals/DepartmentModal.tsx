// src/shared/authorization/ui/modals/DepartmentModal.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import type { DBDepartment, DBUser } from '@shared/database/types';

interface DepartmentModalProps {
  department: DBDepartment | null;
  users: DBUser[];
  onClose: () => void;
  onSave: (formData: any) => void;
}

export function DepartmentModal({ department, users, onClose, onSave }: DepartmentModalProps) {
  const { isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
  });

  // 🔧 FIX: کاربران مرتبط با این department
  const relatedUsers = users.filter(u => u.department === department?.id);

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
              {department ? '✏️ Edit Department' : '➕ Create Department'}
            </h2>
            <button onClick={onClose} className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {/* Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={`w-full px-3 py-1.5 rounded border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white'}`}
              placeholder="e.g., Human Resources"
            />
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
              placeholder="Brief description of the department..."
            />
          </div>

          {/* Related Users (فقط در Edit) */}
          {department && (
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Related Users ({relatedUsers.length})
              </label>
              <div className={`rounded border p-2 max-h-32 overflow-y-auto ${
                isDark ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'
              }`}>
                {relatedUsers.length === 0 ? (
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    No users in this department
                  </p>
                ) : (
                  <div className="space-y-1">
                    {relatedUsers.map(user => (
                      <div key={user.id} className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{user.fullName}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          @{user.username}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

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
              {department ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}