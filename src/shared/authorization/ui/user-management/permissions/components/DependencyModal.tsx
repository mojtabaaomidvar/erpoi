// src/shared/authorization/ui/permission-manager/components/DependencyModal.tsx

import { Modal, Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import { getAllDependenciesChain } from "@shared/authorization/ui";
import { getElementDepth } from "@shared/authorization/ui/ui-elements/linkedElements";
import type { PendingElementToggle } from "../types";

interface DependencyModalProps {
  isOpen: boolean;
  pendingToggle: PendingElementToggle | null;
  selectedPermission: string;
  currentAllowed: string[];
  onClose: () => void;
  onResolve: (depId: string) => void;
  onActivate: () => void;
}

export function DependencyModal({
  isOpen,
  pendingToggle,
  currentAllowed,
  onClose,
  onResolve,
  onActivate,
}: DependencyModalProps) {
  const { isDark } = useTheme();

  if (!pendingToggle) return null;

  const { elementId, missingDeps } = pendingToggle;

  const depsByModule: Record<string, string[]> = {};
  missingDeps.forEach((dep) => {
    const module = dep.split("_")[0];
    if (!depsByModule[module]) depsByModule[module] = [];
    depsByModule[module].push(dep);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔗 Dependencies Required"
      size="lg"
    >
      <div className="space-y-4">
        <div
          className={`p-4 rounded-lg border ${
            isDark
              ? "border-amber-700 bg-amber-900/20"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h4
                className={`text-sm font-bold mb-1 ${
                  isDark ? "text-amber-200" : "text-amber-800"
                }`}
              >
                Cannot activate "{elementId}"
              </h4>
              <p
                className={`text-xs ${
                  isDark ? "text-amber-300" : "text-amber-700"
                }`}
              >
                This element requires <strong>{missingDeps.length}</strong>{" "}
                dependencies to be activated first. Please activate them
                manually from the list below.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border ${
            isDark
              ? "border-indigo-700 bg-indigo-900/20"
              : "border-indigo-200 bg-indigo-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div
                className={`text-[10px] uppercase font-semibold ${
                  isDark ? "text-indigo-300" : "text-indigo-600"
                }`}
              >
                Target Element
              </div>
              <code
                className={`text-sm font-mono ${
                  isDark ? "text-indigo-200" : "text-indigo-800"
                }`}
              >
                {elementId}
              </code>
            </div>
            <Badge tone="indigo" className="text-[10px]">
              Depth: {getElementDepth(elementId)}
            </Badge>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Object.entries(depsByModule).map(([module, deps]) => (
            <div
              key={module}
              className={`rounded-lg border ${
                isDark
                  ? "border-slate-700 bg-slate-800/30"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div
                className={`px-3 py-2 border-b ${
                  isDark
                    ? "border-slate-700 bg-slate-800/50"
                    : "border-slate-200 bg-slate-100"
                }`}
              >
                <h5
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  📦 {module} Module ({deps.length})
                </h5>
              </div>
              <div className="p-2 space-y-1">
                {deps.map((depId) => {
                  const depth = getElementDepth(depId);
                  const isSatisfied = currentAllowed.includes(depId);

                  return (
                    <div
                      key={depId}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                        isSatisfied
                          ? isDark
                            ? "bg-emerald-900/20 border-emerald-700"
                            : "bg-emerald-50 border-emerald-200"
                          : isDark
                            ? "bg-slate-800/30 border-slate-700"
                            : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code
                            className={`text-xs font-mono ${
                              isDark ? "text-indigo-300" : "text-indigo-700"
                            }`}
                          >
                            {depId}
                          </code>
                          <Badge
                            tone={
                              isSatisfied
                                ? "emerald"
                                : depth > 1
                                  ? "amber"
                                  : "slate"
                            }
                            className="text-[8px]"
                          >
                            Depth {depth}
                          </Badge>
                        </div>
                        {depth > 1 && (
                          <div
                            className={`text-[10px] mt-0.5 ${
                              isDark ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            🔗 Chain:{" "}
                            {getAllDependenciesChain(depId)
                              .slice(0, 3)
                              .map((d: string) =>
                                d.replace(/^(client|contract)_/, ""),
                              )
                              .join(" → ")}
                            {getAllDependenciesChain(depId).length > 3 &&
                              " ..."}
                          </div>
                        )}
                      </div>

                      {isSatisfied ? (
                        <Badge tone="emerald" className="text-[9px]">
                          ✓ Active
                        </Badge>
                      ) : (
                        <button
                          onClick={() => onResolve(depId)}
                          className={`text-[10px] px-2 py-1 rounded font-medium ${
                            isDark
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-indigo-500 text-white hover:bg-indigo-600"
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

        <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onActivate}
            disabled={missingDeps.some((dep) => !currentAllowed.includes(dep))}
          >
            ✓ Activate Target Element
          </Button>
        </div>
      </div>
    </Modal>
  );
}
