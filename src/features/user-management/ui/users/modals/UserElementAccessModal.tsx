// src/shared/authorization/ui/user-management/users/modals/UserElementAccessModal.tsx

import { useState, useMemo, useCallback, useEffect } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUIElement, DBPermissionMapping } from "@shared/database/types";
import type { User } from "@/shared/authorization";
import { showToast } from "@shared/ui/ToastContainer";
import {
  getAllDependenciesChain,
  checkDependenciesChain,
  getAllChildrenChain,
  getAllElements,
} from "@shared/authorization/ui";
import {
  getLinkedGroup,
  isMasterElement,
  getLinkedGroupMaster,
  getLinkedSlaves,
} from "@shared/authorization/ui/linkedElements";
import { getBasePermissions } from "@shared/authorization/config/RoleBasePermissions";
import { permissionMappingAppService } from "@shared/authorization";

interface UserElementAccessModalProps {
  user: User;
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

// ✅ تابع جدید: استخراج تمام وابستگی‌های تودرتو به صورت فلت لیست
function getAllNestedDependencies(
  elementId: string,
  visited: Set<string> = new Set(),
): string[] {
  if (visited.has(elementId)) return [];
  visited.add(elementId);

  const directDeps = getAllDependenciesChain(elementId);
  const allDeps: string[] = [...directDeps];

  for (const dep of directDeps) {
    const nestedDeps = getAllNestedDependencies(dep, visited);
    allDeps.push(...nestedDeps);
  }

  return [...new Set(allDeps)];
}

type AccessTab = "elements" | "permissions";

export function UserElementAccessModal({
  user,
  isOpen,
  onClose,
  onSave,
}: UserElementAccessModalProps) {
  const { isDark } = useTheme();

  const uiElements = useMemo<DBUIElement[]>(() => {
    return getAllElements().map((el: any) => {
      const moduleName = el._module || "Unknown";
      const pageName = el._page || "Unknown";
      return {
        id: el.id,
        name: el.label || el.id,
        entity: moduleName,
        component: pageName,
      } as DBUIElement;
    });
  }, []);

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
        const mappings = await permissionMappingAppService.getAll();
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

  const basePermissions = useMemo(
    () => getBasePermissions(user.role),
    [user.role],
  );

  const allAllowedElements = useMemo((): Set<string> => {
    const allowed = new Set<string>();
    basePermissions.forEach((permission: string) => {
      const variants = [
        permission,
        permission.replace(":", "_"),
        permission.includes("_") && !permission.includes(":")
          ? `${permission.split("_")[0]}:${permission.split("_").slice(1).join("_")}`
          : permission,
      ];
      variants.forEach((variant) => {
        if (uiElements.some((el: DBUIElement) => el.id === variant)) {
          allowed.add(variant);
        }
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
    customPermissions.forEach((perm: string) => {
      const mapping = allMappings.find((m) => m.permission === perm);
      if (mapping) {
        mapping.allowedElements.forEach((el) => allowed.add(el));
      }
      if (uiElements.some((el: DBUIElement) => el.id === perm)) {
        allowed.add(perm);
      }
    });
    return allowed;
  }, [basePermissions, customPermissions, allMappings, uiElements]);

  const entities = useMemo(() => {
    const entitySet = new Set<string>();
    uiElements.forEach((el: DBUIElement) => {
      entitySet.add(el.entity);
    });
    return Array.from(entitySet).sort();
  }, [uiElements]);

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

  const filteredElements = useMemo(() => {
    return uiElements.filter((el: DBUIElement) => {
      if (selectedEntity && el.entity !== selectedEntity) return false;
      if (editSearchQuery) {
        const q = editSearchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) || el.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [uiElements, selectedEntity, editSearchQuery]);

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

  const CATEGORIES = useMemo(() => {
    const cats: Record<string, { icon: string; children: string[] }> = {};
    const iconMap: Record<string, string> = {
      ClientList: "👥",
      ClientDetails: "📋",
      ClientContractDetailsModal: "📄",
      ContractList: "📑",
      ContractDetails: "📝",
      InspectionList: "🔍",
      InspectorList: "🕵️",
      ProjectList: "🚀",
    };
    filteredElements.forEach((el: DBUIElement) => {
      const pageName = el.component || "Unknown";
      if (!cats[pageName]) {
        cats[pageName] = { icon: iconMap[pageName] || "📦", children: [] };
      }
      cats[pageName].children.push(el.id);
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

  const handleToggleElement = useCallback(
    (elementId: string) => {
      if (
        isElementBase(elementId, basePermissions) ||
        elementsCoveredByBatches.has(elementId)
      ) {
        return;
      }
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
        const childrenToRemove = getAllChildrenChain(elementId);
        childrenToRemove.forEach((child: string) => {
          newPermissions = newPermissions.filter((id) => id !== child);
        });
        const actuallyRemoved = childrenToRemove.filter((child: string) =>
          customPermissions.includes(child),
        );
        if (actuallyRemoved.length > 0) {
          showToast(
            "info",
            "Cascading Removal",
            `Removed "${elementId}" and ${actuallyRemoved.length} dependent element(s)`,
          );
        }
      } else {
        const chain = getAllDependenciesChain(elementId);
        const missingDeps = chain.filter(
          (dep: string) =>
            !allAllowedElements.has(dep) && !newPermissions.includes(dep),
        );
        if (missingDeps.length > 0) {
          setPendingElementToggle({ elementId, missingDeps });
          setShowDependencyModal(true);
          return;
        }
        newPermissions.push(elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((s: string) => {
            if (!newPermissions.includes(s)) newPermissions.push(s);
          });
        }
        showToast("success", "Added", `"${elementId}" added`);
      }
      setCustomPermissions(newPermissions);
    },
    [
      customPermissions,
      basePermissions,
      elementsCoveredByBatches,
      allAllowedElements,
    ],
  );

  // ✅ تابع جدید: فعال‌سازی زنجیره‌ای (Chain Activation)
  const handleActivateChain = useCallback(() => {
    if (!pendingElementToggle) return;

    const { elementId } = pendingElementToggle;
    const allNestedDeps = getAllNestedDependencies(elementId);

    // مرتب‌سازی بر اساس عمق (کم‌عمق‌تر اول)
    const sortedDeps = allNestedDeps
      .map((depId: string) => {
        const depth = getAllDependenciesChain(depId).length;
        return { depId, depth };
      })
      .sort((a, b) => a.depth - b.depth)
      .map(({ depId }) => depId);

    // اضافه کردن تمام وابستگی‌ها به ترتیب
    let newPermissions = [...customPermissions];
    for (const depId of sortedDeps) {
      if (!newPermissions.includes(depId) && !allAllowedElements.has(depId)) {
        newPermissions.push(depId);
      }
    }

    // اضافه کردن خود المان اصلی
    if (!newPermissions.includes(elementId)) {
      newPermissions.push(elementId);
    }

    setCustomPermissions(newPermissions);
    setShowDependencyModal(false);
    setPendingElementToggle(null);
    showToast(
      "success",
      "Chain Activated",
      `Activated "${elementId}" and ${sortedDeps.length} dependencies`,
    );
  }, [pendingElementToggle, customPermissions, allAllowedElements]);

  const handleTogglePermission = useCallback(
    (permission: string) => {
      const isSelected = customPermissions.includes(permission);
      setCustomPermissions((prev) =>
        prev.includes(permission)
          ? prev.filter((p) => p !== permission)
          : [...prev, permission],
      );
    },
    [customPermissions],
  );

  const handleResolveDependency = useCallback(
    (depId: string) => {
      if (!pendingElementToggle) return;

      // ✅ فعال‌سازی زنجیره‌ای برای این المان خاص
      const allNestedDeps = getAllNestedDependencies(depId);
      const sortedDeps = allNestedDeps
        .map((d: string) => ({
          depId: d,
          depth: getAllDependenciesChain(d).length,
        }))
        .sort((a, b) => a.depth - b.depth)
        .map(({ depId }) => depId);

      let newPermissions = [...customPermissions];
      for (const d of sortedDeps) {
        if (!newPermissions.includes(d) && !allAllowedElements.has(d)) {
          newPermissions.push(d);
        }
      }
      if (!newPermissions.includes(depId)) {
        newPermissions.push(depId);
      }

      setCustomPermissions(newPermissions);
      showToast(
        "success",
        "Chain Activated",
        `Activated "${depId}" and ${sortedDeps.length} dependencies`,
      );
    },
    [pendingElementToggle, customPermissions, allAllowedElements],
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

  const handleSave = () => {
    const validatedPermissions = customPermissions.filter(
      (elementId: string) => {
        if (isElementBase(elementId, basePermissions)) return false;
        if (elementsCoveredByBatches.has(elementId)) return false;
        const chain = getAllDependenciesChain(elementId);
        const allDepsSatisfied = chain.every((dep: string) => {
          return (
            isElementBase(dep, basePermissions) ||
            elementsCoveredByBatches.has(dep) ||
            customPermissions.includes(dep)
          );
        });
        return allDepsSatisfied;
      },
    );
    onSave(validatedPermissions);

    showToast("success", "Saved", "Permissions updated successfully");
  };

  const handleCancel = () => onClose();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={`🔐 Access Control: ${user.fullName}`}
        size="full"
      >
        <div className="flex flex-col" style={{ height: "calc(92vh - 80px)" }}>
          {/* Header ثابت */}
          <div className="flex-shrink-0 space-y-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  {user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-xs text-slate-500">@{user.username}</div>
                  <div className="text-sm font-semibold">
                    Role: <span className="capitalize">{user.role}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge tone="amber" className="text-[11px]">
                  🔒 Base Permissions({basePermissions.length})
                </Badge>
                <Badge tone="indigo" className="text-[11px]">
                  🎁 Custom Permissions ({customPermissions.length})
                </Badge>
              </div>
            </div>

            <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900">
              <button
                onClick={() => setActiveTab("elements")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                  activeTab === "elements"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                📦 Elements{" "}
                <Badge tone="slate" className="text-[10px] px-2">
                  {filteredElements.length}
                </Badge>
              </button>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                  activeTab === "permissions"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                🔐 Permissions{" "}
                <Badge tone="slate" className="text-[10px] px-2">
                  {filteredPermissions.length}
                </Badge>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-12 gap-4 py-3">
            <div className="col-span-3 flex flex-col gap-3 overflow-hidden">
              <div
                className={`rounded-lg border p-3 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <div className="text-[10px] uppercase font-bold tracking-wider mb-2 text-slate-500">
                  📦 Entity
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedEntity("")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      !selectedEntity
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    }`}
                  >
                    All
                  </button>
                  {entities.map((entity) => {
                    const moduleIcons: Record<string, string> = {
                      Client: "👥",
                      Contract: "📄",
                      Inspection: "🔍",
                      Inspector: "🕵️",
                      Project: "🚀",
                    };
                    return (
                      <button
                        key={entity}
                        onClick={() => setSelectedEntity(entity)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                          selectedEntity === entity
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        <span>{moduleIcons[entity] || "📦"}</span>
                        <span>{entity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === "elements" &&
                Object.keys(CATEGORIES).length > 0 && (
                  <div
                    className={`rounded-lg border p-3 flex-1 overflow-y-auto ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider mb-2 text-slate-500">
                      📋 Category
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategory("ALL")}
                        className={`w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center justify-between ${
                          selectedCategory === "ALL"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                        }`}
                      >
                        <span>All</span>
                        <span className="text-[9px] opacity-70">
                          {filteredElements.length}
                        </span>
                      </button>
                      {Object.entries(CATEGORIES).map(([key, cat]) => {
                        const elements = getElementsForCategory(key);
                        const allowed = elements.filter((el: DBUIElement) =>
                          customPermissions.includes(el.id),
                        ).length;
                        const displayName = key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^ /, "")
                          .trim();
                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center justify-between ${
                              selectedCategory === key
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <span>{cat.icon}</span>
                              <span>{displayName}</span>
                            </span>
                            <span className="text-[9px] opacity-70">
                              {allowed}/{elements.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            <div className="col-span-9 flex flex-col min-h-0">
              <div
                className={`flex-shrink-0 flex items-center gap-2 mb-3 p-2 rounded-lg border ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-slate-50/50"}`}
              >
                <input
                  type="text"
                  value={editSearchQuery}
                  onChange={(e) => setEditSearchQuery(e.target.value)}
                  placeholder="🔍 Search..."
                  className={`flex-1 px-3 py-1.5 rounded border text-sm ${isDark ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-300 bg-white text-slate-900"}`}
                />
                <button
                  onClick={() => handleSelectAllInCategory(selectedCategory)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleClearAllInCategory(selectedCategory)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                {activeTab === "elements" &&
                  (filteredElements.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-3">🔒</div>
                      <p className="text-base text-slate-500">
                        No additional elements available
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {getElementsForCategory(selectedCategory).map(
                        (element: DBUIElement) => {
                          const isBase =
                            isElementBase(element.id, basePermissions) ||
                            elementsCoveredByBatches.has(element.id);
                          const isCustomAllowed = customPermissions.includes(
                            element.id,
                          );
                          const isAllowed = isBase || isCustomAllowed;
                          const chain = getAllDependenciesChain(element.id);
                          const { satisfied, missing } = checkDependenciesChain(
                            element.id,
                            Array.from(allAllowedElements),
                          );
                          const hasUnmetDeps = !satisfied;

                          const handleClick = () => {
                            if (isBase) return;
                            if (!isAllowed) {
                              const missingDeps = chain.filter(
                                (dep: string) => !allAllowedElements.has(dep),
                              );
                              if (missingDeps.length > 0) {
                                setPendingElementToggle({
                                  elementId: element.id,
                                  missingDeps,
                                });
                                setShowDependencyModal(true);
                                return;
                              }
                            }
                            handleToggleElement(element.id);
                          };

                          return (
                            <div
                              key={element.id}
                              onClick={handleClick}
                              className={`p-2.5 rounded-lg border transition-all ${
                                isBase
                                  ? "bg-slate-100 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700/50 opacity-60 cursor-not-allowed"
                                  : isAllowed
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer"
                                    : "bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                                    isAllowed
                                      ? isBase
                                        ? "bg-slate-500 border-slate-500"
                                        : "bg-emerald-600 border-emerald-600"
                                      : "border-slate-300 dark:border-slate-600"
                                  }`}
                                >
                                  {isAllowed && (
                                    <span className="text-white text-[10px]">
                                      {isBase ? "🔒" : "✓"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <code className="text-[10px] font-mono truncate block text-indigo-700 dark:text-indigo-300">
                                    {element.id}
                                  </code>
                                  <div className="text-[11px] truncate text-slate-600 dark:text-slate-400 mt-0.5">
                                    {element.name}
                                  </div>
                                  {isBase && (
                                    <div className="text-[9px] mt-1 text-slate-500">
                                      🛡️ Base Role Persmission
                                    </div>
                                  )}
                                  {chain.length > 0 &&
                                    hasUnmetDeps &&
                                    !isBase && (
                                      <div className="text-[9px] mt-1 text-rose-600 dark:text-rose-300">
                                        ⚠️ {missing.length} missing
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ))}

                {activeTab === "permissions" &&
                  (filteredPermissions.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-5xl mb-3">🔒</div>
                      <p className="text-base text-slate-500">
                        No additional permissions available
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredPermissions.map((mapping) => {
                        const isSelected = customPermissions.includes(
                          mapping.permission,
                        );
                        const [entity, action] = mapping.permission.split(":");
                        return (
                          <div
                            key={mapping.permission}
                            onClick={() =>
                              handleTogglePermission(mapping.permission)
                            }
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700"
                                : "bg-white dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 dark:border-slate-600"}`}
                            >
                              {isSelected && (
                                <span className="text-white text-[10px]">
                                  ✓
                                </span>
                              )}
                            </div>
                            <code className="text-sm font-mono font-bold flex-1 text-indigo-700 dark:text-indigo-300">
                              {mapping.permission}
                            </code>
                            <Badge tone="slate" className="text-[9px]">
                              {entity}
                            </Badge>
                            <Badge
                              tone={isSelected ? "indigo" : "slate"}
                              className="text-[9px]"
                            >
                              {action}
                            </Badge>
                            <span className="text-[10px] text-slate-500">
                              {mapping.allowedElements.length} elem
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer ثابت */}
          <div className="flex-shrink-0 pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
            {customPermissions.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    📌 {customPermissions.length} selected
                  </span>
                  <button
                    onClick={() => setCustomPermissions([])}
                    className="text-[10px] text-rose-600 hover:text-rose-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {customPermissions.map((id) => (
                    <div
                      key={id}
                      className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200"
                    >
                      <span className="truncate max-w-[120px]">{id}</span>
                      <button
                        onClick={() => handleRemoveFromSelected(id)}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* مودال Dependencies با Chain Activation */}
      {showDependencyModal && pendingElementToggle && (
        <Modal
          isOpen={showDependencyModal}
          onClose={() => {
            setShowDependencyModal(false);
            setPendingElementToggle(null);
          }}
          title="🔗 Dependencies Required"
          size="lg"
        >
          <div className="flex flex-col h-[70vh]">
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Cannot activate{" "}
                  <strong>{pendingElementToggle.elementId}</strong>. Requires{" "}
                  <strong>{pendingElementToggle.missingDeps.length}</strong>{" "}
                  direct dependencies.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(() => {
                const allNestedDeps = getAllNestedDependencies(
                  pendingElementToggle.elementId,
                );
                const depsWithDepth = allNestedDeps.map((depId: string) => {
                  const depth = getAllDependenciesChain(depId).length;
                  const isSatisfied =
                    customPermissions.includes(depId) ||
                    allAllowedElements.has(depId);
                  const depChain = getAllDependenciesChain(depId);
                  const allDepsSatisfied = depChain.every(
                    (dep: string) =>
                      allAllowedElements.has(dep) ||
                      customPermissions.includes(dep),
                  );
                  const canActivate = allDepsSatisfied && !isSatisfied;
                  return { depId, depth, isSatisfied, canActivate };
                });
                depsWithDepth.sort((a, b) => a.depth - b.depth);

                return depsWithDepth.map(
                  ({ depId, depth, isSatisfied, canActivate }) => {
                    const depChain = getAllDependenciesChain(depId);
                    return (
                      <div
                        key={depId}
                        className={`p-3 rounded-lg border transition-all ${
                          isSatisfied
                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700"
                            : canActivate
                              ? "bg-white dark:bg-slate-800/30 border-indigo-200 dark:border-indigo-700"
                              : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300">
                                {depId}
                              </code>
                              {depth > 0 && (
                                <Badge
                                  tone={depth > 1 ? "amber" : "slate"}
                                  className="text-[9px]"
                                >
                                  Level {depth}
                                </Badge>
                              )}
                            </div>
                            {depChain.length > 0 && (
                              <div className="mt-2 pl-3 border-l-2 border-slate-300 dark:border-slate-600">
                                <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                                  Depends on:
                                </div>
                                <div className="space-y-1">
                                  {depChain.map((subDep: string) => {
                                    const subDepSatisfied =
                                      customPermissions.includes(subDep) ||
                                      allAllowedElements.has(subDep);
                                    return (
                                      <div
                                        key={subDep}
                                        className={`flex items-center gap-2 text-[10px] ${subDepSatisfied ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                                      >
                                        <span>
                                          {subDepSatisfied ? "✓" : "⬜"}
                                        </span>
                                        <code className="font-mono">
                                          {subDep}
                                        </code>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          {isSatisfied ? (
                            <Badge
                              tone="emerald"
                              className="text-[10px] px-3 py-1"
                            >
                              ✓ Active
                            </Badge>
                          ) : (
                            <button
                              onClick={() => handleResolveDependency(depId)}
                              disabled={!canActivate}
                              className={`text-[11px] px-3 py-1.5 rounded font-medium transition-all flex-shrink-0 ${
                                canActivate
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-sm"
                                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                              }`}
                              title={
                                !canActivate
                                  ? "Dependencies not satisfied yet"
                                  : "Click to activate"
                              }
                            >
                              + Activate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  },
                );
              })()}
            </div>

            <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex gap-2 justify-end">
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
                  onClick={handleActivateChain}
                >
                  ⚡ Activate All Chain
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
