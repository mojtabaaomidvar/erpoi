// src/shared/authorization/ui/permission-manager/components/EditPermissionModal.tsx

import { useState, useMemo, useCallback } from "react";
import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { showToast } from "@shared/ui/ToastContainer";
import {
  getAllDependenciesChain,
  getAllChildrenChain,
  checkDependenciesChain,
} from "@shared/authorization/ui/ui-elements/dependencies";
import {
  getLinkedGroup,
  isMasterElement,
  getLinkedGroupMaster,
  getLinkedSlaves,
  getElementDepth,
} from "@shared/authorization/ui/ui-elements/linkedElements";

interface EditPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: string;
  uiElements: DBUIElement[];
  currentMapping: DBPermissionMapping | null;
  onSave: (permission: string, allowed: string[], denied: string[]) => void;
}

// 🔧 NEW: استخراج entity از permission
function extractEntityFromPermission(permission: string): string {
  if (permission.includes(":")) {
    return permission.split(":")[0];
  }
  if (permission.includes("_")) {
    return permission.split("_")[0];
  }
  return permission;
}

// ═══════════════════════════════════════
// 🎯 کامپوننت‌های داخلی
// ═══════════════════════════════════════

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
      const missingDeps = chain.filter((dep) => !editingAllowed.includes(dep));
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
      className={`p-2 rounded-md border-2 cursor-pointer transition-all ${
        isAllowed
          ? isDark
            ? "bg-emerald-900/20 border-emerald-700 hover:bg-emerald-900/30"
            : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
          : isDark
            ? "bg-slate-800/30 border-slate-700 hover:bg-slate-800/50"
            : "bg-white border-slate-200 hover:bg-slate-50"
      } ${hasUnmetDeps ? "opacity-60" : ""} ${isLinked && isMaster ? "ring-1 ring-violet-500/30" : ""}`}
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
          {isAllowed && <span className="text-white text-[8px]">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <code
              className={`text-[10px] font-mono truncate ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
            >
              {element.id}
            </code>
            {isLinked && isMaster && <span className="text-[8px]">👑</span>}
            {depth > 0 && (
              <Badge
                tone={depth > 2 ? "amber" : "indigo"}
                className="text-[8px] px-1 py-0"
              >
                D{depth}
              </Badge>
            )}
          </div>
          <div
            className={`text-[10px] truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {element.name}
          </div>
          {isLinked && isMaster && slaves.length > 0 && (
            <div
              className={`text-[8px] mt-0.5 ${isDark ? "text-violet-300" : "text-violet-600"}`}
            >
              🔗 {slaves.length} linked
            </div>
          )}
          {chain.length > 0 && hasUnmetDeps && (
            <div
              className={`text-[8px] mt-0.5 ${isDark ? "text-rose-300" : "text-rose-600"}`}
            >
              ⚠️ {missing.length} missing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 🎯 کامپوننت اصلی
// ═══════════════════════════════════════

export function EditPermissionModal({
  isOpen,
  onClose,
  permission,
  uiElements,
  currentMapping,
  onSave,
}: EditPermissionModalProps) {
  const { isDark } = useTheme();

  // 🔧 NEW: استخراج entity
  const targetEntity = useMemo(
    () => extractEntityFromPermission(permission),
    [permission],
  );

  // State
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

  // ═══════════════════════════════════════
  // 🧮 Computed Values
  // ═══════════════════════════════════════

  // 🔧 FIX: فقط المان‌های entity مربوطه
  const entityElements = useMemo(() => {
    return uiElements.filter((el) => el.entity === targetEntity);
  }, [uiElements, targetEntity]);

  const filteredElements = useMemo(() => {
    return entityElements.filter((el) => {
      if (editSearchQuery) {
        const q = editSearchQuery.toLowerCase();
        return (
          el.id.toLowerCase().includes(q) || el.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entityElements, editSearchQuery]);

  const CATEGORIES = useMemo(() => {
    const cats: Record<string, { icon: string; children: string[] }> = {};

    filteredElements.forEach((el) => {
      const component = el.component || "Unknown";
      if (!cats[component]) {
        cats[component] = { icon: "📦", children: [] };
      }
      cats[component].children.push(el.id);
    });

    const iconMap: Record<string, string> = {
      ClientList: "👥",
      ClientDetails: "📋",
      ClientForm: "✍️",
      ContractList: "📄",
      ContractDetails: "📑",
      ContractForm: "✍️",
      InspectionList: "🔍",
      InspectionDetails: "🔎",
      InvoiceList: "💰",
      InvoiceDetails: "💵",
      Dashboard: "📊",
    };

    Object.keys(cats).forEach((key) => {
      cats[key].icon = iconMap[key] || "📦";
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

  const getCategoryProgress = useCallback(
    (category: string) => {
      const elements = getElementsForCategory(category);
      const allowed = elements.filter((el) =>
        editingAllowed.includes(el.id),
      ).length;
      return { allowed, total: elements.length };
    },
    [getElementsForCategory, editingAllowed],
  );

  // ═══════════════════════════════════════
  // 🎯 Handlers
  // ═══════════════════════════════════════

  const handleToggleElement = useCallback(
    (elementId: string) => {
      const isAllowed = editingAllowed.includes(elementId);
      let newAllowed = [...editingAllowed];

      const linkedGroup = getLinkedGroup(elementId);
      const isMaster = isMasterElement(elementId);

      if (linkedGroup && !isMaster) {
        const master = getLinkedGroupMaster(elementId);
        showToast(
          "warning",
          "Linked Element",
          `Linked to "${master}". Click master.`,
        );
        return;
      }

      if (isAllowed) {
        newAllowed = newAllowed.filter((id) => id !== elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((slave) => {
            newAllowed = newAllowed.filter((id) => id !== slave);
          });
        }
        getAllChildrenChain(
          elementId,
          uiElements.map((el) => el.id),
        ).forEach((child) => {
          newAllowed = newAllowed.filter((id) => id !== child);
        });
      } else {
        newAllowed.push(elementId);
        if (linkedGroup) {
          getLinkedSlaves(elementId).forEach((slave) => {
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
      setShowDependencyModal(true);
    },
    [],
  );

  const handleResolveDependency = useCallback(
    (depId: string) => {
      if (!pendingElementToggle) return;
      const chain = getAllDependenciesChain(depId);
      const missingDeps = chain.filter((d) => !editingAllowed.includes(d));
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
        showToast("success", "Added", `"${depId}" added`);
      }
    },
    [pendingElementToggle, editingAllowed],
  );

  const handleActivatePendingElement = useCallback(() => {
    if (!pendingElementToggle) return;
    const { elementId } = pendingElementToggle;
    const chain = getAllDependenciesChain(elementId);
    const missingDeps = chain.filter((dep) => !editingAllowed.includes(dep));
    if (missingDeps.length > 0) {
      showToast(
        "error",
        "Still Missing",
        `Still need: ${missingDeps.join(", ")}`,
      );
      return;
    }
    const newAllowed = [...editingAllowed, elementId];
    const linkedGroup = getLinkedGroup(elementId);
    if (linkedGroup) {
      getLinkedSlaves(elementId).forEach((slave) => {
        if (!newAllowed.includes(slave)) newAllowed.push(slave);
      });
    }
    setEditingAllowed(newAllowed);
    setShowDependencyModal(false);
    setPendingElementToggle(null);
    showToast("success", "Activated", `"${elementId}" activated`);
  }, [pendingElementToggle, editingAllowed]);

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

  // ═══════════════════════════════════════
  // 🎨 Styles
  // ═══════════════════════════════════════

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

  // ═══════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={`Edit: ${permission}`}
        size="xl"
      >
        <div className="flex flex-col" style={{ height: "calc(80vh - 80px)" }}>
          {/* ═══════════════════════════════════════════ */}
          {/* Header فشرده */}
          {/* ═══════════════════════════════════════════ */}
          <div className="flex-shrink-0 flex items-center justify-between pb-3">
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

          {/* ═══════════════════════════════════════════ */}
          {/* Main Content */}
          {/* ═══════════════════════════════════════════ */}
          <div className="flex-1 overflow-hidden min-h-0 grid grid-cols-12 gap-3">
            {/* Sidebar: Category */}
            <div className={sidebarStyle}>
              <div className="overflow-y-auto h-full p-2 space-y-1">
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
                    const progress = getCategoryProgress(key);
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key)}
                        className={`${sidebarButtonBase} ${selectedCategory === key ? sidebarButtonActive : sidebarButtonInactive}`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span>{cat.icon}</span>
                          <span>{key}</span>
                        </span>
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
            </div>

            {/* Main Panel */}
            <div className="col-span-9 flex flex-col min-h-0">
              {/* Search & Actions */}
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
                <button
                  onClick={() => handleSelectAllInCategory(selectedCategory)}
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
              </div>

              {/* Elements Grid - اسکرول‌شونده */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {filteredElements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">📦</div>
                    <p
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      No elements found for entity "{targetEntity}"
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
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

          {/* ═══════════════════════════════════════════ */}
          {/* Footer ثابت */}
          {/* ═══════════════════════════════════════════ */}
          <div
            className={`flex-shrink-0 pt-3 mt-3 border-t ${isDark ? "border-slate-700" : "border-slate-200"}`}
          >
            {/* Selected Summary */}
            {editingAllowed.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    📌 {editingAllowed.length} selected
                  </span>
                  <button
                    onClick={() => setEditingAllowed([])}
                    className={`text-[9px] ${isDark ? "text-rose-400 hover:text-rose-300" : "text-rose-600 hover:text-rose-700"}`}
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {editingAllowed.map((elementId) => {
                    const isLinked = getLinkedGroup(elementId) !== null;
                    const isMaster = isMasterElement(elementId);
                    return (
                      <div
                        key={elementId}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          isDark
                            ? "bg-emerald-900/30 text-emerald-200 border border-emerald-700/50"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isLinked && isMaster && <span>👑</span>}
                        <span className="truncate max-w-[100px]">
                          {elementId}
                        </span>
                        <button
                          onClick={() => handleRemoveFromSelected(elementId)}
                          className={`ml-0.5 ${isDark ? "hover:text-rose-400" : "hover:text-rose-600"}`}
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
                💾 Save Changes
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
              {pendingElementToggle.missingDeps.map((depId) => {
                const isSatisfied = editingAllowed.includes(depId);
                const depth = getElementDepth(depId);
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
                  (dep) => !editingAllowed.includes(dep),
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
