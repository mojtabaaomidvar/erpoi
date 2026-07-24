// src/shared/authorization/ui/permission-manager/components/EditPermissionModal.tsx

import { useState, useMemo, useCallback } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { showToast } from "@shared/ui/ToastContainer";
import {
  getAllDependenciesChain,
  checkDependenciesChain,
  getAllChildrenChain,
} from "@shared/authorization/ui";
import {
  getLinkedGroup,
  isMasterElement,
  getLinkedGroupMaster,
  getLinkedSlaves,
  getElementDepth,
} from "@shared/authorization/ui/linkedElements";

interface EditPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: string;
  uiElements: DBUIElement[];
  currentMapping: DBPermissionMapping | null;
  onSave: (permission: string, allowed: string[], denied: string[]) => void;
}

function extractEntityFromPermission(permission: string): string {
  if (permission.includes(":")) return permission.split(":")[0];
  if (permission.includes("_")) return permission.split("_")[0];
  return permission;
}

interface ElementCardProps {
  element: DBUIElement;
  isAllowed: boolean;
  editingAllowed: string[];
  isDark: boolean;
  onToggle: (elementId: string) => void;
  onShowDependencyModal: (elementId: string, missingDeps: string[]) => void;
}

function ElementCard({
  element,
  isAllowed,
  editingAllowed,
  isDark,
  onToggle,
  onShowDependencyModal,
}: ElementCardProps) {
  const chain = getAllDependenciesChain(element.id);
  const { satisfied, missing } = checkDependenciesChain(
    element.id,
    editingAllowed,
  );
  const hasUnmetDeps = !satisfied;
  const linkedGroup = getLinkedGroup(element.id);
  const isLinked = linkedGroup !== null;
  const isMaster = isMasterElement(element.id);
  const slaves = getLinkedSlaves(element.id);
  const depth = getElementDepth(element.id);

  const handleClick = () => {
    if (!isAllowed) {
      const missingDeps = chain.filter(
        (dep: string) => !editingAllowed.includes(dep),
      );
      if (missingDeps.length > 0) {
        onShowDependencyModal(element.id, missingDeps);
        return;
      }
    }
    onToggle(element.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
        isAllowed
          ? isDark
            ? "bg-indigo-900/20 border-indigo-500/50 shadow-sm shadow-indigo-500/10"
            : "bg-indigo-50/50 border-indigo-200 shadow-sm"
          : isDark
            ? "bg-slate-800/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800"
            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      } ${hasUnmetDeps ? "opacity-60" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          isAllowed
            ? "bg-indigo-600 border-indigo-600"
            : isDark
              ? "border-slate-600 group-hover:border-slate-500"
              : "border-slate-300 group-hover:border-slate-400"
        }`}
      >
        {isAllowed && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}
          >
            {element.name || element.id}
          </span>
          {isLinked && isMaster && (
            <span className="text-xs" title="Master Element">
              👑
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <code
            className={`text-[10px] font-mono truncate ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
          >
            {element.id}
          </code>
          {depth > 0 && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}
            >
              Depth {depth}
            </span>
          )}
        </div>

        {chain.length > 0 && hasUnmetDeps && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-rose-500 font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Missing {missing.length} deps
          </div>
        )}
      </div>
    </div>
  );
}

export function EditPermissionModal({
  isOpen,
  onClose,
  permission,
  uiElements,
  currentMapping,
  onSave,
}: EditPermissionModalProps) {
  const { isDark } = useTheme();
  const targetEntity = useMemo(
    () => extractEntityFromPermission(permission),
    [permission],
  );

  const [editingAllowed, setEditingAllowed] = useState<string[]>(
    currentMapping?.allowedElements || [],
  );
  const [editingDenied, setEditingDenied] = useState<string[]>(
    currentMapping?.deniedElements || [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editSearchQuery, setEditSearchQuery] = useState("");
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [pendingElementToggle, setPendingElementToggle] = useState<{
    elementId: string;
    missingDeps: string[];
  } | null>(null);
  const [tempAllowed, setTempAllowed] = useState<string[]>([]);

  const entityElements = useMemo(() => {
    return uiElements.filter(
      (el) => el.entity.toLowerCase() === targetEntity.toLowerCase(),
    );
  }, [uiElements, targetEntity]);

  const filteredElements = useMemo(() => {
    return entityElements.filter((el) => {
      if (editSearchQuery) {
        const q = editSearchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) ||
          (el.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entityElements, editSearchQuery]);

  const CATEGORIES = useMemo(() => {
    const cats: Record<string, { icon: string; children: string[] }> = {};
    filteredElements.forEach((el) => {
      const component = el.component || "Unknown";
      if (!cats[component]) cats[component] = { icon: "📦", children: [] };
      cats[component].children.push(el.id);
    });
    return cats;
  }, [filteredElements]);

  const getElementsForCategory = useCallback(
    (category: string): DBUIElement[] => {
      if (category === "ALL") return filteredElements;
      return filteredElements.filter((el) => el.component === category);
    },
    [filteredElements],
  );

  const handleToggleElement = useCallback(
    (elementId: string) => {
      const isAllowed = editingAllowed.includes(elementId);
      let newAllowed = [...editingAllowed];
      const linkedGroup = getLinkedGroup(elementId);
      const isMaster = isMasterElement(elementId);

      if (linkedGroup && !isMaster) {
        showToast(
          "warning",
          "Linked Element",
          `Linked to "${getLinkedGroupMaster(elementId)}". Click master.`,
        );
        return;
      }

      if (isAllowed) {
        newAllowed = newAllowed.filter((id) => id !== elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((slave: string) => {
            newAllowed = newAllowed.filter((id) => id !== slave);
          });
        }
        getAllChildrenChain(elementId).forEach((child: string) => {
          newAllowed = newAllowed.filter((id) => id !== child);
        });
      } else {
        newAllowed.push(elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((slave: string) => {
            if (!newAllowed.includes(slave)) newAllowed.push(slave);
          });
        }
      }
      setEditingAllowed(newAllowed);
    },
    [editingAllowed, uiElements],
  );

  const handleShowDependencyModal = useCallback(
    (elementId: string, missingDeps: string[]) => {
      setPendingElementToggle({ elementId, missingDeps });
      setTempAllowed([...editingAllowed]);
      setShowDependencyModal(true);
    },
    [],
  );

  const handleResolveDependency = useCallback(
    (depId: string) => {
      if (!pendingElementToggle) return;
      const chain = getAllDependenciesChain(depId);
      const missingDeps = chain.filter(
        (d: string) => !editingAllowed.includes(d),
      );
      if (missingDeps.length > 0) {
        showToast(
          "warning",
          "Nested Dependencies",
          `"${depId}" needs: ${missingDeps.join(", ")}`,
        );
        return;
      }
      if (!editingAllowed.includes(depId)) {
        setEditingAllowed([...editingAllowed, depId]);
        setTempAllowed([...tempAllowed, depId]);
        showToast("success", "Added", `"${depId}" added`);
      }
    },
    [pendingElementToggle, editingAllowed],
  );

  const handleActivatePendingElement = useCallback(() => {
    if (!pendingElementToggle) return;
    const { elementId } = pendingElementToggle;

    const chain = getAllDependenciesChain(elementId);
    const missingDeps = chain.filter(
      (dep: string) => !tempAllowed.includes(dep),
    );
    if (missingDeps.length > 0) {
      showToast(
        "error",
        "Still Missing",
        `Still need: ${missingDeps.join(", ")}`,
      );
      return;
    }
    let newAllowed = [...tempAllowed, elementId];
    const linkedGroup = getLinkedGroup(elementId);
    if (linkedGroup) {
      getLinkedSlaves(elementId).forEach((slave: string) => {
        if (!newAllowed.includes(slave)) newAllowed.push(slave);
      });
    }

    setEditingAllowed(newAllowed);
    setShowDependencyModal(false);
    setPendingElementToggle(null);
    setTempAllowed([]); // پاک کردن state موقت
    showToast(
      "success",
      "Activated",
      `"${elementId}" and dependencies activated`,
    );
  }, [pendingElementToggle, tempAllowed]);

  const handleRemoveFromSelected = useCallback((elementId: string) => {
    setEditingAllowed((prev) => prev.filter((id) => id !== elementId));
  }, []);

  const handleSelectAllInCategory = useCallback(
    (category: string) => {
      const elementIds = getElementsForCategory(category).map((el) => el.id);
      setEditingAllowed((prev) => [...new Set([...prev, ...elementIds])]);
    },
    [getElementsForCategory],
  );

  const handleClearAllInCategory = useCallback(
    (category: string) => {
      const ids = new Set(getElementsForCategory(category).map((el) => el.id));
      setEditingAllowed((prev) => prev.filter((id) => !ids.has(id)));
    },
    [getElementsForCategory],
  );

  const handleSave = () => onSave(permission, editingAllowed, editingDenied);
  const handleCancel = () => {
    onClose();
    setEditingAllowed(currentMapping?.allowedElements || []);
    setEditingDenied(currentMapping?.deniedElements || []);
    setSelectedCategory("ALL");
    setEditSearchQuery("");
    setPendingElementToggle(null);
    setShowDependencyModal(false);
  };

  const sidebarStyle = `col-span-3 rounded-xl border overflow-hidden ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`;
  const sidebarButtonBase = `w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all flex items-center justify-between gap-1`;
  const sidebarButtonActive = isDark
    ? "bg-indigo-900/50 text-indigo-200 border border-indigo-600"
    : "bg-indigo-100 text-indigo-700 border border-indigo-300";
  const sidebarButtonInactive = isDark
    ? "text-slate-300 hover:bg-slate-700/50 border border-transparent"
    : "text-slate-700 hover:bg-slate-100 border border-transparent";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={`Edit: ${permission}`}
        size="xl"
      >
        <div className="flex flex-col" style={{ height: "calc(85vh - 80px)" }}>
          <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div
                className={`text-[10px] uppercase font-semibold ${isDark ? "text-indigo-300" : "text-indigo-600"}`}
              >
                Editing Permission
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <code
                  className={`text-sm font-mono font-bold ${isDark ? "text-indigo-200" : "text-indigo-800"}`}
                >
                  {permission}
                </code>
                <Badge tone="slate" className="text-[9px]">
                  📦 {targetEntity}
                </Badge>
                <Badge tone="indigo" className="text-[9px]">
                  ✓ {editingAllowed.length}/{entityElements.length}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-12 gap-4 py-4">
            <div className={sidebarStyle}>
              <div className="overflow-y-auto h-full p-3 space-y-1">
                <div
                  className={`text-[9px] uppercase font-bold tracking-wider mb-2 px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  📋 Category
                </div>
                <div className="space-y-0.5">
                  <button
                    onClick={() => setSelectedCategory("ALL")}
                    className={`${sidebarButtonBase} ${selectedCategory === "ALL" ? sidebarButtonActive : sidebarButtonInactive}`}
                  >
                    <span className="truncate">All</span>
                    <span
                      className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {filteredElements.length}
                    </span>
                  </button>
                  {Object.entries(CATEGORIES).map(([key, cat]) => {
                    const elements = getElementsForCategory(key);
                    const allowed = elements.filter((el) =>
                      editingAllowed.includes(el.id),
                    ).length;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`${sidebarButtonBase} ${selectedCategory === key ? sidebarButtonActive : sidebarButtonInactive}`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span>{cat.icon}</span>
                          <span>{key}</span>
                        </span>
                        <span
                          className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                        >
                          {allowed}/{elements.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-span-9 flex flex-col min-h-0">
              <div
                className={`flex-shrink-0 flex items-center gap-2 mb-3 p-2 rounded-xl border ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`}
              >
                <input
                  type="text"
                  value={editSearchQuery}
                  onChange={(e) => setEditSearchQuery(e.target.value)}
                  placeholder="🔍 Search elements..."
                  className={`flex-1 px-3 py-1.5 rounded-lg border text-sm ${isDark ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-300 bg-white text-slate-900"}`}
                />
                <button
                  onClick={() => handleSelectAllInCategory(selectedCategory)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => handleClearAllInCategory(selectedCategory)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
                {filteredElements.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-3">📦</div>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      No elements found for entity "{targetEntity}"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getElementsForCategory(selectedCategory).map((element) => (
                      <ElementCard
                        key={element.id}
                        element={element}
                        isAllowed={editingAllowed.includes(element.id)}
                        editingAllowed={editingAllowed}
                        isDark={isDark}
                        onToggle={handleToggleElement}
                        onShowDependencyModal={handleShowDependencyModal}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex-shrink-0 pt-4 mt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
          >
            {editingAllowed.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    📌 {editingAllowed.length} selected
                  </span>
                  <button
                    onClick={() => setEditingAllowed([])}
                    className={`text-[10px] ${isDark ? "text-rose-400 hover:text-rose-300" : "text-rose-600 hover:text-rose-700"}`}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {editingAllowed.map((elementId) => (
                    <div
                      key={elementId}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono ${isDark ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700/50" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}
                    >
                      <span className="truncate max-w-[120px]">
                        {elementId}
                      </span>
                      <button
                        onClick={() => handleRemoveFromSelected(elementId)}
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
                💾 Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ✅ مودال Dependency بازنویسی‌شده با UI مدرن */}
      {showDependencyModal && pendingElementToggle && (
        <Modal
          isOpen={showDependencyModal}
          onClose={() => {
            setShowDependencyModal(false);
            setPendingElementToggle(null);
            setTempAllowed([]); // ✅ پاک کردن state موقت هنگام Cancel
          }}
          title="🔗 Dependencies Required"
          size="md"
        >
          <div className="flex flex-col h-[65vh]">
            <div className="flex-shrink-0 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 mb-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <h4
                    className={`text-sm font-bold mb-1 ${isDark ? "text-amber-200" : "text-amber-800"}`}
                  >
                    Cannot activate "{pendingElementToggle.elementId}"
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${isDark ? "text-amber-300/80" : "text-amber-700"}`}
                  >
                    This element requires{" "}
                    <strong>{pendingElementToggle.missingDeps.length}</strong>{" "}
                    dependencies to be activated first. Please activate them
                    from the list below.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {pendingElementToggle.missingDeps.map((depId) => {
                const isSatisfied = tempAllowed.includes(depId);
                const depth = getElementDepth(depId);

                return (
                  <div
                    key={depId}
                    className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      isSatisfied
                        ? isDark
                          ? "bg-emerald-900/20 border-emerald-700/50"
                          : "bg-emerald-50 border-emerald-200"
                        : isDark
                          ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code
                          className={`text-xs font-mono font-semibold truncate ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                        >
                          {depId}
                        </code>
                        {depth > 0 && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"}`}
                          >
                            Depth {depth}
                          </span>
                        )}
                      </div>

                      {(() => {
                        const subChain = getAllDependenciesChain(depId).slice(
                          0,
                          2,
                        );
                        if (subChain.length > 0) {
                          return (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span
                                className={`text-[9px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                              >
                                Requires:
                              </span>
                              {subChain.map((subDep, idx) => (
                                // ✅ استفاده از tempAllowed
                                <span
                                  key={idx}
                                  className={`text-[9px] font-mono ${tempAllowed.includes(subDep) ? "text-emerald-500" : "text-rose-500"}`}
                                >
                                  {subDep.replace(
                                    /^(client|contract|inspection|inspector|project)_/,
                                    "",
                                  )}
                                  {idx < subChain.length - 1 ? " →" : ""}
                                </span>
                              ))}
                              {getAllDependenciesChain(depId).length > 2 && (
                                <span className="text-[9px] text-slate-400">
                                  ...
                                </span>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {isSatisfied ? (
                      <Badge
                        tone="emerald"
                        className="text-[10px] px-2 py-1 gap-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Active
                      </Badge>
                    ) : (
                      <button
                        onClick={() => handleResolveDependency(depId)}
                        className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-500/20"
                      >
                        + Activate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex-shrink-0 flex gap-2 justify-end pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowDependencyModal(false);
                  setPendingElementToggle(null);
                  setTempAllowed([]); // ✅ پاک کردن state موقت
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleActivatePendingElement}
                // ✅ استفاده از tempAllowed
                disabled={pendingElementToggle.missingDeps.some(
                  (dep) => !tempAllowed.includes(dep),
                )}
                className={
                  pendingElementToggle.missingDeps.some(
                    (dep) => !tempAllowed.includes(dep),
                  )
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              >
                ✓ Activate Target Element
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
