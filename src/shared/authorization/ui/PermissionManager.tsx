// src/shared/authorization/ui/PermissionManager.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Badge, Modal } from '@design-system';
import { useTheme } from '@app/providers/ThemeProvider';
import { getDB } from '@shared/database';
import { uiElementRegistry } from '@shared/authorization/uiElements/registry';
import '@shared/authorization/uiElements';
import type { Permission, Role } from '@shared/authorization/types';
import type { DBPermissionMapping, DBUIElement } from '@shared/database/types';
import { ROLES, hasPermission } from '@shared/authorization/roles';
import { useAuth } from '@features/auth/hooks/useAuth';
import { showToast } from '@shared/ui/ToastContainer';
import { confirmDialog } from '@shared/ui/ConfirmDialog';
import { 
  elementDependencies, 
  getAllChildren as getAllChildrenFromDeps,
  getAllDependenciesChain,
  checkDependenciesChain,
  getAllChildrenChain
} from '@shared/authorization/uiElements/dependencies';
import { getLinkedGroup, isLinkedElement, getElementDepth, getLinkedGroupMaster, isMasterElement, getLinkedSlaves } from '@shared/authorization/uiElements/linkedElements';
  
interface SavePreviewItem {
  permission: string;
  oldAllowed: string[];
  newAllowed: string[];
  added: string[];
  removed: string[];
  isNew: boolean;
}

interface DeleteErrorInfo {
  permission: string;
  assignedToRoles: string[];
  assignedToUsers: string[];
}

export function PermissionManager() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ClientList', 'ClientDetails']));
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<string | null>(null);
  const [editingAllowed, setEditingAllowed] = useState<string[]>([]);
  const [editingDenied, setEditingDenied] = useState<string[]>([]);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState<DeleteErrorInfo | null>(null);
  const [uiElements, setUiElements] = useState<DBUIElement[]>([]);
  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPermission, setPreviewPermission] = useState<string>('');
  const [previewElements, setPreviewElements] = useState<DBUIElement[]>([]);
  const [newEntity, setNewEntity] = useState<string>('');
  const [newAction, setNewAction] = useState<string>('');
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set());
  const [dependencyWarnings, setDependencyWarnings] = useState<Map<string, string[]>>(new Map());
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicatePermission, setDuplicatePermission] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [pendingElementToggle, setPendingElementToggle] = useState<{
	elementId: string;
	missingDeps: string[];
  } | null>(null);

  const [showSavePreview, setShowSavePreview] = useState(false);
  const [savePreviewItems, setSavePreviewItems] = useState<SavePreviewItem[]>([]);
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
          (el.description || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [uiElements, filterEntity, filterModule, filterType, searchQuery]);

  const COMPONENT_ORDER: Record<string, number> = {
    'ClientList': 1, 'ClientDetails': 2, 'ClientForm': 3, 'ClientEditModal': 4,
    'ContractList': 5, 'ContractDetails': 6, 'ContractForm': 7,
    'InspectionList': 8, 'InspectionDetails': 9,
    'InvoiceList': 10, 'InvoiceDetails': 11, 'Dashboard': 12,
  };

  const elementsByComponent = useMemo(() => {
    const grouped: Record<string, DBUIElement[]> = {};
    filteredElements.forEach(el => {
      const component = el.component || 'Unknown';
      if (!grouped[component]) grouped[component] = [];
      grouped[component].push(el);
    });
    return Object.entries(grouped).sort((a, b) => {
      const orderA = COMPONENT_ORDER[a[0]] ?? 999;
      const orderB = COMPONENT_ORDER[b[0]] ?? 999;
      return orderA - orderB;
    });
  }, [filteredElements]);

  const hasChanges = useMemo(() => pendingChanges.size > 0, [pendingChanges]);

  const selectedMapping = useMemo(() => {
    if (!selectedPermission) return null;
    return pendingChanges.get(selectedPermission) || mappings.get(selectedPermission) || null;
  }, [selectedPermission, pendingChanges, mappings]);

  const getAllChildren = useCallback((elementId: string, allElementIds: string[]): string[] => {
    return getAllChildrenFromDeps(elementId, allElementIds);
  }, []);
  
  const checkPermissionAssignments = useCallback(async (permission: string): Promise<{
	  assignedToRoles: string[];
	  assignedToUsers: string[];
	  canDelete: boolean;
	}> => {
	  try {
		const db = await getDB();
		
		// گرفتن همه role‌ها
		const allRoles = await db.getAllRoles();
		const assignedToRoles = allRoles
		  .filter(role => role.permissions?.includes(permission))
		  .map(role => role.displayName || role.name);
		
		// گرفتن همه user‌ها
		const allUsers = await db.getAllUsers();
		const assignedToUsers = allUsers
		  .filter(user => (user as any).customPermissions?.includes(permission))
		  .map(user => user.fullName || user.username);
		
		return {
		  assignedToRoles,
		  assignedToUsers,
		  canDelete: assignedToRoles.length === 0 && assignedToUsers.length === 0,
		};
	  } catch (error) {
		console.error('[PermissionManager] Failed to check assignments:', error);
		return {
		  assignedToRoles: [],
		  assignedToUsers: [],
		  canDelete: false,
		};
	  }
	}, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await getDB();
        const registryElements = uiElementRegistry.getAllElements();
        setUiElements(registryElements as DBUIElement[]);
        const allMappings = await db.getAllPermissionMappings();
        const map = new Map<string, DBPermissionMapping>(
          allMappings.map(m => [m.permission, m])
        );
        setMappings(map);
      } catch (error) {
        console.error('[PermissionManager] Failed to load:', error);
        showToast('error', 'Error', 'Failed to load permission data');
      }
    };
    loadData();
  }, []);

  const handleToggleElement = useCallback((elementId: string) => {
  if (!selectedPermission) return;

  const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
  const currentAllowed = currentMapping?.allowedElements || [];

  const isAllowed = currentAllowed.includes(elementId);

  if (!isAllowed) {
    const chain = getAllDependenciesChain(elementId);
    const missingDeps = chain.filter(dep => !currentAllowed.includes(dep));
    
    if (missingDeps.length > 0) {
      setPendingElementToggle({ elementId, missingDeps });
      setShowDependencyModal(true);
      return;
    }
  }

  const linkedGroup = getLinkedGroup(elementId);
  const isMaster = isMasterElement(elementId);
  
  if (linkedGroup && !isMaster) {
    const master = getLinkedGroupMaster(elementId);
    showToast('warning', 'Linked Element', 
      `This is linked to "${master}". Click on the master element to toggle.`);
    return;
  }

  let newAllowed = [...currentAllowed];
  const newDenied = [...(currentMapping?.deniedElements || [])];

  if (isAllowed) {
    newAllowed = newAllowed.filter(id => id !== elementId);
    
    if (linkedGroup) {
      const slaves = getLinkedSlaves(elementId);
      slaves.forEach(slave => {
        newAllowed = newAllowed.filter(id => id !== slave);
      });
    }
    
    // حذف children ها
    const children = getAllChildrenChain(elementId, uiElements.map(el => el.id));
    children.forEach(child => {
      newAllowed = newAllowed.filter(id => id !== child);
    });
  } else {
    newAllowed.push(elementId);
    
    if (linkedGroup) {
      const slaves = getLinkedSlaves(elementId);
      slaves.forEach(slave => {
        if (!newAllowed.includes(slave)) {
          newAllowed.push(slave);
        }
      });
    }
  }

  const newMapping: DBPermissionMapping = {
    permission: selectedPermission,
    allowedElements: newAllowed,
    deniedElements: newDenied,
    updatedAt: new Date().toISOString(),
  };

  setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  
  if (linkedGroup && linkedGroup.length > 1) {
    showToast('info', 'Linked Elements', `Master: ${elementId}`);
  }
}, [selectedPermission, pendingChanges, mappings, uiElements]);

  const handleToggleElementSyncAll = useCallback((elementId: string) => {
  if (!selectedPermission) return;

  const linkedGroup = getLinkedGroup(elementId) || [elementId];
  
  const newPending = new Map(pendingChanges);
  
  const allPermissions = new Set([
    ...Array.from(mappings.keys()),
    ...Array.from(pendingChanges.keys()),
  ]);
  
  allPermissions.forEach(permission => {
    const currentMapping = newPending.get(permission) || mappings.get(permission);
    if (!currentMapping) return;
    
    const currentAllowed = currentMapping.allowedElements || [];
    const isCurrentlyAllowed = linkedGroup.some(id => currentAllowed.includes(id));
    
    let newAllowed = [...currentAllowed];
    
    linkedGroup.forEach(targetId => {
      if (isCurrentlyAllowed) {
        // حذف
        newAllowed = newAllowed.filter(id => id !== targetId);
      } else {
        // اضافه
        if (!newAllowed.includes(targetId)) {
          newAllowed.push(targetId);
        }
      }
    });
    
    newPending.set(permission, {
      ...currentMapping,
      allowedElements: newAllowed,
      updatedAt: new Date().toISOString(),
    });
  });
  
  setPendingChanges(newPending);
  showToast('success', 'Synced All', `Synced ${linkedGroup.length} elements across all permissions`);
}, [selectedPermission, pendingChanges, mappings]);

  const handleShowSavePreview = useCallback(() => {
    const items: SavePreviewItem[] = [];
    
    pendingChanges.forEach((newMapping, permission) => {
      const oldMapping = mappings.get(permission);
      const oldAllowed = oldMapping?.allowedElements || [];
      const newAllowed = newMapping.allowedElements;
      
      const added = newAllowed.filter(id => !oldAllowed.includes(id));
      const removed = oldAllowed.filter(id => !newAllowed.includes(id));
      
      items.push({
        permission,
        oldAllowed,
        newAllowed,
        added,
        removed,
        isNew: !oldMapping,
      });
    });
    
    setSavePreviewItems(items);
    setShowSavePreview(true);
  }, [pendingChanges, mappings]);

  const handleConfirmSave = useCallback(async () => {
  if (saving || pendingChanges.size === 0) return;
  setSaving(true);
  
  try {
    const db = await getDB();
    
    // 🔧 FIX: استفاده از setPermissionMapping به جای savePermissionMapping
    const promises = Array.from(pendingChanges.values()).map(mapping => {
      return db.setPermissionMapping(
        mapping.permission,
        mapping.allowedElements,
        mapping.deniedElements || []
      );
    });
    
    await Promise.all(promises);

    setMappings(prev => {
      const next = new Map(prev);
      pendingChanges.forEach((val, key) => next.set(key, val));
      return next;
    });

    // پاکسازی
    setPendingChanges(new Map());
    setShowSavePreview(false);
    setSavePreviewItems([]);
    showToast('success', 'Saved', 'Changes saved successfully');
    console.log('🟢 Save completed');
  } catch (err: any) {
    console.error('🔴 Save failed:', err);
    showToast('error', 'Save Failed', err.message || 'Unknown error');
  } finally {
    setSaving(false);
  }
}, [pendingChanges, saving]);

  const handleCreateMapping = useCallback(() => {
    if (!newEntity || !newAction) {
      showToast('error', 'Error', 'Entity and Action are required');
      return;
    }

    const permission = `${newEntity}:${newAction}` as Permission;
    
    if (mappings.has(permission) || pendingChanges.has(permission)) {
      setDuplicatePermission(permission);
      setShowDuplicateWarning(true);
      return;
    }

    const relatedElements = uiElements.filter(el => el.id.startsWith(`${newEntity}_`));
    setPreviewPermission(permission);
    setPreviewElements(relatedElements);
    setShowPreview(true);
  }, [newEntity, newAction, uiElements, mappings, pendingChanges]);

  const handleResolveDependency = useCallback((depId: string) => {
  if (!pendingElementToggle || !selectedPermission) return;

  const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
  const currentAllowed = currentMapping?.allowedElements || [];
  
  // چک کردن dependencies خود این dependency
  const chain = getAllDependenciesChain(depId);
  const missingDeps = chain.filter(d => !currentAllowed.includes(d));
  
  if (missingDeps.length > 0) {
    showToast('warning', 'Nested Dependencies', 
      `"${depId}" needs: ${missingDeps.join(', ')}`);
    return;
  }

  // اضافه کردن dependency
  const newAllowed = [...currentAllowed, depId];
  const newMapping: DBPermissionMapping = {
    permission: selectedPermission,
    allowedElements: newAllowed,
    deniedElements: currentMapping?.deniedElements || [],
    updatedAt: new Date().toISOString(),
  };

  setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  showToast('success', 'Added', `"${depId}" added to allowed`);
}, [pendingElementToggle, selectedPermission, pendingChanges, mappings]);

  const handleActivatePendingElement = useCallback(() => {
  if (!pendingElementToggle || !selectedPermission) return;

  const { elementId } = pendingElementToggle;
  const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
  const currentAllowed = currentMapping?.allowedElements || [];

  // چک نهایی dependencies
  const chain = getAllDependenciesChain(elementId);
  const missingDeps = chain.filter(dep => !currentAllowed.includes(dep));
  
  if (missingDeps.length > 0) {
    showToast('error', 'Still Missing', `Still need: ${missingDeps.join(', ')}`);
    return;
  }

  // فعال کردن element
  const newAllowed = [...currentAllowed, elementId];
  
  // 🔧 NEW: اضافه کردن slaves هم
  const linkedGroup = getLinkedGroup(elementId);
  if (linkedGroup) {
    const slaves = getLinkedSlaves(elementId);
    slaves.forEach(slave => {
      if (!newAllowed.includes(slave)) newAllowed.push(slave);
    });
  }

  const newMapping: DBPermissionMapping = {
    permission: selectedPermission,
    allowedElements: newAllowed,
    deniedElements: currentMapping?.deniedElements || [],
    updatedAt: new Date().toISOString(),
  };

  setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  setShowDependencyModal(false);
  setPendingElementToggle(null);
  showToast('success', 'Activated', `"${elementId}" activated`);
}, [pendingElementToggle, selectedPermission, pendingChanges, mappings]);

  const handleConfirmCreate = useCallback(() => {
    if (!previewPermission) return;

    const newMapping: DBPermissionMapping = {
      permission: previewPermission,
      allowedElements: [],
      deniedElements: [],
      updatedAt: new Date().toISOString(),
    };

    setPendingChanges(prev => new Map(prev).set(previewPermission, newMapping));
    setSelectedPermission(previewPermission);
    setFilterEntity(newEntity);
    setSearchQuery('');
    setFilterModule('');
    setFilterType('');
    setCollapsedComponents(new Set());
    
    showToast('success', 'Created', `Permission "${previewPermission}" created`);
    
    setNewEntity('');
    setNewAction('');
    setShowCreateModal(false);
    setShowPreview(false);
    setPreviewPermission('');
    setPreviewElements([]);
  }, [previewPermission, newEntity]);

  const handleGoToDuplicate = useCallback(() => {
    setShowDuplicateWarning(false);
    setShowCreateModal(false);
    setDuplicatePermission('');
    setSelectedPermission(duplicatePermission);
    const entity = duplicatePermission.split(':')[0];
    setFilterEntity(entities.includes(entity) ? entity : '');
    setSearchQuery('');
    setFilterModule('');
    setFilterType('');
    setCollapsedComponents(new Set());
    showToast('info', 'Navigated', `Opened "${duplicatePermission}" for editing`);
  }, [duplicatePermission, entities]);

  const handleDeleteMapping = useCallback(async (permission: string) => {
	  const assignments = await checkPermissionAssignments(permission);
	  
	  if (!assignments.canDelete) {
		setShowDeleteErrorModal({
		  permission,
		  assignedToRoles: assignments.assignedToRoles,
		  assignedToUsers: assignments.assignedToUsers,
		});
		return;
	  }
	  const confirmed = await confirmDialog({
		  title: 'Delete Permission',
		  message: `Are you sure you want to delete "${permission}"?\n\nThis action cannot be undone.`,
		  variant: 'danger',
		  confirmText: 'Delete',
		  cancelText: 'Cancel',
	  });
	  
	  if (!confirmed) return;

	  try {
		const db = await getDB();
		await db.deletePermissionMapping(permission);
		
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
		
		if (selectedPermission === permission) {
		  setSelectedPermission('');
		}
		
		showToast('success', 'Deleted', `Permission "${permission}" deleted`);
	  } catch (error) {
		console.error('[PermissionManager] Failed to delete:', error);
		showToast('error', 'Error', 'Failed to delete permission');
	  }
  }, [selectedPermission, checkPermissionAssignments]);

  const handleSelectPermission = useCallback((permission: string) => {
    setSelectedPermission(permission);
    const entity = permission.split(':')[0];
    setFilterEntity(entities.includes(entity) ? entity : '');
    setSearchQuery('');
    setFilterModule('');
    setFilterType('');
    setCollapsedComponents(new Set());
  }, [entities]);

  const handleEntityFilterChange = useCallback((entity: string) => {
    setFilterEntity(entity);
    if (selectedPermission) {
      const selectedEntity = selectedPermission.split(':')[0];
      if (entity && entity !== selectedEntity) setSelectedPermission('');
    }
  }, [selectedPermission]);

  const handleToggleComponent = useCallback((component: string) => {
    setCollapsedComponents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(component)) newSet.delete(component);
      else newSet.add(component);
      return newSet;
    });
  }, []);

  const handleSelectAllInComponent = useCallback((component: string, elements: DBUIElement[]) => {
    if (!selectedPermission) return;
    const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
    const currentAllowed = currentMapping?.allowedElements || [];
    const elementIds = elements.map(el => el.id);
    const newAllowed = [...new Set([...currentAllowed, ...elementIds])];
    const newMapping: DBPermissionMapping = {
      permission: selectedPermission,
      allowedElements: newAllowed,
      deniedElements: currentMapping?.deniedElements || [],
      updatedAt: new Date().toISOString(),
    };
    setPendingChanges(prev => new Map(prev).set(selectedPermission, newMapping));
  }, [selectedPermission, pendingChanges, mappings]);

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
  }, [selectedPermission, pendingChanges, mappings]);

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setShowPreview(false);
    setShowDuplicateWarning(false);
    setNewEntity('');
    setNewAction('');
    setPreviewPermission('');
    setPreviewElements([]);
    setDuplicatePermission('');
  }, []);
  
  const handleEditPermission = useCallback((permission: string) => {
  const currentMapping = pendingChanges.get(permission) || mappings.get(permission);
  
  setEditingPermission(permission);
  setEditingAllowed(currentMapping?.allowedElements || []);
  setEditingDenied(currentMapping?.deniedElements || []);
  setShowEditModal(true);
}, [pendingChanges, mappings]);

  const handleToggleElementInModal = useCallback((elementId: string) => {
  if (!editingPermission) return;

  const isAllowed = editingAllowed.includes(elementId);
  let newAllowed = [...editingAllowed];

  // چک کردن Linked Elements
  const linkedGroup = getLinkedGroup(elementId);
  const isMaster = isMasterElement(elementId);
  
  if (linkedGroup && !isMaster) {
    const master = getLinkedGroupMaster(elementId);
    showToast('warning', 'Linked Element', 
      `This is linked to "${master}". Click on the master element to toggle.`);
    return;
  }

  if (isAllowed) {
    newAllowed = newAllowed.filter(id => id !== elementId);
    
    if (linkedGroup) {
      const slaves = getLinkedSlaves(elementId);
      slaves.forEach(slave => {
        newAllowed = newAllowed.filter(id => id !== slave);
      });
    }
    
    const children = getAllChildrenChain(elementId, uiElements.map(el => el.id));
    children.forEach(child => {
      newAllowed = newAllowed.filter(id => id !== child);
    });
  } else {
    // چک کردن dependencies
    const chain = getAllDependenciesChain(elementId);
    const missingDeps = chain.filter(dep => !newAllowed.includes(dep));
    
    if (missingDeps.length > 0) {
      setPendingElementToggle({ elementId, missingDeps });
      setShowDependencyModal(true);
      return;
    }

    newAllowed.push(elementId);
    
    if (linkedGroup) {
      const slaves = getLinkedSlaves(elementId);
      slaves.forEach(slave => {
        if (!newAllowed.includes(slave)) {
          newAllowed.push(slave);
        }
      });
    }
  }

  setEditingAllowed(newAllowed);
}, [editingPermission, editingAllowed, uiElements]);

  const handleResolveDependencyInModal = useCallback((depId: string) => {
  const chain = getAllDependenciesChain(depId);
  const missingDeps = chain.filter(d => !editingAllowed.includes(d));
  
  if (missingDeps.length > 0) {
    showToast('warning', 'Nested Dependencies', 
      `"${depId}" needs: ${missingDeps.join(', ')}`);
    return;
  }

  if (!editingAllowed.includes(depId)) {
    setEditingAllowed([...editingAllowed, depId]);
    showToast('success', 'Added', `"${depId}" added`);
  }
}, [editingAllowed]);

  const handleSaveEdit = useCallback(() => {
  if (!editingPermission) return;

  const newMapping: DBPermissionMapping = {
    permission: editingPermission,
    allowedElements: editingAllowed,
    deniedElements: editingDenied,
    updatedAt: new Date().toISOString(),
  };

  setPendingChanges(prev => new Map(prev).set(editingPermission, newMapping));
  
  // اگه permission جدید هست، به لیست اضافه کن
  if (!mappings.has(editingPermission)) {
    setMappings(prev => new Map(prev).set(editingPermission, newMapping));
  }

  setShowEditModal(false);
  setEditingPermission(null);
  setEditingAllowed([]);
  setEditingDenied([]);
  
  const addedCount = editingAllowed.filter(id => {
    const oldMapping = mappings.get(editingPermission);
    return !oldMapping?.allowedElements.includes(id);
  }).length;
  
  showToast('success', 'Changes Saved', 
    `${editingPermission} updated (${addedCount} new elements)`);
}, [editingPermission, editingAllowed, editingDenied, mappings]);

  const handleCancelEdit = useCallback(() => {
  setShowEditModal(false);
  setEditingPermission(null);
  setEditingAllowed([]);
  setEditingDenied([]);
}, []);
  
  const CATEGORIES = useMemo(() => {
  const cats: Record<string, { icon: string; label: string; children: string[] }> = {};
  
  filteredElements.forEach(el => {
    const component = el.component || 'Unknown';
    if (!cats[component]) {
      cats[component] = { icon: '📦', label: component, children: [] };
    }
    cats[component].children.push(el.id);
  });
  
  // آیکون‌های بهتر برای هر دسته
  const iconMap: Record<string, string> = {
    'ClientList': '👥',
    'ClientDetails': '',
    'ClientForm': '',
    'ContractList': '',
    'ContractDetails': '📑',
    'ContractForm': '✍️',
    'InspectionList': '🔍',
    'InspectionDetails': '🔎',
    'InvoiceList': '',
    'InvoiceDetails': '💰',
    'Dashboard': '📊',
  };
  
  Object.keys(cats).forEach(key => {
    cats[key].icon = iconMap[key] || '📦';
  });
  
  return cats;
}, [filteredElements]);

  const getElementsForCategory = useCallback((category: string): DBUIElement[] => {
  if (category === 'ALL') return filteredElements;
  return filteredElements.filter(el => el.component === category);
}, [filteredElements]);

  const handleToggleCategory = useCallback((category: string) => {
  setExpandedCategories(prev => {
    const next = new Set(prev);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    return next;
  });
}, []);

  const handleRemoveFromSelected = useCallback((elementId: string) => {
  setEditingAllowed(prev => prev.filter(id => id !== elementId));
}, []);

  const handleSelectAllInCategory = useCallback((category: string) => {
  const elements = getElementsForCategory(category);
  const elementIds = elements.map(el => el.id);
  setEditingAllowed(prev => [...new Set([...prev, ...elementIds])]);
}, [getElementsForCategory]);

  const handleClearAllInCategory = useCallback((category: string) => {
  const elements = getElementsForCategory(category);
  const elementIds = new Set(elements.map(el => el.id));
  setEditingAllowed(prev => prev.filter(id => !elementIds.has(id)));
}, [getElementsForCategory]);

  const getCategoryProgress = useCallback((category: string) => {
  const elements = getElementsForCategory(category);
  const allowed = elements.filter(el => editingAllowed.includes(el.id)).length;
  return { allowed, total: elements.length };
}, [getElementsForCategory, editingAllowed]);

  // ═══════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-xl border p-4 mb-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap"> 
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search..."
                className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200 placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`} />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
                ➕ New Permission
              </Button>
              {hasChanges && (
                <Button variant="primary" size="md" onClick={handleShowSavePreview}>
                  💾 Save Changes ({pendingChanges.size})
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className={`rounded-xl border p-4 sticky top-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
              <h2 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                📋 Permissions
              </h2>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
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
						className={`group px-3 py-2 rounded-lg transition-all ${
						  isSelected
							? isDark ? 'bg-indigo-900/30 border border-indigo-500' : 'bg-indigo-50 border border-indigo-200'
							: isDark ? 'hover:bg-slate-800 border border-transparent' : 'hover:bg-slate-100 border border-transparent'
						}`}
					  >
						<div 
						  onClick={() => setSelectedPermission(permission)}
						  className="cursor-pointer"
						>
						  <div className="flex items-center justify-between">
							<div className="flex-1 min-w-0">
							  <code className={`text-xs font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
								{permission}
							  </code>
							  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
								{mapping.allowedElements.length} elements
							  </div>
							</div>
						  </div>
						</div>
						
						<div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
						  <div className="flex gap-1">
							{isPending && <Badge tone="amber" className="text-[9px]">Modified</Badge>}
							{isSaved && !isPending && <Badge tone="emerald" className="text-[9px]">Saved</Badge>}
						  </div>
						  
						  <div className="flex items-center gap-1">
							{/* 🔧 Edit Button */}
							<button
							  onClick={(e) => {
								e.stopPropagation();
								handleEditPermission(permission);
							  }}
							  className={`p-1.5 rounded-md transition-all ${
								isDark 
								  ? 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/30' 
								  : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
							  }`}
							  title="Edit permission elements"
							>
							  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
							  </svg>
							</button>
							
							{/* 🔧 Delete Button */}
							<button
							  onClick={(e) => {
								e.stopPropagation();
								handleDeleteMapping(permission);
							  }}
							  className={`p-1.5 rounded-md transition-all ${
								isDark 
								  ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-900/30' 
								  : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
							  }`}
							  title="Delete permission"
							>
							  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							  </svg>
							</button>
						  </div>
						</div>
					  </div>
					);
				  })}
				</div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedPermission ? (
			  <div className={`rounded-xl border p-6 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
				{/* Header */}
				<div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
				  <div>
					<h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
					  <code className="text-indigo-600 dark:text-indigo-400">{selectedPermission}</code>
					</h2>
					<p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
					  Permission Overview & Element Access
					</p>
				  </div>
				  <Button
					variant="primary"
					size="md"
					onClick={() => handleEditPermission(selectedPermission)}
					className="gap-2"
				  >
					<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Edit Elements
				  </Button>
				</div>

				{/* Elements by Component - Read Only */}
				<div>
				  <div className="space-y-3">
					{elementsByComponent.map(([component, elements]) => {
					  const allowedCount = elements.filter(el => 
						selectedMapping?.allowedElements.includes(el.id)
					  ).length;
					  const totalCount = elements.length;
					  const allSelected = allowedCount === totalCount;
					  
					  return (
						<div key={component} className={`rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
						  <div className={`px-4 py-3 flex items-center justify-between`}>
							<div className="flex items-center gap-2">
							  <h4 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
								{component}
							  </h4>
							</div>
						  </div>
						  <div className="px-4 pb-3 grid grid-cols-2 md:grid-cols-3 gap-1.5">
							{elements.map(element => {
							  const isAllowed = selectedMapping?.allowedElements.includes(element.id);
							  const isLinked = getLinkedGroup(element.id) !== null;
							  const isMaster = isMasterElement(element.id);
							  
							  return (
								<div
								  key={element.id}
								  className={`px-2 py-1.5 rounded text-xs flex items-center gap-2 ${
									isAllowed
									  ? isDark ? 'bg-emerald-900/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
									  : isDark ? 'bg-slate-800/30 text-slate-400' : 'bg-white text-slate-500'
								  }`}
								>
								  <span>{isAllowed ? '✓' : '✗'}</span>
								  <span className="truncate flex-1">{element.name}</span>
								  {isLinked && isMaster && (
									<span className={`text-[9px] ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
									  🔗
									</span>
								  )}
								</div>
							  );
							})}
						  </div>
						</div>
					  );
					})}
				  </div>
				</div>
			  </div>
			) : (
			  <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
				<div className="text-6xl mb-8">👈</div>
				<h3 className={`text-lg font-bold mb-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
				  Select a Permission
				</h3>
			  </div>
			)}
          </div>
        </div>
      </div>

      {/* Create Modal */}
        <Modal isOpen={showCreateModal} onClose={handleCloseCreateModal} title="Create New Permission" size="lg">
			<div className="space-y-4">
			  {!showPreview ? (
				<>
				  <div>
					<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
					  🔷 Entity <span className="text-rose-500">*</span>
					</label>
					<select value={newEntity} onChange={(e) => setNewEntity(e.target.value)}
					  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-900'}`}>
					  <option value="">Select an entity...</option>
					  {entities.map(entity => (
						<option key={entity} value={entity}>
						  {entity} ({uiElements.filter(el => el.entity === entity).length} elements)
						</option>
					  ))}
					</select>
				  </div>
				  <div>
					<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
					  ⚡ Action <span className="text-rose-500">*</span>
					</label>
					<input type="text" value={newAction}
					  onChange={(e) => setNewAction(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
					  placeholder="e.g., read, create, update"
					  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-900'}`} />
				  </div>
				  {newEntity && newAction && (
					<div className={`p-3 rounded-lg border ${isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'}`}>
					  <code className={`text-sm font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
						{newEntity}:{newAction}
					  </code>
					</div>
				  )}
				  <div className="flex gap-2 justify-end pt-2">
					<Button variant="secondary" size="md" onClick={() => { setShowCreateModal(false); setNewEntity(''); setNewAction(''); }}>
					  Cancel
					</Button>
					<Button variant="primary" size="md" onClick={handleCreateMapping} disabled={!newEntity || !newAction}>
					  Next: Preview →
					</Button>
				  </div>
				</>
			  ) : (
				<>
				  <div className={`p-4 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
					<h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
					  📋 Permission Details
					</h3>
					<div className="space-y-2">
					  <div className="flex items-center justify-between">
						<span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Permission Name:</span>
						<code className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
						  {previewPermission}
						</code>
					  </div>
					  <div className="flex items-center justify-between">
						<span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Related Elements:</span>
						<Badge tone="indigo" className="text-[10px]">{previewElements.length} elements</Badge>
					  </div>
					</div>
				  </div>
				  {previewElements.length > 0 ? (
					<div className={`rounded-lg border max-h-60 overflow-y-auto ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'}`}>
					  <div className={`px-3 py-2 border-b text-xs font-medium ${isDark ? 'border-slate-700 bg-slate-800 text-slate-200' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
						🔗 Related UI Elements (will start empty)
					  </div>
					  <div className="divide-y divide-slate-200 dark:divide-slate-700">
						{previewElements.slice(0, 10).map(element => (
						  <div key={element.id} className={`px-3 py-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
							<code className={isDark ? 'text-indigo-300' : 'text-indigo-700'}>{element.id}</code>
							<span className={`ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{element.name}</span>
						  </div>
						))}
						{previewElements.length > 10 && (
						  <div className={`px-3 py-2 text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
							... and {previewElements.length - 10} more
						  </div>
						)}
					  </div>
					</div>
				  ) : (
					<div className={`p-4 rounded-lg border text-center ${isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
					  <div className="text-2xl mb-1">️</div>
					  <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
						No UI elements found for entity "<strong>{newEntity}</strong>"
					  </p>
					</div>
				  )}
				  <div className="flex gap-2 justify-end pt-2">
					<Button variant="secondary" size="md" onClick={() => setShowPreview(false)}>← Back</Button>
					<Button variant="primary" size="md" onClick={handleConfirmCreate}>✓ Create Permission</Button>
				  </div>
				</>
			  )}
			</div>
        </Modal>

      {/* Duplicate Warning Modal */}
        <Modal isOpen={showDuplicateWarning} onClose={() => { setShowDuplicateWarning(false); setDuplicatePermission(''); }}
			title="⚠️ Permission Already Exists" size="md">
			<div className="space-y-4">
			  <div className={`p-4 rounded-lg border ${isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50'}`}>
				<div className="flex items-start gap-3">
				  <span className="text-2xl">️</span>
				  <div className="flex-1">
					<h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
					  This permission already exists
					</h4>
					<p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
					  You can edit the existing one instead.
					</p>
				  </div>
				</div>
			  </div>
			  <div className={`p-3 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
				<div className="flex items-center justify-between">
				  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Existing Permission:</span>
				  <code className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
					{duplicatePermission}
				  </code>
				</div>
				{(() => {
				  const existingMapping = mappings.get(duplicatePermission) || pendingChanges.get(duplicatePermission);
				  if (existingMapping) {
					return (
					  <div className="flex items-center justify-between mt-2">
						<span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Current Elements:</span>
						<Badge tone="indigo" className="text-[10px]">{existingMapping.allowedElements.length} allowed</Badge>
					  </div>
					);
				  }
				  return null;
				})()}
			  </div>
			  <div className="flex gap-2 justify-end pt-2">
				<Button variant="secondary" size="md" onClick={() => { setShowDuplicateWarning(false); setDuplicatePermission(''); }}>
				  Cancel
				</Button>
				<Button variant="primary" size="md" onClick={handleGoToDuplicate}>
				  🔗 Go to Permission
				</Button>
			  </div>
			</div>
        </Modal>

      {/* 🔧 Save Preview Modal */}
		<Modal isOpen={showSavePreview} onClose={() => { setShowSavePreview(false); setSavePreviewItems([]); }}
			title="💾 Save Changes Preview" size="lg">
			<div className="space-y-4">
			  <div className={`p-3 rounded-lg border ${isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'}`}>
				<div className="flex items-center gap-2">
				  <span className="text-lg">📋</span>
				  <div>
					<h4 className={`text-sm font-bold ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
					  Review your changes before saving
					</h4>
					<p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
					  {savePreviewItems.length} permission{savePreviewItems.length > 1 ? 's' : ''} will be saved
					</p>
				  </div>
				</div>
			  </div>

			  <div className="space-y-3 max-h-96 overflow-y-auto">
				{savePreviewItems.map((item) => (
				  <div key={item.permission} className={`rounded-lg border p-3 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
					<div className="flex items-center justify-between mb-2">
					  <code className={`text-xs font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
						{item.permission}
					  </code>
					  <Badge tone={item.isNew ? 'emerald' : 'amber'} className="text-[9px]">
						{item.isNew ? '✨ New' : '✏️ Modified'}
					  </Badge>
					</div>

					{item.added.length > 0 && (
					  <div className="mb-2">
						<div className={`text-[10px] font-medium mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
						   Added ({item.added.length}):
						</div>
						<div className="flex flex-wrap gap-1">
						  {item.added.map(id => (
							<span key={id} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
							  {id.replace(/^(client|contract)_/, '')}
							</span>
						  ))}
						</div>
					  </div>
					)}

					{item.removed.length > 0 && (
					  <div>
						<div className={`text-[10px] font-medium mb-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
						  ➖ Removed ({item.removed.length}):
						</div>
						<div className="flex flex-wrap gap-1">
						  {item.removed.map(id => (
							<span key={id} className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-rose-900/30 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>
							  {id.replace(/^(client|contract)_/, '')}
							</span>
						  ))}
						</div>
					  </div>
					)}

					{item.added.length === 0 && item.removed.length === 0 && (
					  <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
						No changes to elements
					  </div>
					)}
				  </div>
				))}
			  </div>

			  <div className="flex gap-2 justify-end pt-2">
				<Button variant="secondary" size="md" onClick={() => { setShowSavePreview(false); setSavePreviewItems([]); }}>
				  Cancel
				</Button>
				<Button
				  variant="primary"
				  size="md"
				  onClick={handleConfirmSave}
				  disabled={saving}
				  className={saving ? 'opacity-70 cursor-wait' : ''}
				>
				  {saving ? '⏳ Saving...' : '✓ Confirm & Save'}
				</Button>
			  </div>
			</div>
		</Modal>
		
		{/* 🔧 Delete Error Modal */}
		<Modal
		  isOpen={showDeleteErrorModal !== null}
		  onClose={() => setShowDeleteErrorModal(null)}
		  title="⚠️ Cannot Delete Permission"
		  size="lg"
		>
		  {showDeleteErrorModal && (
			<div className="space-y-4">
			  {/* Header */}
			  <div className={`p-4 rounded-lg border ${
				isDark ? 'border-rose-700 bg-rose-900/20' : 'border-rose-200 bg-rose-50'
			  }`}>
				<div className="flex items-start gap-3">
				  <span className="text-3xl">🚫</span>
				  <div className="flex-1">
					<h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-rose-200' : 'text-rose-800'}`}>
					  Permission is currently in use
					</h4>
					<p className={`text-xs ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>
					  You cannot delete "<strong>{showDeleteErrorModal.permission}</strong>" because it's assigned to roles or users.
					  Please remove it from all assignments first.
					</p>
				  </div>
				</div>
			  </div>

			  {/* Assigned to Roles */}
			  {showDeleteErrorModal.assignedToRoles.length > 0 && (
				<div className={`rounded-lg border ${
				  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
				}`}>
				  <div className={`px-3 py-2 border-b ${
					isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100'
				  }`}>
					<h5 className={`text-xs font-bold uppercase tracking-wider ${
					  isDark ? 'text-slate-200' : 'text-slate-700'
					}`}>
					  🎭 Assigned to Roles ({showDeleteErrorModal.assignedToRoles.length})
					</h5>
				  </div>
				  <div className="p-3 space-y-2">
					{showDeleteErrorModal.assignedToRoles.map((roleName, idx) => (
					  <div
						key={idx}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
						  isDark ? 'bg-slate-800/50' : 'bg-white'
						}`}
					  >
						<span className="text-lg">🎭</span>
						<span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
						  {roleName}
						</span>
					  </div>
					))}
				  </div>
				</div>
			  )}

			  {/* Assigned to Users */}
			  {showDeleteErrorModal.assignedToUsers.length > 0 && (
				<div className={`rounded-lg border ${
				  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
				}`}>
				  <div className={`px-3 py-2 border-b ${
					isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100'
				  }`}>
					<h5 className={`text-xs font-bold uppercase tracking-wider ${
					  isDark ? 'text-slate-200' : 'text-slate-700'
					}`}>
					  👤 Assigned to Users ({showDeleteErrorModal.assignedToUsers.length})
					</h5>
				  </div>
				  <div className="p-3 space-y-2">
					{showDeleteErrorModal.assignedToUsers.map((userName, idx) => (
					  <div
						key={idx}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
						  isDark ? 'bg-slate-800/50' : 'bg-white'
						}`}
					  >
						<span className="text-lg"></span>
						<span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
						  {userName}
						</span>
					  </div>
					))}
				  </div>
				</div>
			  )}

			  {/* Instructions */}
			  <div className={`p-3 rounded-lg border ${
				isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'
			  }`}>
				<div className="flex items-start gap-2">
				  <span className="text-lg">💡</span>
				  <div className="flex-1">
					<h5 className={`text-xs font-bold mb-1 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
					  How to delete this permission:
					</h5>
					<ol className={`text-xs space-y-1 list-decimal list-inside ${
					  isDark ? 'text-indigo-300' : 'text-indigo-700'
					}`}>
					  <li>Go to <strong>Roles</strong> tab and remove this permission from all roles</li>
					  <li>Go to <strong>Users</strong> tab and remove this permission from all users</li>
					  <li>Come back here and try deleting again</li>
					</ol>
				  </div>
				</div>
			  </div>

			  {/* Action Button */}
			  <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
				<Button
				  variant="secondary"
				  size="md"
				  onClick={() => setShowDeleteErrorModal(null)}
				>
				  Got it
				</Button>
			  </div>
			</div>
		  )}
		</Modal>
		
		{/* Edit Permission Modal */}
		<Modal
		  isOpen={showEditModal}
		  onClose={handleCancelEdit}
		  title={editingPermission ? `Edit: ${editingPermission}` : 'New Permission'}
		  size="xl"
		>
		  {editingPermission && (
			<div className="space-y-4">
			  {/*  Header Info */}
			  <div className={`p-3 rounded-lg border ${
				isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'
			  }`}>
				<div className="flex items-center justify-between">
				  <div>
					<div className={`text-[10px] uppercase font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
					  Editing Permission
					</div>
					<code className={`text-sm font-mono ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
					  {editingPermission}
					</code>
				  </div>
				  <div className="flex gap-2 justify-end pt-2">
					<Button variant="secondary" size="md" onClick={handleCancelEdit}>
					  Cancel
					</Button>
					<Button variant="primary" size="md" onClick={handleSaveEdit}>
					  💾 Save Changes
					</Button>
				  </div>
				</div>
			  </div>

			  {/* 🔧 Selected Chips Bar */}
			  {editingAllowed.length > 0 && (
				<div className={`p-3 rounded-lg border ${
				  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
				}`}>
				  <div className="flex items-center justify-between mb-2">
					<div className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
					  📌 Selected Elements ({editingAllowed.length})
					</div>
					<button
					  onClick={() => setEditingAllowed([])}
					  className={`text-[10px] ${isDark ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-700'}`}
					>
					  Clear All
					</button>
				  </div>
				  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
					{editingAllowed.map(elementId => {
					  const element = uiElements.find(el => el.id === elementId);
					  const isLinked = getLinkedGroup(elementId) !== null;
					  const isMaster = isMasterElement(elementId);
					  
					  return (
						<div
						  key={elementId}
						  className={`group flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-mono transition-all ${
							isDark 
							  ? 'bg-emerald-900/30 text-emerald-200 border border-emerald-700/50 hover:bg-emerald-900/50' 
							  : 'bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200'
						  }`}
						>
						  {isLinked && isMaster && <span>👑</span>}
						  <span className="truncate max-w-[120px]">{elementId}</span>
						  {element?.name && (
							<span className={`hidden group-hover:inline ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
							  — {element.name}
							</span>
						  )}
						  <button
							onClick={() => handleRemoveFromSelected(elementId)}
							className={`ml-1 ${isDark ? 'text-emerald-400 hover:text-rose-400' : 'text-emerald-600 hover:text-rose-600'}`}
						  >
							×
						  </button>
						</div>
					  );
					})}
				  </div>
				</div>
			  )}

			  {/* 🔧 Main Layout: Sidebar + Content */}
			  <div className="grid grid-cols-12 gap-4 max-h-[600px]">
				{/* 🔧 Sidebar */}
				<div className={`col-span-3 rounded-lg border overflow-hidden ${
				  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
				}`}>
				  {/* Categories */}
				  <div className="overflow-y-auto max-h-[500px] p-2 space-y-1">
					{/* All */}
					<button
					  onClick={() => setSelectedCategory('ALL')}
					  className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-between ${
						selectedCategory === 'ALL'
						  ? isDark ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-600' : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
						  : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
					  }`}
					>
					  <span className="flex items-center gap-2">
						<span>📋</span>
						<span>All Elements</span>
					  </span>  
					</button>

					{/* Category Tree */}
					{Object.entries(CATEGORIES).map(([key, cat]) => {
					  const isExpanded = expandedCategories.has(key);
					  const progress = getCategoryProgress(key);
					  const isSelected = selectedCategory === key;
					  const hasChildren = cat.children.length > 0;

					  return (
						<div key={key}>
						  <button
							onClick={() => {
							  setSelectedCategory(key);
							  if (hasChildren) handleToggleCategory(key);
							}}
							className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-between ${
							  isSelected
								? isDark ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-600' : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
								: isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-100'
							}`}
						  >
							<span className="flex items-center gap-2">
							  <span>{cat.icon}</span>
							  <span className="truncate">{key}</span>
							</span>
						  </button>
						</div>
					  );
					})}
				  </div>
				</div>

				{/* 🔧 Content Area */}
				<div className="col-span-9">
				  {/* Category Header */}
				  <div className={`flex items-center justify-between mb-3 p-3 rounded-lg border ${
					isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
				  }`}>
					<div className="flex items-center gap-2">
					  <span className="text-lg">{CATEGORIES[selectedCategory]?.icon || ''}</span>
					  <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
						{selectedCategory === 'ALL' ? 'All Elements' : selectedCategory}
					  </h3>
					</div>
					<div className="flex gap-2">
					  <button
						onClick={() => handleSelectAllInCategory(selectedCategory)}
						className={`text-xs font-medium px-2 py-1 rounded ${
						  isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-50'
						}`}
					  >
						Select All
					  </button>
					  <button
						onClick={() => handleClearAllInCategory(selectedCategory)}
						className={`text-xs font-medium px-2 py-1 rounded ${
						  isDark ? 'text-rose-400 hover:bg-rose-900/30' : 'text-rose-600 hover:bg-rose-50'
						}`}
					  >
						Clear
					  </button>
					</div>
				  </div>

				  {/* Elements Grid */}
				  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[450px] overflow-y-auto pr-2">
					{getElementsForCategory(selectedCategory)
					  .filter(el => {
						if (!editSearchQuery) return true;
						const q = editSearchQuery.toLowerCase();
						return el.id.toLowerCase().includes(q) || el.name.toLowerCase().includes(q);
					  })
					  .map(element => {
						const isAllowed = editingAllowed.includes(element.id);
						const chain = getAllDependenciesChain(element.id);
						const { satisfied, missing } = checkDependenciesChain(element.id, editingAllowed);
						const hasUnmetDeps = !satisfied;
						const linkedGroup = getLinkedGroup(element.id);
						const isLinked = linkedGroup !== null;
						const isMaster = isMasterElement(element.id);
						const slaves = getLinkedSlaves(element.id);
						const depth = getElementDepth(element.id);
						
						return (
						  <div
							key={element.id}
							onClick={() => handleToggleElementInModal(element.id)}
							className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
							  isAllowed
								? isDark ? 'bg-emerald-900/20 border-emerald-700 hover:bg-emerald-900/30' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
								: isDark ? 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50' : 'bg-white border-slate-200 hover:bg-slate-50'
							} ${hasUnmetDeps ? 'opacity-60' : ''} ${isLinked && isMaster ? 'ring-2 ring-violet-500/30' : ''}`}
						  >
							<div className="flex items-start justify-between gap-2">
							  <div className="flex-1 min-w-0">
								{/* Header */}
								<div className="flex items-center gap-2 flex-wrap">
								  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
									isAllowed ? 'bg-emerald-600 border-emerald-600' : isDark ? 'border-slate-600' : 'border-slate-300'
								  }`}>
									{isAllowed && <span className="text-white text-[10px]">✓</span>}
								  </div>
								  <code className={`text-xs font-mono ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
									{element.id}
								  </code>
								  {isLinked && isMaster && (
									<Badge tone="violet" className="text-[8px]">👑 Master</Badge>
								  )}
								  {depth > 0 && (
									<Badge tone={depth > 2 ? 'amber' : 'indigo'} className="text-[8px]">
									  Depth {depth}
									</Badge>
								  )}
								</div>
								<div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
								  {element.name}
								</div>
								
								{/* Linked Slaves */}
								{isLinked && isMaster && slaves.length > 0 && (
								  <div className={`mt-2 p-1.5 rounded ${
									isDark ? 'bg-violet-900/20' : 'bg-violet-50'
								  }`}>
									<div className={`text-[9px] font-semibold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
									  🔗 Syncs with:
									</div>
									<div className="flex flex-wrap gap-1 mt-0.5">
									  {slaves.map(s => (
										<span key={s} className={`text-[8px] px-1 rounded ${
										  isDark ? 'bg-violet-900/40 text-violet-200' : 'bg-violet-100 text-violet-700'
										}`}>
										  {s.replace(/^(client|contract)_/, '')}
										</span>
									  ))}
									</div>
								  </div>
								)}
								
								{/* Dependencies Chain */}
								{chain.length > 0 && (
								  <div className={`mt-2 p-1.5 rounded ${
									hasUnmetDeps
									  ? isDark ? 'bg-amber-900/20' : 'bg-amber-50'
									  : isDark ? 'bg-slate-800/50' : 'bg-slate-50'
								  }`}>
									<div className="flex flex-wrap items-center gap-1">
									  {chain.map((dep, idx) => {
										const isSatisfied = editingAllowed.includes(dep);
										return (
										  <span key={dep} className="flex items-center gap-1">
											<span className={`text-[8px] px-1 rounded ${
											  isSatisfied
												? isDark ? 'bg-emerald-900/40 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
												: isDark ? 'bg-rose-900/40 text-rose-200' : 'bg-rose-100 text-rose-700'
											}`}>
											  {dep.replace(/^(client|contract)_/, '')}
											</span>
											{idx < chain.length - 1 && (
											  <span className={`text-[8px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>→</span>
											)}
										  </span>
										);
									  })}
									</div>
									{hasUnmetDeps && (
									  <div className={`text-[8px] mt-1 ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
										⚠️ Missing: {missing.map(d => d.replace(/^(client|contract)_/, '')).join(', ')}
									  </div>
									)}
								  </div>
								)}
							  </div>
							  
							  <Badge tone={isAllowed ? 'emerald' : hasUnmetDeps ? 'amber' : 'slate'} className="text-[10px] shrink-0">
								{isAllowed ? '✓' : hasUnmetDeps ? '⚠️' : 'O'}
							  </Badge>
							</div>
						  </div>
						);
					  })}
				  </div>
				</div>
			  </div>
			  
			</div>
		  )}
		</Modal>
		
	  
	    {/* Dependency Resolution Modal */}
		<Modal
		  isOpen={showDependencyModal}
		  onClose={() => {
			setShowDependencyModal(false);
			setPendingElementToggle(null);
		  }}
		  title="🔗 Dependencies Required"
		  size="lg"
		>
		  {pendingElementToggle && (() => {
			const { elementId, missingDeps } = pendingElementToggle;
			const currentMapping = pendingChanges.get(selectedPermission) || mappings.get(selectedPermission);
			const currentAllowed = currentMapping?.allowedElements || [];
			
			// گروه‌بندی dependencies بر اساس ماژول
			const depsByModule: Record<string, string[]> = {};
			missingDeps.forEach(dep => {
			  const module = dep.split('_')[0];
			  if (!depsByModule[module]) depsByModule[module] = [];
			  depsByModule[module].push(dep);
			});
			
			// محاسبه عمق هر dependency
			const depWithDepth = missingDeps.map(dep => ({
			  id: dep,
			  depth: getElementDepth(dep),
			  isSatisfied: currentAllowed.includes(dep),
			}));
			
			return (
			  <div className="space-y-4">
				{/* Header */}
				<div className={`p-4 rounded-lg border ${
				  isDark ? 'border-amber-700 bg-amber-900/20' : 'border-amber-200 bg-amber-50'
				}`}>
				  <div className="flex items-start gap-3">
					<span className="text-3xl">⚠️</span>
					<div className="flex-1">
					  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
						Cannot activate "{elementId}"
					  </h4>
					  <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
						This element requires <strong>{missingDeps.length}</strong> dependencies to be activated first.
						Please activate them manually from the list below.
					  </p>
					</div>
				  </div>
				</div>

				{/* Target Element Info */}
				<div className={`p-3 rounded-lg border ${
				  isDark ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50'
				}`}>
				  <div className="flex items-center justify-between">
					<div>
					  <div className={`text-[10px] uppercase font-semibold ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
						Target Element
					  </div>
					  <code className={`text-sm font-mono ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
						{elementId}
					  </code>
					</div>
					<Badge tone="indigo" className="text-[10px]">
					  Depth: {getElementDepth(elementId)}
					</Badge>
				  </div>
				</div>

				{/* Dependencies Grouped by Module */}
				<div className="space-y-3 max-h-96 overflow-y-auto">
				  {Object.entries(depsByModule).map(([module, deps]) => (
					<div key={module} className={`rounded-lg border ${
					  isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50/50'
					}`}>
					  <div className={`px-3 py-2 border-b ${
						isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100'
					  }`}>
						<h5 className={`text-xs font-bold uppercase tracking-wider ${
						  isDark ? 'text-slate-200' : 'text-slate-700'
						}`}>
						  📦 {module} Module ({deps.length})
						</h5>
					  </div>
					  <div className="p-2 space-y-1">
						{deps.map(depId => {
						  const depth = getElementDepth(depId);
						  const isSatisfied = currentAllowed.includes(depId);
						  
						  return (
							<div
							  key={depId}
							  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
								isSatisfied
								  ? isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-200'
								  : isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-white border-slate-200'
							  }`}
							>
							  <div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
								  <code className={`text-xs font-mono ${
									isDark ? 'text-indigo-300' : 'text-indigo-700'
								  }`}>
									{depId}
								  </code>
								  <Badge 
									tone={isSatisfied ? 'emerald' : depth > 1 ? 'amber' : 'slate'} 
									className="text-[8px]"
								  >
									Depth {depth}
								  </Badge>
								</div>
								{depth > 1 && (
								  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
									🔗 Chain: {getAllDependenciesChain(depId).slice(0, 3).map(d => d.replace(/^(client|contract)_/, '')).join(' → ')}
									{getAllDependenciesChain(depId).length > 3 && ' ...'}
								  </div>
								)}
							  </div>
							  
							  {isSatisfied ? (
								<Badge tone="emerald" className="text-[9px]">✓ Active</Badge>
							  ) : (
								<button
								  onClick={() => handleResolveDependency(depId)}
								  className={`text-[10px] px-2 py-1 rounded font-medium ${
									isDark 
									  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
									  : 'bg-indigo-500 text-white hover:bg-indigo-600'
								  }`}
								>
								  + Activate
								</button>
							  )}
							</div>
						  );
						})}
					  </div>
					</div>
				  ))}
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
				  <Button
					variant="secondary"
					size="md"
					onClick={() => {
					  setShowDependencyModal(false);
					  setPendingElementToggle(null);
					}}
				  >
					Cancel
				  </Button>
				  <Button
					variant="primary"
					size="md"
					onClick={handleActivatePendingElement}
					disabled={missingDeps.some(dep => 
					  !pendingChanges.get(selectedPermission)?.allowedElements.includes(dep) &&
					  !mappings.get(selectedPermission)?.allowedElements.includes(dep)
					)}
				  >
					✓ Activate Target Element
				  </Button>
				</div>
			  </div>
			);
		  })()}
		</Modal>

    </div>
  );
}