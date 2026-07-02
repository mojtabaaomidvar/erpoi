// src/shared/authorization/ui/PermissionManager.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { getDB } from '@shared/database';
import '@shared/authorization/uiElements';
import type { DBPermissionMapping, DBUIElement } from '@shared/database/types';
import { FloatingActionBar } from '@shared/ui/FloatingActionBar';
import { confirmDialog } from '@shared/ui/ConfirmDialog';
import { showToast } from '@shared/ui/ToastContainer';
import { 
  elementDependencies, 
  getAllDependencies, 
  getAllChildren, 
} from '../uiElements/dependencies';
import { useUIElements } from '../uiElements/useUIElements';

type Tab = 'permissions' | 'elements' | 'mappings' | 'help';

export function PermissionManager() {
  const { isDark } = useTheme();
  
  // ═══════════════════════════════════════
  // 🎯 State Declarations
  // ═══════════════════════════════════════
  
  const [activeTab, setActiveTab] = useState<Tab>('mappings');
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEntity, setNewEntity] = useState<string>('');
  const [newAction, setNewAction] = useState<string>('');
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set());
  const [dependencyWarnings, setDependencyWarnings] = useState<Map<string, string[]>>(new Map());
  
  // 🔧 FIX: استفاده از hook برای گرفتن UI Elements
  const uiElements = useUIElements();

  // ═══════════════════════════════════════
  // 🎨 Constants
  // ═══════════════════════════════════════
  
  const typeColors: Record<string, string> = {
    card: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    progress_bar: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    button: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    modal: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    table_column: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    form_field: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    section: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    stat: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    chart: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    list_item: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
  };

  const componentIcons: Record<string, string> = {
    ClientList: '📋',
    ClientDetails: '📄',
    ClientForm: '➕',
    ClientEditModal: '✏️',
    ContractList: '📋',
    ContractDetails: '📄',
    ContractForm: '➕',
    InvoiceList: '📋',
    InvoiceDetails: '📄',
    InspectionList: '📋',
    InspectionDetails: '📄',
    Dashboard: '📊',
  };

  const getComponentIcon = (component: string): string => {
    return componentIcons[component] || '📦';
  };

  const tabs: Array<{ key: Tab; label: string; icon: string }> = [
    { key: 'mappings', label: 'Mappings', icon: '🔗' },
    { key: 'permissions', label: 'Permissions', icon: '🔑' },

    { key: 'help', label: 'Help', icon: '💡' },
  ];

  // ═══════════════════════════════════════
  // 💾 Load Mappings from DB
  // ═══════════════════════════════════════
  
  const loadFromDB = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      const allMappings = await db.getAllPermissionMappings();
      const map = new Map<string, DBPermissionMapping>(
        allMappings.map((m: DBPermissionMapping) => [m.permission, m])
      );
      setMappings(map);
    } catch (error: any) {
      console.error('Failed to load:', error);
      showToast('error', 'Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromDB();
  }, []);

  // ═══════════════════════════════════════
  // 🎯 Computed Values
  // ═══════════════════════════════════════

  const entities = useMemo(() => [...new Set(uiElements.map(el => el.entity))].sort(), [uiElements]);
  const modules = useMemo(() => [...new Set(uiElements.map(el => el.module))].sort(), [uiElements]);
  const types = useMemo(() => [...new Set(uiElements.map(el => el.type))].sort(), [uiElements]);

  const allMappingsArray = useMemo(() => 
    Array.from(mappings.values()).sort((a, b) => a.permission.localeCompare(b.permission)), 
    [mappings]
  );

  const filteredElements = useMemo(() => {
    return uiElements.filter(el => {
      if (filterEntity && el.entity !== filterEntity) return false;
      if (filterModule && el.module !== filterModule) return false;
      if (filterType && el.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) ||
          el.name.toLowerCase().includes(q) ||
          el.component?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [uiElements, filterEntity, filterModule, filterType, searchQuery]);

  const elementsByComponent = useMemo(() => {
    const grouped: Record<string, DBUIElement[]> = {};
    filteredElements.forEach(el => {
      const component = el.component || 'Unknown';
      if (!grouped[component]) grouped[component] = [];
      grouped[component].push(el);
    });
    return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
  }, [filteredElements]);

  const hasChanges = useMemo(() => pendingChanges.size > 0, [pendingChanges]);

  const selectedMapping = useMemo(() => {
    if (!selectedPermission) return null;
    return pendingChanges.get(selectedPermission) || mappings.get(selectedPermission) || null;
  }, [selectedPermission, pendingChanges, mappings]);

  const newPermissionPreview = useMemo(() => {
    if (!newEntity || !newAction) return '';
    return `${newEntity}:${newAction}`;
  }, [newEntity, newAction]);

  // ═══════════════════════════════════════
  // ✏️ Handlers
  // ═══════════════════════════════════════

  const handleToggleElement = useCallback((elementId: string) => {
    if (!selectedPermission) return;

    const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
    const currentAllowed = currentMapping?.allowedElements || [];
    const currentDenied = currentMapping?.deniedElements || [];

    const isAllowed = currentAllowed.includes(elementId);
    let newAllowed = [...currentAllowed];

    if (isAllowed) {
      newAllowed = newAllowed.filter(id => id !== elementId);
      const children = getAllChildren(elementId, uiElements.map(el => el.id));
      children.forEach(child => {
        newAllowed = newAllowed.filter(id => id !== child);
      });
      if (children.length > 0) {
        setDependencyWarnings(prev => new Map(prev).set(elementId, children));
        setTimeout(() => {
          setDependencyWarnings(prev => {
            const newMap = new Map(prev);
            newMap.delete(elementId);
            return newMap;
          });
        }, 3000);
      }
    } else {
      newAllowed.push(elementId);
      const dependencies = getAllDependencies(elementId);
      dependencies.forEach(dep => {
        if (!newAllowed.includes(dep)) {
          newAllowed.push(dep);
        }
      });
    }

    const newMapping: DBPermissionMapping = {
      permission: selectedPermission,
      allowedElements: newAllowed,
      deniedElements: currentDenied,
      updatedAt: new Date().toISOString(),
    };

    setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  }, [selectedPermission, mappings, pendingChanges, uiElements]);

  const handleToggleComponent = useCallback((component: string) => {
    setCollapsedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(component)) {
        newSet.delete(component);
      } else {
        newSet.add(component);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllInComponent = useCallback((component: string, elements: DBUIElement[]) => {
    if (!selectedPermission) return;
    const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
    const currentAllowed = currentMapping?.allowedElements || [];
    const currentDenied = currentMapping?.deniedElements || [];
    const elementIds = elements.map(el => el.id);
    const newAllowed = [...new Set([...currentAllowed, ...elementIds])];
    const newMapping: DBPermissionMapping = {
      permission: selectedPermission,
      allowedElements: newAllowed,
      deniedElements: currentDenied,
      updatedAt: new Date().toISOString(),
    };
    setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  }, [selectedPermission, mappings, pendingChanges]);

  const handleDeselectAllInComponent = useCallback((component: string, elements: DBUIElement[]) => {
    if (!selectedPermission) return;
    const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
    const currentAllowed = currentMapping?.allowedElements || [];
    const currentDenied = currentMapping?.deniedElements || [];
    const elementIds = new Set(elements.map(el => el.id));
    const newAllowed = currentAllowed.filter(id => !elementIds.has(id));
    const newMapping: DBPermissionMapping = {
      permission: selectedPermission,
      allowedElements: newAllowed,
      deniedElements: currentDenied,
      updatedAt: new Date().toISOString(),
    };
    setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  }, [selectedPermission, mappings, pendingChanges]);

  const handleSave = useCallback(async () => {
    try {
      const db = await getDB();
      for (const [permission, mapping] of pendingChanges.entries()) {
        await db.setPermissionMapping(permission, mapping.allowedElements, mapping.deniedElements);
      }
      setMappings(prev => {
        const newMap = new Map(prev);
        pendingChanges.forEach((mapping, permission) => {
          newMap.set(permission, mapping);
        });
        return newMap;
      });
      const count = pendingChanges.size;
      setPendingChanges(new Map());
      showToast('success', 'Saved', `${count} mapping(s) saved`);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message);
      throw error;
    }
  }, [pendingChanges]);

  const handleCancel = useCallback(() => {
    setPendingChanges(new Map());
    showToast('info', 'Discarded', 'Changes discarded');
  }, []);

  const handleDeleteMapping = async (permission: string) => {
    const confirmed = await confirmDialog({
      title: 'Delete Mapping',
      message: `Delete mapping for "${permission}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      const db = await getDB();
      await db.setPermissionMapping(permission, [], []);
      setMappings(prev => {
        const newMap = new Map(prev);
        newMap.delete(permission);
        return newMap;
      });
      setPendingChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(permission);
        return newMap;
      });
      if (selectedPermission === permission) setSelectedPermission('');
      showToast('success', 'Deleted', `Mapping for "${permission}" deleted`);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.message);
    }
  };

  const handleOpenCreateModal = () => {
    setNewEntity('');
    setNewAction('');
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewEntity('');
    setNewAction('');
  };

  const handleCreateMapping = async () => {
    if (!newEntity) {
      showToast('error', 'Entity Required', 'Please select an entity');
      return;
    }
    if (!newAction.trim()) {
      showToast('error', 'Action Required', 'Please enter an action');
      return;
    }
    if (!/^[a-z_]+$/.test(newAction)) {
      showToast('error', 'Invalid Action', 'Action can only contain lowercase letters and underscores');
      return;
    }
    const permission = `${newEntity}:${newAction}`;
    if (mappings.has(permission) || pendingChanges.has(permission)) {
      showToast('error', 'Exists', 'This permission mapping already exists');
      return;
    }
    const newMapping: DBPermissionMapping = {
      permission,
      allowedElements: [],
      deniedElements: [],
      updatedAt: new Date().toISOString(),
    };
    setPendingChanges(prev => new Map(prev).set(permission, newMapping));
    setSelectedPermission(permission);
    setFilterEntity(newEntity);
    setSearchQuery('');
    setFilterModule('');
    setFilterType('');
    setCollapsedComponents(new Set());
    handleCloseCreateModal();
    showToast('success', 'Created', `Mapping for "${permission}" created`);
  };

  const handleSelectPermission = (permission: string) => {
    setSelectedPermission(permission);
    const entity = permission.split(':')[0];
    if (entities.includes(entity)) {
      setFilterEntity(entity);
    } else {
      setFilterEntity('');
    }
    setSearchQuery('');
    setFilterModule('');
    setFilterType('');
    setCollapsedComponents(new Set());
  };

  const handleEntityFilterChange = (entity: string) => {
    setFilterEntity(entity);
    if (selectedPermission) {
      const selectedEntity = selectedPermission.split(':')[0];
      if (entity && entity !== selectedEntity) {
        setSelectedPermission('');
      }
    }
  };

  // ═══════════════════════════════════════
  // 🎯 Loading State
  // ═══════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // 🎯 Render
  // ═══════════════════════════════════════

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className={`flex gap-1 p-1 rounded-lg w-fit ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? isDark ? 'bg-slate-800 text-slate-100 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.key === 'mappings' && hasChanges && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                {pendingChanges.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Mappings */}
      {activeTab === 'mappings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Mappings</div>
              <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {allMappingsArray.length + pendingChanges.size}
              </div>
            </div>
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>UI Elements</div>
              <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{uiElements.length}</div>
            </div>
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Entities</div>
              <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{entities.length}</div>
            </div>
            <div className={`rounded-xl p-4 border ${isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`text-xs font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Unsaved Changes</div>
              <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                {pendingChanges.size}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Permission List */}
            <div className={`lg:col-span-1 rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  📋 Permissions ({allMappingsArray.length})
                </h3>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 flex items-center gap-1"
                >
                  <span>➕</span>
                  <span>New</span>
                </button>
              </div>
              <div className="max-h-[700px] overflow-y-auto">
                {allMappingsArray.length === 0 && pendingChanges.size === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-2">🔑</div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No mappings yet</p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-3 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      + Create First Mapping
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {Array.from(new Map([
                      ...Array.from(mappings.entries()),
                      ...Array.from(pendingChanges.entries()),
                    ]).entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([permission, mapping]) => {
                      const isSelected = selectedPermission === permission;
                      const isPending = pendingChanges.has(permission);
                      const isSaved = mappings.has(permission);
                      return (
                        <div
                          key={permission}
                          onClick={() => handleSelectPermission(permission)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            isSelected
                              ? isDark ? 'bg-indigo-900/30 border-l-4 border-l-indigo-400' : 'bg-indigo-50 border-l-4 border-l-indigo-500'
                              : isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <code className={`text-xs font-mono font-semibold truncate ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                  {permission}
                                </code>
                                {isPending && !isSaved && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-white rounded">NEW</span>
                                )}
                                {isPending && isSaved && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-white rounded">MODIFIED</span>
                                )}
                              </div>
                              <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                ✓ {mapping.allowedElements.length} allowed
                              </div>
                            </div>
                            {isSaved && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMapping(permission);
                                }}
                                className="text-red-500 hover:text-red-700 text-xs px-2"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Element Selector */}
            <div className={`lg:col-span-2 rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              {selectedPermission ? (
                <>
                  <div className={`px-4 py-3 border-b ${isDark ? 'bg-indigo-900/20 border-slate-700' : 'bg-indigo-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          Editing: <code className={`px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-indigo-300' : 'bg-white text-indigo-700'}`}>
                            {selectedPermission}
                          </code>
                        </h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Grouped by component
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <div className={`px-3 py-1 rounded ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-800'}`}>
                          <span className="text-xs font-medium">✓ {selectedMapping?.allowedElements.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Search..."
                        className={`col-span-2 px-2 py-1.5 rounded border text-xs ${
                          isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white text-slate-900'
                        }`}
                      />
                      
                    </div>
                  </div>

                  <div className={`p-4 max-h-[600px] overflow-y-auto ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                    {elementsByComponent.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No elements match filters</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {elementsByComponent.map(([component, elements]) => {
                          const isCollapsed = collapsedComponents.has(component);
                          const allowedCount = elements.filter(el => selectedMapping?.allowedElements.includes(el.id)).length;
                          const totalCount = elements.length;
                          const allSelected = allowedCount === totalCount;
                          return (
                            <div
                              key={component}
                              className={`rounded-lg border overflow-hidden ${
                                isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div
                                onClick={() => handleToggleComponent(component)}
                                className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                                  isDark ? 'bg-slate-800/70 hover:bg-slate-800' : 'bg-slate-100 hover:bg-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className={`text-xs transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                                  <span className="text-lg">{getComponentIcon(component)}</span>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                      {component}
                                    </div>
                                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {allowedCount} / {totalCount} allowed
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-16 h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        allSelected ? 'bg-emerald-500' : allowedCount > 0 ? 'bg-indigo-500' : 'bg-slate-400'
                                      }`}
                                      style={{ width: `${(allowedCount / totalCount) * 100}%` }}
                                    />
                                  </div>
                                  {selectedPermission && (
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => handleSelectAllInComponent(component, elements)}
                                        disabled={allSelected}
                                        className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                                          allSelected
                                            ? isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : isDark ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                        }`}
                                      >
                                        ✓ All
                                      </button>
                                      <button
                                        onClick={() => handleDeselectAllInComponent(component, elements)}
                                        disabled={allowedCount === 0}
                                        className={`px-2 py-0.5 text-[10px] rounded font-medium transition-colors ${
                                          allowedCount === 0
                                            ? isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                            : isDark ? 'bg-rose-900/30 text-rose-300 hover:bg-rose-900/50' : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                        }`}
                                      >
                                        ✗ None
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {!isCollapsed && (
                                <div className={`p-3 ${isDark ? 'bg-slate-900/30' : 'bg-white'}`}>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {elements.map(element => {
                                      const isAllowed = selectedMapping?.allowedElements.includes(element.id) || false;
                                      const deps: string[] = elementDependencies[element.id] || [];
                                      const unsatisfiedDeps = deps.filter((dep: string) => !selectedMapping?.allowedElements.includes(dep));
                                      const hasUnmetDeps = unsatisfiedDeps.length > 0;
                                      const children = getAllChildren(element.id, uiElements.map(el => el.id));
                                      const hasChildren = children.length > 0;
                                      const isClickable = (element as any).clickable === true;
                                      
                                      return (
                                        <div
                                          key={element.id}
                                          onClick={() => handleToggleElement(element.id)}
                                          className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all ${
                                            isAllowed
                                              ? isDark ? 'border-emerald-600 bg-emerald-900/20' : 'border-emerald-400 bg-emerald-50'
                                              : hasUnmetDeps
                                                ? isDark ? 'border-amber-700 bg-amber-900/10 opacity-60' : 'border-amber-300 bg-amber-50 opacity-60'
                                                : isDark ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800/70' : 'border-slate-200 bg-white hover:bg-slate-50'
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <div className={`text-xs font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                                {element.name}
                                                {isClickable && <span className="ml-1" title="Clickable - enables details view">👆</span>}
                                                {hasChildren && <span className="ml-1" title="Has dependent elements">🔗</span>}
                                              </div>
                                              <div className={`text-[9px] font-mono mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                {element.id}
                                              </div>
   
                                              {hasUnmetDeps && (
                                                <div className={`text-[9px] mt-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                  ⚠️ Requirments: {unsatisfiedDeps.slice(0, 2).join(', ')}{unsatisfiedDeps.length > 2 ? '...' : ''}
                                                </div>
                                              )}
                                            </div>
                                            <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                              isAllowed ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                                            }`}>
                                              {isAllowed ? '✓' : '✗'}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                            <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${typeColors[element.type] || 'bg-slate-100'}`}>
                                              {element.type}
                                            </span>
                                            <span className={`text-[9px] px-1 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                                              {element.entity}
                                            </span>
                                            {hasChildren && (
                                              <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                🔗 {children.length}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    Select a Permission
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Choose from the list or create a new one
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Permissions */}
      {activeTab === 'permissions' && (
        <div className={`rounded-xl border p-6 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>🔑 All Available Permissions</h2>
          <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            These are the permissions you've created.
          </p>
          {allMappingsArray.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🔑</div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No permissions created yet</p>
              <button
                onClick={() => { setActiveTab('mappings'); handleOpenCreateModal(); }}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                + Create First Permission
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {entities.map(entity => {
                const entityPermissions = allMappingsArray.filter(p => p.permission.startsWith(`${entity}:`));
                if (entityPermissions.length === 0) return null;
                return (
                  <div key={entity} className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                    <h3 className={`text-sm font-bold capitalize mb-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>📦 {entity}</h3>
                    <div className="space-y-1">
                      {entityPermissions.map(mapping => (
                        <code key={mapping.permission} className={`block text-[10px] font-mono px-2 py-0.5 rounded ${isDark ? 'bg-slate-700 text-indigo-300' : 'bg-white text-indigo-700'}`}>
                          {mapping.permission}
                        </code>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Help */}
      {activeTab === 'help' && (
        <div className={`rounded-xl border p-6 ${isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50/50'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>💡 How to Use</h2>
          <div className={`text-sm space-y-3 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
            <div>
              <h3 className="font-bold mb-1">🔗 Dependencies</h3>
              <p>Elements have parent-child relationships:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Activating a child auto-activates parents</li>
                <li>Deactivating a parent auto-deactivates children</li>
                <li>⚠️ Warning shows unmet dependencies</li>
                <li>🔗 Icon shows elements with children</li>
                <li>👆 Icon shows clickable elements (enable details view)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-1">👆 Clickable Elements</h3>
              <p>Elements marked with 👆 are clickable list items:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code className="px-1 rounded bg-white/50 dark:bg-black/20">list_item</code> = فقط دیدن لیست</li>
                <li><code className="px-1 rounded bg-white/50 dark:bg-black/20">list_item_click</code> = کلیک روی آیتم (فعال‌سازی جزئیات)</li>
                <li>جزئیات (stats, progress bars) نیاز به <code className="px-1 rounded bg-white/50 dark:bg-black/20">list_item_click</code> دارن</li>
              </ul>
            </div>
            <div className={`mt-4 p-3 rounded border ${isDark ? 'border-amber-700 bg-amber-900/30' : 'border-amber-200 bg-amber-50'}`}>
              <p className="font-bold">⚠️ Important</p>
              <p className="mt-1">Changes are NOT saved until you click the Save button at the bottom right.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`rounded-xl shadow-2xl max-w-md w-full ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>➕ Create New Permission Mapping</h2>
                <button onClick={handleCloseCreateModal} className={`text-2xl ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>×</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>1️⃣ Select Entity *</label>
                <select
                  value={newEntity}
                  onChange={(e) => setNewEntity(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
                >
                  <option value="">-- Select an entity --</option>
                  {entities.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>2️⃣ Enter Action *</label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                  placeholder="e.g., create, read, open_add_modal"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder-slate-400' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Only lowercase letters and underscores</p>
              </div>
              <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-300 bg-indigo-50'}`}>
                <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>🔍 Preview</div>
                <code className={`text-lg font-mono font-bold ${newPermissionPreview ? isDark ? 'text-indigo-200' : 'text-indigo-900' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {newPermissionPreview || 'entity:action'}
                </code>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex gap-3 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
              <button onClick={handleCloseCreateModal} className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}>Cancel</button>
              <button
                onClick={handleCreateMapping}
                disabled={!newEntity || !newAction.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${!newEntity || !newAction.trim() ? isDark ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30'}`}
              >
                Create Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingActionBar
        onSave={handleSave}
        onCancel={handleCancel}
        hasChanges={hasChanges}
        saveLabel="Save Mappings"
        cancelLabel="Discard"
      />
    </div>
  );
}