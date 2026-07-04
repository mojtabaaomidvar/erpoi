// src/shared/authorization/ui/modals/UserPermissionsModal.tsx

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { getDB } from '@shared/database';
import { showToast } from '@shared/ui/ToastContainer';
import type { DBUser, DBPermissionMapping } from '@shared/database/types';

interface UserPermissionsModalProps {
  user: DBUser;
  onClose: () => void;
  onSave: (permissions: string[]) => void;
}

export function UserPermissionsModal({ user, onClose, onSave }: UserPermissionsModalProps) {
  const { isDark } = useTheme();
  const [permissions, setPermissions] = useState<string[]>(user.customPermissions || []);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔧 بارگذاری لیست permission های موجود از DB
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        const db = await getDB();
        const mappings = await db.getAllPermissionMappings();
        const perms = mappings.map((m: DBPermissionMapping) => m.permission).sort();
        setAvailablePermissions(perms);
      } catch (error: any) {
        console.error('Failed to load permissions:', error);
        showToast('error', 'Load Failed', error.message);
      } finally {
        setLoading(false);
      }
    };
    loadPermissions();
  }, []);

  // 🔧 گروه‌بندی permission ها بر اساس entity
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const filtered = availablePermissions.filter(p => 
      !searchQuery || p.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    filtered.forEach(perm => {
      const entity = perm.split(':')[0];
      if (!groups[entity]) groups[entity] = [];
      groups[entity].push(perm);
    });
    
    // مرتب‌سازی گروه‌ها
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [availablePermissions, searchQuery]);

  const handleToggle = (permission: string) => {
    setPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSelectAll = () => {
    setPermissions([...availablePermissions]);
  };

  const handleClearAll = () => {
    setPermissions([]);
  };

  const handleSave = () => {
    onSave(permissions);
  };

  // 🔧 آیکون برای هر entity
  const getEntityIcon = (entity: string): string => {
    const icons: Record<string, string> = {
      client: '👥',
      contract: '📄',
      inspection: '🔍',
      inspector: '👷',
      invoice: '💵',
      ncr: '⚠️',
      report: '📊',
      dashboard: '📈',
      user: '👤',
      department: '🏢',
      setting: '⚙️',
    };
    return icons[entity] || '🔐';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`rounded-xl shadow-2xl max-w-3xl w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                🔐 Assign Permissions to User
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {user.fullName}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className={`text-2xl ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Search & Actions */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🔍 Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                isDark 
                  ? 'border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500' 
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              onClick={handleSelectAll}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${
                isDark 
                  ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' 
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${
                isDark 
                  ? 'bg-rose-900/30 text-rose-300 hover:bg-rose-900/50' 
                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
              }`}
            >
              Clear All
            </button>
          </div>

          {/* Permission List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2 animate-pulse">⏳</div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Loading permissions...</p>
            </div>
          ) : groupedPermissions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {searchQuery ? 'No permissions match your search' : 'No permissions available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedPermissions.map(([entity, perms]) => (
                <div 
                  key={entity} 
                  className={`rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}
                >
                  {/* Entity Header */}
                  <div className={`px-4 py-2 border-b flex items-center justify-between ${
                    isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getEntityIcon(entity)}</span>
                      <h4 className={`text-xs font-bold uppercase tracking-wider capitalize ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        {entity}
                      </h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {perms.filter(p => permissions.includes(p)).length}/{perms.length}
                      </span>
                    </div>
                  </div>
                  
                  {/* Permissions */}
                  <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                    {perms.map(perm => {
                      const isSelected = permissions.includes(perm);
                      return (
                        <label
                          key={perm}
                          className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all ${
                            isSelected
                              ? isDark 
                                ? 'bg-emerald-900/30 border border-emerald-700 hover:bg-emerald-900/50' 
                                : 'bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                              : isDark 
                                ? 'hover:bg-slate-700/50 border border-transparent' 
                                : 'hover:bg-slate-100 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggle(perm)}
                            className="rounded"
                          />
                          <code className={`text-xs font-mono flex-1 ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {perm}
                          </code>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex gap-3 px-6 py-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium ${
              isDark 
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            💾 Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
}