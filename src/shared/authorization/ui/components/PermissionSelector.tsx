// src/shared/authorization/ui/components/PermissionSelector.tsx

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { getDB } from '@shared/database';
import type { DBPermissionMapping } from '@shared/database/types';
import { ENTITIES, ENTITY_GROUPS } from '@shared/authorization/permissions';

interface PermissionSelectorProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
  label?: string;
}

export function PermissionSelector({ 
  selectedPermissions, 
  onChange,
  label = 'Permissions'
}: PermissionSelectorProps) {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [mappings, setMappings] = useState<DBPermissionMapping[]>([]);

  useEffect(() => {
    const loadMappings = async () => {
      try {
        const db = await getDB();
        const all = await db.getAllPermissionMappings();
        setMappings(all);
      } catch (error) {
        console.error('Failed to load permission mappings:', error);
      }
    };
    loadMappings();
  }, []);

  // 🔧 FIX: فقط از DB می‌خونه - اگه خالی بود، خالی برمی‌گردونه
  const availablePermissions = useMemo(() => {
    return mappings.map(m => m.permission).sort();
  }, [mappings]);

  const filteredPermissions = useMemo(() => {
    return availablePermissions.filter(perm => {
      const [entity] = perm.split(':');
      if (filterEntity && entity !== filterEntity) return false;
      if (searchQuery) return perm.toLowerCase().includes(searchQuery.toLowerCase());
      return true;
    });
  }, [availablePermissions, filterEntity, searchQuery]);

  const togglePermission = (permission: string) => {
    if (selectedPermissions.includes(permission)) {
      onChange(selectedPermissions.filter(p => p !== permission));
    } else {
      onChange([...selectedPermissions, permission]);
    }
  };

  const selectAll = () => {
    onChange([...new Set([...selectedPermissions, ...filteredPermissions])]);
  };

  const deselectAll = () => {
    const filteredPerms = new Set(filteredPermissions);
    onChange(selectedPermissions.filter(p => !filteredPerms.has(p)));
  };

  return (
    <div>
      {label && (
        <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {label} ({selectedPermissions.length} selected)
        </label>
      )}

      {/* 🔧 FIX: پیام اگه هیچ permission ای در DB نیست */}
      {availablePermissions.length === 0 && (
        <div className={`p-4 rounded-lg border mb-3 ${
          isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50'
        }`}>
          <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
            ⚠️ No permissions defined yet. Go to <strong>User Management → Permissions</strong> tab to create permissions first.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search permissions..."
          className={`px-3 py-2 rounded-lg border text-sm ${
            isDark 
              ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400' 
              : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
          }`}
        />
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${
            isDark 
              ? 'border-slate-600 bg-slate-700 text-slate-100' 
              : 'border-slate-300 bg-white text-slate-900'
          }`}
        >
          <option value="">All Entities</option>
          {ENTITIES.map(e => (
            <option key={e} value={e}>
              {ENTITY_GROUPS[e].icon} {ENTITY_GROUPS[e].label}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Actions */}
      {availablePermissions.length > 0 && (
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={selectAll}
            className={`px-3 py-1.5 text-xs rounded font-medium ${
              isDark 
                ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' 
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
            }`}
          >
            ✓ Select All
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className={`px-3 py-1.5 text-xs rounded font-medium ${
              isDark 
                ? 'bg-rose-900/30 text-rose-300 hover:bg-rose-900/50' 
                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
            }`}
          >
            ✗ Deselect All
          </button>
        </div>
      )}

      {/* Permissions List */}
      <div className={`rounded-lg border max-h-80 overflow-y-auto ${
        isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
      }`}>
        {filteredPermissions.length === 0 ? (
          <div className={`p-6 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {availablePermissions.length === 0 
              ? 'No permissions defined yet' 
              : 'No permissions match your filter'}
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredPermissions.map(perm => {
              const isSelected = selectedPermissions.includes(perm);
              const mapping = mappings.find(m => m.permission === perm);
              return (
                <div
                  key={perm}
                  onClick={() => togglePermission(perm)}
                  className={`px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'
                      : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600'
                          : isDark ? 'border-slate-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <code className={`text-sm font-mono ${
                        isDark ? 'text-indigo-300' : 'text-indigo-700'
                      }`}>
                        {perm}
                      </code>
                    </div>
                    {mapping && (
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {mapping.allowedElements.length} elements
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}