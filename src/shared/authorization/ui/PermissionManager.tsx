// src/shared/authorization/ui/PermissionManager.tsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { getAllElements } from "@shared/authorization/ui";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import {
  getAllDependenciesChain,
  checkDependenciesChain,
} from "@shared/authorization/ui";
import {
  getLinkedGroup,
  getLinkedSlaves,
} from "@shared/authorization/ui/ui-elements/linkedElements";

import { permissionMappingAppService } from "@shared/authorization";
import { userAppService } from "@shared/authorization";

import {
  PermissionToolbar,
  PermissionsSidebar,
  PermissionOverview,
  CreatePermissionModal,
  EditPermissionModal,
  SavePreviewModal,
  DeleteErrorModal,
  DependencyModal,
} from "./user-management/permissions";

import type {
  SavePreviewItem,
  DeleteErrorInfo,
  PendingElementToggle,
} from "./user-management/permissions";

const COMPONENT_ORDER: Record<string, number> = {
  ClientList: 1,
  ClientDetails: 2,
  ClientForm: 3,
  ClientEditModal: 4,
  ContractList: 5,
  ContractDetails: 6,
  ContractForm: 7,
  InspectionList: 8,
  InspectionDetails: 9,
  InvoiceList: 10,
  InvoiceDetails: 11,
  Dashboard: 12,
};

export function PermissionManager() {
  const { isDark } = useTheme();

  const [uiElements, setUiElements] = useState<DBUIElement[]>([]);
  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(
    new Map(),
  );
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, DBPermissionMapping>
  >(new Map());

  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [filterEntity, setFilterEntity] = useState<string>("");
  const [filterModule, setFilterModule] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<string | null>(
    null,
  );
  const [showSavePreview, setShowSavePreview] = useState(false);
  const [savePreviewItems, setSavePreviewItems] = useState<SavePreviewItem[]>(
    [],
  );
  const [showDeleteErrorModal, setShowDeleteErrorModal] =
    useState<DeleteErrorInfo | null>(null);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [pendingElementToggle, setPendingElementToggle] =
    useState<PendingElementToggle | null>(null);
  const [saving, setSaving] = useState(false);

  const entities = useMemo(
    () => [...new Set(uiElements.map((el) => el.entity))].sort(),
    [uiElements],
  );

  const filteredElements = useMemo(() => {
    return uiElements.filter((el) => {
      if (filterEntity && el.entity !== filterEntity) return false;
      if (filterModule && el.module !== filterModule) return false;
      if (filterType && el.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) ||
          el.name.toLowerCase().includes(q) ||
          (el.description || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [uiElements, filterEntity, filterModule, filterType, searchQuery]);

  const elementsByComponent = useMemo(() => {
    const grouped: Record<string, DBUIElement[]> = {};
    filteredElements.forEach((el) => {
      const component = el.component || "Unknown";
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
    return (
      pendingChanges.get(selectedPermission) ||
      mappings.get(selectedPermission) ||
      null
    );
  }, [selectedPermission, pendingChanges, mappings]);

  const existingPermissions = useMemo(() => {
    const set = new Set<string>();
    mappings.forEach((_, key) => set.add(key));
    pendingChanges.forEach((_, key) => set.add(key));
    return set;
  }, [mappings, pendingChanges]);

  const permissionsList = useMemo(() => {
    const combined = new Map([
      ...Array.from(mappings.entries()),
      ...Array.from(pendingChanges.entries()),
    ]);
    return Array.from(combined.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([permission, mapping]) => ({
        permission,
        mapping,
        isPending: pendingChanges.has(permission),
        isSaved: mappings.has(permission),
      }));
  }, [mappings, pendingChanges]);

  // ═══════════════════════════════════════
  // 🔄 Data Loading (✅ اصلاح شده برای معماری جدید)
  // ═══════════════════════════════════════
  useEffect(() => {
    const loadData = async () => {
      try {
        const rawElements = getAllElements();

        const mappedElements: DBUIElement[] = rawElements.map((el: any) => ({
          id: el.id,
          name: el.label || el.id,
          description: el.label || "",
          entity: el._module || "Unknown",
          module: el._module || "Unknown",
          component: el._page || "Unknown",
          type: el.type,
          category: el.category,
        }));

        setUiElements(mappedElements);

        const allMappings = await permissionMappingAppService.getAll();
        const map = new Map<string, DBPermissionMapping>(
          allMappings.map((m) => [m.permission, m]),
        );
        setMappings(map);

        console.log("[PermissionManager] ✅ Loaded:", {
          elements: mappedElements.length,
          mappings: allMappings.length,
        });
      } catch (error) {
        console.error("[PermissionManager] Failed to load:", error);
        showToast("error", "Error", "Failed to load permission data");
      }
    };
    loadData();
  }, []);

  // ═══════════════════════════════════════
  // 🎯 Handlers (بدون تغییر نسبت به کد اصلی شما)
  // ═══════════════════════════════════════
  const checkPermissionAssignments = useCallback(
    async (
      permission: string,
    ): Promise<{ assignedToUsers: string[]; canDelete: boolean }> => {
      try {
        const allUsers = await userAppService.getAllUsers();
        const assignedToUsers = allUsers
          .filter((user) =>
            (user as any).customPermissions?.includes(permission),
          )
          .map((user) => user.fullName || user.username);
        return { assignedToUsers, canDelete: assignedToUsers.length === 0 };
      } catch (error) {
        console.error(
          "[PermissionManager] Failed to check assignments:",
          error,
        );
        return { assignedToUsers: [], canDelete: false };
      }
    },
    [],
  );

  const handleSelectPermission = useCallback(
    (permission: string) => {
      setSelectedPermission(permission);
      const entity = permission.split(":")[0];
      setFilterEntity(entities.includes(entity) ? entity : "");
      setSearchQuery("");
      setFilterModule("");
      setFilterType("");
    },
    [entities],
  );

  const handleEditPermission = useCallback((permission: string) => {
    setEditingPermission(permission);
    setShowEditModal(true);
  }, []);

  const handleDeleteMapping = useCallback(
    async (permission: string) => {
      const assignments = await checkPermissionAssignments(permission);
      if (!assignments.canDelete) {
        setShowDeleteErrorModal({
          permission,
          assignedToUsers: assignments.assignedToUsers,
        });
        return;
      }
      const confirmed = await confirmDialog({
        title: "Delete Permission",
        message: `Are you sure you want to delete "${permission}"?\n\nThis action cannot be undone.`,
        variant: "danger",
        confirmText: "Delete",
        cancelText: "Cancel",
      });
      if (!confirmed) return;

      try {
        await permissionMappingAppService.deleteMapping(permission);
        setMappings((prev) => {
          const newMap = new Map(prev);
          newMap.delete(permission);
          return newMap;
        });
        setPendingChanges((prev) => {
          const newMap = new Map(prev);
          newMap.delete(permission);
          return newMap;
        });
        if (selectedPermission === permission) setSelectedPermission("");
        showToast("success", "Deleted", `Permission "${permission}" deleted`);
      } catch (error) {
        console.error("[PermissionManager] Failed to delete:", error);
        showToast("error", "Error", "Failed to delete permission");
      }
    },
    [selectedPermission, checkPermissionAssignments],
  );

  const handleCreatePermission = useCallback(
    (permission: string) => {
      const newMapping: DBPermissionMapping = {
        permission,
        allowedElements: [],
        deniedElements: [],
        updatedAt: new Date().toISOString(),
      };
      setPendingChanges((prev) => new Map(prev).set(permission, newMapping));
      setSelectedPermission(permission);
      const entity = permission.split(":")[0];
      setFilterEntity(entities.includes(entity) ? entity : "");
      setSearchQuery("");
      setFilterModule("");
      setFilterType("");
      showToast("success", "Created", `Permission "${permission}" created`);
    },
    [entities],
  );

  const handleGoToDuplicate = useCallback(
    (permission: string) => {
      setSelectedPermission(permission);
      const entity = permission.split(":")[0];
      setFilterEntity(entities.includes(entity) ? entity : "");
      setSearchQuery("");
      setFilterModule("");
      setFilterType("");
      showToast("info", "Navigated", `Opened "${permission}" for editing`);
    },
    [entities],
  );

  const handleShowSavePreview = useCallback(() => {
    const items: SavePreviewItem[] = [];
    pendingChanges.forEach((newMapping, permission) => {
      const oldMapping = mappings.get(permission);
      const oldAllowed = oldMapping?.allowedElements || [];
      const newAllowed = newMapping.allowedElements;
      const added = newAllowed.filter((id) => !oldAllowed.includes(id));
      const removed = oldAllowed.filter((id) => !newAllowed.includes(id));
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
      const promises = Array.from(pendingChanges.values()).map((mapping) =>
        permissionMappingAppService.setMapping(
          mapping.permission,
          mapping.allowedElements,
          mapping.deniedElements || [],
        ),
      );
      await Promise.all(promises);
      setMappings((prev) => {
        const next = new Map(prev);
        pendingChanges.forEach((val, key) => next.set(key, val));
        return next;
      });
      setPendingChanges(new Map());
      setShowSavePreview(false);
      setSavePreviewItems([]);
      showToast("success", "Saved", "Changes saved to Supabase");
    } catch (err: any) {
      console.error("🔴 Save failed:", err);
      showToast("error", "Save Failed", err.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }, [pendingChanges, saving]);

  const handleSaveEdit = useCallback(
    (permission: string, allowed: string[], denied: string[]) => {
      const newMapping: DBPermissionMapping = {
        permission,
        allowedElements: allowed,
        deniedElements: denied,
        updatedAt: new Date().toISOString(),
      };
      setPendingChanges((prev) => new Map(prev).set(permission, newMapping));
      if (!mappings.has(permission))
        setMappings((prev) => new Map(prev).set(permission, newMapping));
      setShowEditModal(false);
      setEditingPermission(null);
      const addedCount = allowed.filter((id) => {
        const oldMapping = mappings.get(permission);
        return !oldMapping?.allowedElements.includes(id);
      }).length;
      showToast(
        "success",
        "Changes Saved",
        `${permission} updated (${addedCount} new elements)`,
      );
    },
    [mappings],
  );

  const handleResolveDependency = useCallback(
    (depId: string) => {
      if (!pendingElementToggle || !selectedPermission) return;
      const currentMapping =
        pendingChanges.get(selectedPermission) ||
        mappings.get(selectedPermission);
      const currentAllowed = currentMapping?.allowedElements || [];
      const chain = getAllDependenciesChain(depId);
      const missingDeps = chain.filter(
        (d: string) => !currentAllowed.includes(d),
      );
      if (missingDeps.length > 0) {
        showToast(
          "warning",
          "Nested Dependencies",
          `"${depId}" needs: ${missingDeps.join(", ")}`,
        );
        return;
      }
      const newAllowed = [...currentAllowed, depId];
      const newMapping: DBPermissionMapping = {
        permission: selectedPermission,
        allowedElements: newAllowed,
        deniedElements: currentMapping?.deniedElements || [],
        updatedAt: new Date().toISOString(),
      };
      setPendingChanges((prev) =>
        new Map(prev).set(selectedPermission, newMapping),
      );
      showToast("success", "Added", `"${depId}" added to allowed`);
    },
    [pendingElementToggle, selectedPermission, pendingChanges, mappings],
  );

  const handleActivatePendingElement = useCallback(() => {
    if (!pendingElementToggle || !selectedPermission) return;
    const { elementId } = pendingElementToggle;
    const currentMapping =
      pendingChanges.get(selectedPermission) ||
      mappings.get(selectedPermission);
    const currentAllowed = currentMapping?.allowedElements || [];
    const chain = getAllDependenciesChain(elementId);
    const missingDeps = chain.filter(
      (dep: string) => !currentAllowed.includes(dep),
    );
    if (missingDeps.length > 0) {
      showToast(
        "error",
        "Still Missing",
        `Still need: ${missingDeps.join(", ")}`,
      );
      return;
    }
    const newAllowed = [...currentAllowed, elementId];
    const linkedGroup = getLinkedGroup(elementId);
    if (linkedGroup) {
      const slaves = getLinkedSlaves(elementId);
      slaves.forEach((slave) => {
        if (!newAllowed.includes(slave)) newAllowed.push(slave);
      });
    }
    const newMapping: DBPermissionMapping = {
      permission: selectedPermission,
      allowedElements: newAllowed,
      deniedElements: currentMapping?.deniedElements || [],
      updatedAt: new Date().toISOString(),
    };
    setPendingChanges((prev) =>
      new Map(prev).set(selectedPermission, newMapping),
    );
    setShowDependencyModal(false);
    setPendingElementToggle(null);
    showToast("success", "Activated", `"${elementId}" activated`);
  }, [pendingElementToggle, selectedPermission, pendingChanges, mappings]);

  // ═══════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════
  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-7xl mx-auto">
        <PermissionToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateClick={() => setShowCreateModal(true)}
          onSaveClick={handleShowSavePreview}
          hasChanges={hasChanges}
          pendingCount={pendingChanges.size}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <PermissionsSidebar
            permissions={permissionsList}
            selectedPermission={selectedPermission}
            onSelect={handleSelectPermission}
            onEdit={handleEditPermission}
            onDelete={handleDeleteMapping}
          />

          {selectedPermission ? (
            <PermissionOverview
              permission={selectedPermission}
              mapping={selectedMapping}
              elementsByComponent={elementsByComponent}
              onEdit={() => handleEditPermission(selectedPermission)}
            />
          ) : (
            <div className="lg:col-span-3">
              <div
                className={`rounded-xl border p-12 text-center ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}
              >
                <div className="text-6xl mb-8">👈</div>
                <h3
                  className={`text-lg font-bold mb-8 ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  Select a Permission
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePermissionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePermission}
        onGoToDuplicate={handleGoToDuplicate}
        entities={entities}
        uiElements={uiElements}
        existingPermissions={existingPermissions}
      />
      {editingPermission && (
        <EditPermissionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPermission(null);
          }}
          permission={editingPermission}
          uiElements={uiElements}
          currentMapping={
            pendingChanges.get(editingPermission) ||
            mappings.get(editingPermission) ||
            null
          }
          onSave={handleSaveEdit}
        />
      )}
      <SavePreviewModal
        isOpen={showSavePreview}
        onClose={() => {
          setShowSavePreview(false);
          setSavePreviewItems([]);
        }}
        onSave={handleConfirmSave}
        items={savePreviewItems}
        saving={saving}
      />
      <DeleteErrorModal
        info={showDeleteErrorModal}
        onClose={() => setShowDeleteErrorModal(null)}
      />
      <DependencyModal
        isOpen={showDependencyModal}
        pendingToggle={pendingElementToggle}
        selectedPermission={selectedPermission}
        currentAllowed={
          pendingChanges.get(selectedPermission)?.allowedElements ||
          mappings.get(selectedPermission)?.allowedElements ||
          []
        }
        onClose={() => {
          setShowDependencyModal(false);
          setPendingElementToggle(null);
        }}
        onResolve={handleResolveDependency}
        onActivate={handleActivatePendingElement}
      />
    </div>
  );
}
