// src/shared/authorization/ui/user-management/users/modals/UserElementAccessModal.tsx

import { useState, useMemo, useCallback, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type {
  DBUser,
  DBUIElement,
  DBPermissionMapping,
} from "@shared/database/types";
import { showToast } from "@shared/ui/ToastContainer";
import {
  getAllDependenciesChain,
  getAllChildrenChain,
  checkDependenciesChain,
} from "../../../../ui/ui-elements/dependencies";
import {
  getLinkedGroup,
  isMasterElement,
  getLinkedGroupMaster,
  getLinkedSlaves,
  getElementDepth,
} from "../../../../ui/ui-elements/linkedElements";
import { getBasePermissions } from "../../../../config/RoleBasePermissions";
import { useUIElements } from "../../../../ui/ui-elements/useUIElements";
import { permissionMappingService } from "../../../../services/PermissionMappingService";

interface UserElementAccessModalProps {
  user: DBUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customPermissions: string[]) => void;
}

function elementIdToPermission(elementId: string): string {
  const parts = elementId.split("_");
  if (parts.length < 2) return elementId;
  const entity = parts[0];
  const action = parts.slice(1).join("_");
  return `${entity}:${action}`;
}

function isElementBase(elementId: string, basePermissions: string[]): boolean {
  if (basePermissions.includes(elementId)) return true;

  const permission = elementIdToPermission(elementId);
  if (basePermissions.includes(permission)) return true;

  const parts = elementId.split("_");
  if (parts.length >= 2) {
    const entity = parts[0];
    const action = parts.slice(1).join("_");

    if (basePermissions.includes(`${entity}_${action}`)) return true;
    if (basePermissions.includes(`${entity}:${action}`)) return true;
  }

  return false;
}

//  استخراج المان‌های یک batch permission
function getElementsFromBatch(
  mapping: DBPermissionMapping,
  basePermissions: string[],
): { included: string[]; overlapping: string[] } {
  const included: string[] = [];
  const overlapping: string[] = [];

  mapping.allowedElements.forEach((elementId) => {
    if (basePermissions.includes(elementId)) {
      overlapping.push(elementId);
    } else {
      included.push(elementId);
    }
  });

  return { included, overlapping };
}

type AccessTab = "elements" | "permissions";

export function UserElementAccessModal({
  user,
  isOpen,
  onClose,
  onSave,
}: UserElementAccessModalProps) {
  const { isDark } = useTheme();
  const uiElements = useUIElements();

  // State
  const [activeTab, setActiveTab] = useState<AccessTab>("elements");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editSearchQuery, setEditSearchQuery] = useState("");
  const [customPermissions, setCustomPermissions] = useState<string[]>(
    user.customPermissions || [],
  );
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [pendingElementToggle, setPendingElementToggle] = useState<{
    elementId: string;
    missingDeps: string[];
  } | null>(null);

  const [allMappings, setAllMappings] = useState<DBPermissionMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);

  useEffect(() => {
    const loadMappings = async () => {
      try {
        setLoadingMappings(true);
        const mappings = await permissionMappingService.getAll();
        setAllMappings(mappings);
      } catch (error) {
        console.error(
          "[UserElementAccessModal] Failed to load mappings:",
          error,
        );
      } finally {
        setLoadingMappings(false);
      }
    };
    loadMappings();
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // 🧮 Computed Values
  // ═══════════════════════════════════════════════════════════════════

  const basePermissions = useMemo(
    () => getBasePermissions(user.role),
    [user.role],
  );

  const allAllowedElements = useMemo((): Set<string> => {
    const allowed = new Set<string>();

    //  اضافه کردن المان‌های Base
    basePermissions.forEach((permission: string) => {
      // تبدیل permission به element ID
      const variants = [
        permission,
        permission.replace(":", "_"),
        permission.includes("_") && !permission.includes(":")
          ? `${permission.split("_")[0]}:${permission.split("_").slice(1).join("_")}`
          : permission,
      ];

      variants.forEach((variant) => {
        // چک اگر این variant یک element ID است
        if (uiElements.some((el: DBUIElement) => el.id === variant)) {
          allowed.add(variant);
        }

        // 🔧 NEW: چک wildcard - اگر permission به صورت entity:action باشد
        const parts = variant.includes(":")
          ? variant.split(":")
          : variant.split("_");
        if (parts.length >= 2) {
          const entity = parts[0];
          const action = parts.slice(1).join("_");

          uiElements.forEach((el: DBUIElement) => {
            if (el.entity === entity) {
              if (
                el.id === `${entity}_${action}` ||
                el.id === `${entity}:${action}` ||
                el.id.endsWith(`_${action}`) ||
                el.id.endsWith(`:${action}`)
              ) {
                allowed.add(el.id);
              }
            }
          });
        }
      });
    });

    // اضافه کردن المان‌های Custom
    customPermissions.forEach((perm: string) => {
      // اگر یک batch permission است
      const mapping = allMappings.find((m) => m.permission === perm);
      if (mapping) {
        mapping.allowedElements.forEach((el) => allowed.add(el));
      }

      // اگر یک element ID مستقیم است
      if (uiElements.some((el: DBUIElement) => el.id === perm)) {
        allowed.add(perm);
      }
    });

    return allowed;
  }, [basePermissions, customPermissions, allMappings, uiElements]);

  const entities = useMemo(() => {
    const entitySet = new Set<string>();
    uiElements.forEach((el: DBUIElement) => {
      if (!isElementBase(el.id, basePermissions)) {
        entitySet.add(el.entity);
      }
    });
    allMappings.forEach((m) => {
      const entity = m.permission.split(":")[0];
      if (!basePermissions.includes(m.permission)) {
        entitySet.add(entity);
      }
    });
    return Array.from(entitySet).sort();
  }, [uiElements, allMappings, basePermissions]);

  // 🔧 NEW: المان‌های پوشش داده شده توسط Batch Permissions انتخاب شده
  const elementsCoveredByBatches = useMemo(() => {
    const covered = new Set<string>();

    customPermissions.forEach((perm) => {
      const mapping = allMappings.find((m) => m.permission === perm);
      if (mapping) {
        const { included } = getElementsFromBatch(mapping, basePermissions);
        included.forEach((el) => covered.add(el));
      }
    });

    return covered;
  }, [customPermissions, allMappings, basePermissions]);

  // 🔧 NEW: Batch Permissions با تداخل Base
  const batchesWithOverlap = useMemo(() => {
    const overlaps: Map<string, string[]> = new Map();

    customPermissions.forEach((perm) => {
      const mapping = allMappings.find((m) => m.permission === perm);
      if (mapping) {
        const { overlapping } = getElementsFromBatch(mapping, basePermissions);
        if (overlapping.length > 0) {
          overlaps.set(perm, overlapping);
        }
      }
    });

    return overlaps;
  }, [customPermissions, allMappings, basePermissions]);

  // 🔧 FIX: فیلتر کردن المان‌های پوشش داده شده توسط Batch
  const filteredElements = useMemo(() => {
    return uiElements.filter((el: DBUIElement) => {
      if (isElementBase(el.id, basePermissions)) return false;

      // 🔧 NEW: اگر در Batch انتخاب شده پوشش داده شده، حذف شود
      if (elementsCoveredByBatches.has(el.id)) return false;

      if (selectedEntity && el.entity !== selectedEntity) return false;
      if (editSearchQuery) {
        const q = editSearchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) || el.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    uiElements,
    selectedEntity,
    editSearchQuery,
    basePermissions,
    elementsCoveredByBatches,
  ]);

  const filteredPermissions = useMemo(() => {
    return allMappings.filter((m) => {
      if (basePermissions.includes(m.permission)) return false;
      const entity = m.permission.split(":")[0];
      if (selectedEntity && entity !== selectedEntity) return false;
      if (editSearchQuery) {
        const q = editSearchQuery.toLowerCase();
        return m.permission.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allMappings, selectedEntity, editSearchQuery, basePermissions]);

  const entitiesWithPermissions = useMemo(() => {
    const set = new Set<string>();
    allMappings.forEach((m) => {
      if (!basePermissions.includes(m.permission)) {
        set.add(m.permission.split(":")[0]);
      }
    });
    return set;
  }, [allMappings, basePermissions]);

  const entitiesWithElements = useMemo(() => {
    const set = new Set<string>();
    uiElements.forEach((el: DBUIElement) => {
      if (!isElementBase(el.id, basePermissions)) {
        set.add(el.entity);
      }
    });
    return set;
  }, [uiElements, basePermissions]);

  const CATEGORIES = useMemo(() => {
    const cats: Record<string, { icon: string; children: string[] }> = {};
    filteredElements.forEach((el: DBUIElement) => {
      const component = el.component || "Unknown";
      if (!cats[component]) {
        cats[component] = { icon: "📦", children: [] };
      }
      cats[component].children.push(el.id);
    });
    return cats;
  }, [filteredElements]);

  const getElementsForCategory = useCallback(
    (category: string): DBUIElement[] => {
      if (category === "ALL") return filteredElements;
      return filteredElements.filter(
        (el: DBUIElement) => el.component === category,
      );
    },
    [filteredElements],
  );

  const getCategoryProgress = useCallback(
    (category: string) => {
      const elements = getElementsForCategory(category);
      const allowed = elements.filter((el: DBUIElement) =>
        customPermissions.includes(el.id),
      ).length;
      return { allowed, total: elements.length };
    },
    [getElementsForCategory, customPermissions],
  );

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 Handlers
  // ═══════════════════════════════════════════════════════════════════

  const handleToggleElement = useCallback(
    (elementId: string) => {
      const isAllowed = customPermissions.includes(elementId);
      let newPermissions = [...customPermissions];

      const linkedGroup = getLinkedGroup(elementId);
      const isMaster = isMasterElement(elementId);

      if (linkedGroup && !isMaster) {
        const master = getLinkedGroupMaster(elementId);
        showToast(
          "warning",
          "Linked Element",
          `Linked to "${master}". Click master to toggle.`,
        );
        return;
      }

      if (isAllowed) {
        newPermissions = newPermissions.filter((id) => id !== elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((s: string) => {
            newPermissions = newPermissions.filter((id) => id !== s);
          });
        }
        getAllChildrenChain(
          elementId,
          uiElements.map((el: DBUIElement) => el.id),
        ).forEach((child: string) => {
          newPermissions = newPermissions.filter((id) => id !== child);
        });
      } else {
        newPermissions.push(elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((s: string) => {
            if (!newPermissions.includes(s)) newPermissions.push(s);
          });
        }
      }

      setCustomPermissions(newPermissions);
    },
    [customPermissions, uiElements],
  );

  // 🔧 NEW: Toggle Batch Permission با بررسی تداخل
  const handleTogglePermission = useCallback(
    (permission: string) => {
      const isSelected = customPermissions.includes(permission);

      if (!isSelected) {
        // در حال اضافه کردن - بررسی تداخل
        const mapping = allMappings.find((m) => m.permission === permission);
        if (mapping) {
          const { overlapping } = getElementsFromBatch(
            mapping,
            basePermissions,
          );
          if (overlapping.length > 0) {
            showToast(
              "warning",
              "Base Permission Overlap",
              `"${permission}" includes ${overlapping.length} element(s) already in base permissions`,
            );
          }
        }
      }

      setCustomPermissions((prev) =>
        prev.includes(permission)
          ? prev.filter((p) => p !== permission)
          : [...prev, permission],
      );
    },
    [customPermissions, allMappings, basePermissions],
  );

  const handleShowDependencyModal = useCallback(
    (elementId: string, missingDeps: string[]) => {
      setPendingElementToggle({ elementId, missingDeps });
      setShowDependencyModal(true);
    },
    [],
  );

  const handleResolveDependency = useCallback(
    (depId: string) => {
      if (!pendingElementToggle) return;
      const chain = getAllDependenciesChain(depId);
      const missingDeps = chain.filter(
        (dep: string) => !allAllowedElements.has(dep),
      );
      if (missingDeps.length > 0) {
        showToast(
          "warning",
          "Nested Dependencies",
          `"${depId}" needs: ${missingDeps.join(", ")}`,
        );
        return;
      }
      if (!customPermissions.includes(depId)) {
        setCustomPermissions([...customPermissions, depId]);
        showToast("success", "Added", `"${depId}" added`);
      }
    },
    [pendingElementToggle, customPermissions],
  );

  const handleActivatePendingElement = useCallback(() => {
    if (!pendingElementToggle) return;
    const { elementId } = pendingElementToggle;
    const chain = getAllDependenciesChain(elementId);
    const missingDeps = chain.filter(
      (dep: string) => !allAllowedElements.has(dep),
    );
    if (missingDeps.length > 0) {
      showToast(
        "error",
        "Still Missing",
        `Still need: ${missingDeps.join(", ")}`,
      );
      return;
    }
    const newPermissions = [...customPermissions, elementId];
    const linkedGroup = getLinkedGroup(elementId);
    if (linkedGroup) {
      getLinkedSlaves(elementId).forEach((s: string) => {
        if (!newPermissions.includes(s)) newPermissions.push(s);
      });
    }
    setCustomPermissions(newPermissions);
    setShowDependencyModal(false);
    setPendingElementToggle(null);
    showToast("success", "Activated", `"${elementId}" activated`);
  }, [pendingElementToggle, customPermissions]);

  const handleRemoveFromSelected = useCallback((id: string) => {
    setCustomPermissions((prev) => prev.filter((x) => x !== id));
  }, []);

  const handleSelectAllInCategory = useCallback(
    (category: string) => {
      const elementIds = getElementsForCategory(category).map(
        (el: DBUIElement) => el.id,
      );
      setCustomPermissions((prev) => [...new Set([...prev, ...elementIds])]);
    },
    [getElementsForCategory],
  );

  const handleClearAllInCategory = useCallback(
    (category: string) => {
      const ids = new Set(
        getElementsForCategory(category).map((el: DBUIElement) => el.id),
      );
      setCustomPermissions((prev) => prev.filter((id) => !ids.has(id)));
    },
    [getElementsForCategory],
  );

  const handleSelectAllPermissions = useCallback(() => {
    const ids = filteredPermissions.map((m) => m.permission);
    setCustomPermissions((prev) => [...new Set([...prev, ...ids])]);
  }, [filteredPermissions]);

  const handleClearAllPermissions = useCallback(() => {
    const ids = new Set(filteredPermissions.map((m) => m.permission));
    setCustomPermissions((prev) => prev.filter((id) => !ids.has(id)));
  }, [filteredPermissions]);

  const handleSave = () => onSave(customPermissions);
  const handleCancel = () => onClose();

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 Styles
  // ═══════════════════════════════════════════════════════════════════

  const sidebarStyle = `col-span-3 rounded-lg border overflow-hidden ${
    isDark
      ? "border-slate-700 bg-slate-800/30"
      : "border-slate-200 bg-slate-50/50"
  }`;

  const sidebarButtonBase = `w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center justify-between gap-1`;

  const sidebarButtonActive = isDark
    ? "bg-indigo-900/50 text-indigo-200 border border-indigo-600"
    : "bg-indigo-100 text-indigo-700 border border-indigo-300";

  const sidebarButtonInactive = isDark
    ? "text-slate-300 hover:bg-slate-700/50 border border-transparent"
    : "text-slate-700 hover:bg-slate-100 border border-transparent";

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={`🔐 Access Control: ${user.fullName}`}
        size="xl"
      >
        <div className="flex flex-col" style={{ height: "calc(80vh - 80px)" }}>
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <div
                  className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  @{user.username}
                </div>
                <div
                  className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
                >
                  Role: <span className="capitalize">{user.role}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Badge tone="amber" className="text-[10px]">
                🔒 {basePermissions.length}
              </Badge>
              <Badge tone="indigo" className="text-[10px]">
                🎁 {customPermissions.length}
              </Badge>
            </div>
          </div>

          {/* Tabs */}
          <div
            className={`flex-shrink-0 flex gap-1 p-1 rounded-lg mb-3 ${
              isDark ? "bg-slate-900" : "bg-slate-100"
            }`}
          >
            <button
              onClick={() => setActiveTab("elements")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "elements"
                  ? isDark
                    ? "bg-slate-800 text-slate-100 shadow-sm"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📦 Elements
              <Badge tone="slate" className="text-[9px] px-1.5">
                {filteredElements.length}
              </Badge>
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "permissions"
                  ? isDark
                    ? "bg-slate-800 text-slate-100 shadow-sm"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔐 Permissions
              <Badge tone="slate" className="text-[9px] px-1.5">
                {filteredPermissions.length}
              </Badge>
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-12 gap-3">
            {/* Sidebar */}
            <div className={sidebarStyle}>
              <div className="overflow-y-auto h-full p-2 space-y-3">
                {/* Entity Section */}
                <div>
                  <div
                    className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 px-1 ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    📦 Entity
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setSelectedEntity("")}
                      className={`${sidebarButtonBase} ${
                        !selectedEntity
                          ? sidebarButtonActive
                          : sidebarButtonInactive
                      }`}
                    >
                      <span className="truncate">All Entities</span>
                      <span
                        className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {entities.length}
                      </span>
                    </button>
                    {entities.map((entity) => {
                      const hasPerm = entitiesWithPermissions.has(entity);
                      const hasElem = entitiesWithElements.has(entity);
                      return (
                        <button
                          key={entity}
                          onClick={() => setSelectedEntity(entity)}
                          className={`${sidebarButtonBase} ${
                            selectedEntity === entity
                              ? sidebarButtonActive
                              : sidebarButtonInactive
                          }`}
                        >
                          <span className="truncate flex items-center gap-1">
                            {entity}
                            <span className="text-[8px] opacity-60">
                              {hasElem && "📦"}
                              {hasPerm && "🔐"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category Section */}
                {activeTab === "elements" &&
                  Object.keys(CATEGORIES).length > 0 && (
                    <div>
                      <div
                        className={`text-[9px] uppercase font-bold tracking-wider mb-1.5 px-1 ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`}
                      >
                        📋 Category
                      </div>
                      <div className="space-y-0.5">
                        <button
                          onClick={() => setSelectedCategory("ALL")}
                          className={`${sidebarButtonBase} ${
                            selectedCategory === "ALL"
                              ? sidebarButtonActive
                              : sidebarButtonInactive
                          }`}
                        >
                          <span className="truncate">All</span>
                          <span
                            className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                          >
                            {filteredElements.length}
                          </span>
                        </button>
                        {Object.entries(CATEGORIES).map(([key, cat]) => {
                          const progress = getCategoryProgress(key);
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedCategory(key)}
                              className={`${sidebarButtonBase} ${
                                selectedCategory === key
                                  ? sidebarButtonActive
                                  : sidebarButtonInactive
                              }`}
                            >
                              <span className="truncate">{key}</span>
                              <span
                                className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                {progress.allowed}/{progress.total}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Main Panel */}
            <div className="col-span-9 flex flex-col min-h-0">
              {/* Search & Actions Bar */}
              <div
                className={`flex-shrink-0 flex items-center gap-2 mb-2 p-2 rounded-lg border ${
                  isDark
                    ? "border-slate-700 bg-slate-800/30"
                    : "border-slate-200 bg-slate-50/50"
                }`}
              >
                <input
                  type="text"
                  value={editSearchQuery}
                  onChange={(e) => setEditSearchQuery(e.target.value)}
                  placeholder="🔍 Search..."
                  className={`flex-1 px-2 py-1 rounded border text-xs ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-200"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
                {activeTab === "elements" ? (
                  <>
                    <button
                      onClick={() =>
                        handleSelectAllInCategory(selectedCategory)
                      }
                      className={`text-[10px] font-medium px-2 py-1 rounded ${
                        isDark
                          ? "text-emerald-400 hover:bg-emerald-900/30"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleClearAllInCategory(selectedCategory)}
                      className={`text-[10px] font-medium px-2 py-1 rounded ${
                        isDark
                          ? "text-rose-400 hover:bg-rose-900/30"
                          : "text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      Clear
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSelectAllPermissions}
                      className={`text-[10px] font-medium px-2 py-1 rounded ${
                        isDark
                          ? "text-emerald-400 hover:bg-emerald-900/30"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAllPermissions}
                      className={`text-[10px] font-medium px-2 py-1 rounded ${
                        isDark
                          ? "text-rose-400 hover:bg-rose-900/30"
                          : "text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {/* Tab: Elements */}
                {activeTab === "elements" && (
                  <>
                    {filteredElements.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-2">🔒</div>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          No additional elements available
                        </p>
                        <p
                          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {elementsCoveredByBatches.size > 0
                            ? `${elementsCoveredByBatches.size} element(s) already covered by batch permissions`
                            : "All elements are already in base permissions"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {getElementsForCategory(selectedCategory).map(
                          (element: DBUIElement) => {
                            const isAllowed = customPermissions.includes(
                              element.id,
                            );
                            const chain = getAllDependenciesChain(element.id);
                            const { satisfied, missing } =
                              checkDependenciesChain(
                                element.id,
                                Array.from(allAllowedElements),
                              );
                            const hasUnmetDeps = !satisfied;
                            const linkedGroup = getLinkedGroup(element.id);
                            const isMaster = isMasterElement(element.id);
                            const slaves = getLinkedSlaves(element.id);

                            const handleClick = () => {
                              if (!isAllowed) {
                                const missingDeps = chain.filter(
                                  (dep: string) => !allAllowedElements.has(dep),
                                );
                                if (missingDeps.length > 0) {
                                  handleShowDependencyModal(
                                    element.id,
                                    missingDeps,
                                  );
                                  return;
                                }
                              }
                              handleToggleElement(element.id);
                            };

                            return (
                              <div
                                key={element.id}
                                onClick={handleClick}
                                className={`p-2 rounded-md border cursor-pointer transition-all ${
                                  isAllowed
                                    ? isDark
                                      ? "bg-emerald-900/20 border-emerald-700 hover:bg-emerald-900/30"
                                      : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                    : isDark
                                      ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50"
                                      : "bg-white border-slate-200 hover:bg-slate-50"
                                } ${hasUnmetDeps ? "opacity-60" : ""} ${
                                  linkedGroup && isMaster
                                    ? "ring-1 ring-violet-500/30"
                                    : ""
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div
                                    className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                      isAllowed
                                        ? "bg-emerald-600 border-emerald-600"
                                        : isDark
                                          ? "border-slate-600"
                                          : "border-slate-300"
                                    }`}
                                  >
                                    {isAllowed && (
                                      <span className="text-white text-[8px]">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <code
                                        className={`text-[10px] font-mono truncate ${
                                          isDark
                                            ? "text-indigo-300"
                                            : "text-indigo-700"
                                        }`}
                                      >
                                        {element.id}
                                      </code>
                                      {linkedGroup && isMaster && (
                                        <span
                                          className="text-[8px]"
                                          title="Master element"
                                        >
                                          👑
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className={`text-[10px] truncate ${
                                        isDark
                                          ? "text-slate-400"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {element.name}
                                    </div>
                                    {linkedGroup &&
                                      isMaster &&
                                      slaves.length > 0 && (
                                        <div
                                          className={`text-[8px] mt-0.5 ${
                                            isDark
                                              ? "text-violet-300"
                                              : "text-violet-600"
                                          }`}
                                        >
                                          🔗 {slaves.length} linked
                                        </div>
                                      )}
                                    {chain.length > 0 && hasUnmetDeps && (
                                      <div
                                        className={`text-[8px] mt-0.5 ${
                                          isDark
                                            ? "text-rose-300"
                                            : "text-rose-600"
                                        }`}
                                      >
                                        ⚠️ {missing.length} missing deps
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Tab: Permissions */}
                {activeTab === "permissions" && (
                  <>
                    {loadingMappings ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-2 animate-pulse">⏳</div>
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-600"
                          }
                        >
                          Loading...
                        </p>
                      </div>
                    ) : filteredPermissions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-2">🔒</div>
                        <p
                          className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                        >
                          No additional permissions available
                        </p>
                        <p
                          className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          Create permissions in the Permissions tab first
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredPermissions.map((mapping) => {
                          const isSelected = customPermissions.includes(
                            mapping.permission,
                          );
                          const [entity, action] =
                            mapping.permission.split(":");
                          const hasOverlap = batchesWithOverlap.has(
                            mapping.permission,
                          );
                          const overlapCount =
                            batchesWithOverlap.get(mapping.permission)
                              ?.length || 0;

                          return (
                            <div
                              key={mapping.permission}
                              onClick={() =>
                                handleTogglePermission(mapping.permission)
                              }
                              className={`p-2 rounded-md border cursor-pointer transition-all flex items-center gap-2 ${
                                isSelected
                                  ? isDark
                                    ? "bg-indigo-900/20 border-indigo-700 hover:bg-indigo-900/30"
                                    : "bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                                  : isDark
                                    ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                              } ${hasOverlap ? "ring-1 ring-amber-500/50" : ""}`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-600"
                                    : isDark
                                      ? "border-slate-600"
                                      : "border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <span className="text-white text-[8px]">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <code
                                className={`text-[11px] font-mono font-bold flex-1 min-w-0 truncate ${
                                  isDark ? "text-indigo-300" : "text-indigo-700"
                                }`}
                              >
                                {mapping.permission}
                              </code>
                              <div className="flex items-center gap-1 shrink-0">
                                <Badge tone="slate" className="text-[8px] px-1">
                                  {entity}
                                </Badge>
                                <Badge
                                  tone={isSelected ? "indigo" : "slate"}
                                  className="text-[8px] px-1"
                                >
                                  {action}
                                </Badge>
                                <span
                                  className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                                >
                                  {mapping.allowedElements.length} elem
                                </span>
                                {hasOverlap && (
                                  <span
                                    title={`${overlapCount} element(s) overlap with base`}
                                  >
                                    <Badge
                                      tone="amber"
                                      className="text-[8px] px-1"
                                    >
                                      ⚠️ {overlapCount}
                                    </Badge>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex-shrink-0 pt-3 mt-3 border-t ${
              isDark ? "border-slate-700" : "border-slate-200"
            }`}
          >
            {/* Selected Summary */}
            {customPermissions.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-semibold ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    📌 {customPermissions.length} selected
                    {elementsCoveredByBatches.size > 0 && (
                      <span
                        className={`ml-2 text-[9px] font-normal ${
                          isDark ? "text-amber-400" : "text-amber-600"
                        }`}
                      >
                        ({elementsCoveredByBatches.size} elements covered)
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setCustomPermissions([])}
                    className={`text-[9px] ${
                      isDark
                        ? "text-rose-400 hover:text-rose-300"
                        : "text-rose-600 hover:text-rose-700"
                    }`}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {customPermissions.map((id) => {
                    const isElement = uiElements.some(
                      (el: DBUIElement) => el.id === id,
                    );
                    return (
                      <div
                        key={id}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isElement
                            ? isDark
                              ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700/50"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isDark
                              ? "bg-indigo-900/30 text-indigo-200 border border-indigo-700/50"
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        <span>{isElement ? "📦" : "🔐"}</span>
                        <span className="truncate max-w-[100px]">{id}</span>
                        <button
                          onClick={() => handleRemoveFromSelected(id)}
                          className={`ml-0.5 ${
                            isDark
                              ? "hover:text-rose-400"
                              : "hover:text-rose-600"
                          }`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="md" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleSave}>
                💾 Save Permissions
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Dependency Modal */}
      {showDependencyModal && pendingElementToggle && (
        <Modal
          isOpen={showDependencyModal}
          onClose={() => {
            setShowDependencyModal(false);
            setPendingElementToggle(null);
          }}
          title="🔗 Dependencies Required"
          size="md"
        >
          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg border ${
                isDark
                  ? "border-amber-700 bg-amber-900/20"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p
                className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}
              >
                Cannot activate{" "}
                <strong>{pendingElementToggle.elementId}</strong>. Requires{" "}
                <strong>{pendingElementToggle.missingDeps.length}</strong>{" "}
                dependencies.
              </p>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {pendingElementToggle.missingDeps.map((depId: string) => {
                const isSatisfied = customPermissions.includes(depId);
                return (
                  <div
                    key={depId}
                    className={`p-2 rounded-md border flex items-center justify-between gap-2 ${
                      isSatisfied
                        ? isDark
                          ? "bg-emerald-900/20 border-emerald-700"
                          : "bg-emerald-50 border-emerald-200"
                        : isDark
                          ? "bg-slate-800/30 border-slate-700"
                          : "bg-white border-slate-200"
                    }`}
                  >
                    <code
                      className={`text-[11px] font-mono flex-1 truncate ${
                        isDark ? "text-indigo-300" : "text-indigo-700"
                      }`}
                    >
                      {depId}
                    </code>
                    {isSatisfied ? (
                      <Badge tone="emerald" className="text-[9px]">
                        ✓ Active
                      </Badge>
                    ) : (
                      <button
                        onClick={() => handleResolveDependency(depId)}
                        className="text-[10px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        + Activate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowDependencyModal(false);
                  setPendingElementToggle(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleActivatePendingElement}
                disabled={pendingElementToggle.missingDeps.some(
                  (dep: string) => !customPermissions.includes(dep),
                )}
              >
                ✓ Activate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
