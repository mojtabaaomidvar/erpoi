// src/pages/admin/PermissionManager.tsx

import { useState } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { permissionMappingService } from '@shared/authorization/services/PermissionMappingService';
import type { Permission, EntityType } from '@shared/authorization/types';
import type { UIElement, UIElementType } from '@shared/authorization/types/PermissionMapping';

export function PermissionManager() {
  const { isDark } = useTheme();
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityType | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const registry = permissionMappingService.getRegistry();
  const allMappings = permissionMappingService.getAllMappings();

  const entities: EntityType[] = ['client', 'contract', 'invoice', 'inspection', 'inspector', 'report', 'audit_log', 'setting', 'user', 'notification'];
  const modules = Object.keys(registry.byModule);
  const types: UIElementType[] = ['card', 'progress_bar', 'button', 'modal', 'table_column', 'form_field', 'section', 'badge', 'stat', 'chart', 'list_item'];

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all mappings to defaults?')) {
      permissionMappingService.resetToDefaults();
      window.location.reload();
    }
  };

  const handleToggleElement = (elementId: string) => {
    if (!selectedPermission) return;

    const mapping = permissionMappingService.getMapping(selectedPermission);
    if (!mapping) return;

    const isAllowed = mapping.allowedElements.includes(elementId);
    
    if (isAllowed) {
      // Remove from allowed
      const newAllowed = mapping.allowedElements.filter(id => id !== elementId);
      permissionMappingService.setMapping(selectedPermission, newAllowed, mapping.deniedElements);
    } else {
      // Add to allowed
      const newAllowed = [...mapping.allowedElements, elementId];
      permissionMappingService.setMapping(selectedPermission, newAllowed, mapping.deniedElements);
    }

    // Force re-render
    setSelectedPermission(null);
    setTimeout(() => setSelectedPermission(selectedPermission), 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Permission Mapping Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage UI element access for each permission</p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          🔄 Reset to Defaults
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Permissions</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{allMappings.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total UI Elements</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{Object.keys(registry.elements).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">Entities</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{entities.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">Modules</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{modules.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Filters</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Entity</label>
            <select
              value={selectedEntity || ''}
              onChange={(e) => setSelectedEntity(e.target.value as EntityType || null)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Entities</option>
              {entities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Module</label>
            <select
              value={selectedModule || ''}
              onChange={(e) => setSelectedModule(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">All Modules</option>
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Permission</label>
            <select
              value={selectedPermission || ''}
              onChange={(e) => setSelectedPermission(e.target.value as Permission || null)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Permission</option>
              {allMappings.map(mapping => (
                <option key={mapping.permission} value={mapping.permission}>
                  {mapping.permission} ({mapping.allowedElements.length} elements)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permission Mapping Editor */}
      {selectedPermission && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Edit Mapping: <span className="text-indigo-600 dark:text-indigo-400">{selectedPermission}</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* UI Elements List */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">UI Elements</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(registry.elements)
                  .filter(el => {
                    if (selectedEntity && el.entity !== selectedEntity) return false;
                    if (selectedModule && el.module !== selectedModule) return false;
                    return true;
                  })
                  .map(element => {
                    const mapping = permissionMappingService.getMapping(selectedPermission);
                    const isAllowed = mapping?.allowedElements.includes(element.id) || false;
                    
                    return (
                      <div
                        key={element.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isAllowed
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {element.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {element.type} • {element.entity} • {element.module}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleElement(element.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            isAllowed
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-400 dark:hover:bg-slate-500'
                          }`}
                        >
                          {isAllowed ? '✓ Allowed' : '✗ Denied'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Summary</h3>
              <div className="space-y-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700">
                  <div className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Allowed Elements</div>
                  <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
                    {permissionMappingService.getMapping(selectedPermission)?.allowedElements.length || 0}
                  </div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4 border border-rose-200 dark:border-rose-700">
                  <div className="text-sm text-rose-700 dark:text-rose-300 font-medium">Denied Elements</div>
                  <div className="text-3xl font-bold text-rose-900 dark:text-rose-100 mt-1">
                    {permissionMappingService.getMapping(selectedPermission)?.deniedElements?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      // ادامه از مرحله قبل - بخش جدول All Mappings

      {/* All Mappings Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">All Permission Mappings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Permission</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Entity</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Allowed Elements</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Denied Elements</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {allMappings.map(mapping => {
                const entity = mapping.permission.split(':')[0];
                return (
                  <tr key={mapping.permission} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400">
                      {mapping.permission}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-medium">
                        {entity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {mapping.allowedElements.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        {mapping.deniedElements?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPermission(mapping.permission)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* UI Elements Registry */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">UI Elements Registry</h2>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(registry.byModule).map(([module, elementIds]) => (
            <div key={module} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 capitalize">
                📦 {module} ({elementIds.length} elements)
              </h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {elementIds.map(id => {
                  const element = registry.elements[id];
                  return (
                    <div key={id} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="text-slate-400">•</span>
                      <span className="font-medium">{element.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                        {element.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}