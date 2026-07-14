// src/shared/authorization/ui/permission-manager/components/PermissionOverview.tsx

import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { getLinkedGroup, isMasterElement } from "@shared/authorization/ui/ui-elements/linkedElements";

interface PermissionOverviewProps {
  permission: string;
  mapping: DBPermissionMapping | null;
  elementsByComponent: Array<[string, DBUIElement[]]>;
  onEdit: () => void;
}

export function PermissionOverview({
  permission,
  mapping,
  elementsByComponent,
  onEdit,
}: PermissionOverviewProps) {
  const { isDark } = useTheme();

  return (
    <div className="lg:col-span-3">
      <div
        className={`rounded-xl border p-6 ${
          isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2
              className={`text-2xl font-bold mb-1 ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              <code className="text-indigo-600 dark:text-indigo-400">
                {permission}
              </code>
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Permission Overview & Element Access
            </p>
          </div>
          <Button variant="primary" size="md" onClick={onEdit} className="gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Elements
          </Button>
        </div>

        <div>
          <div className="space-y-3">
            {elementsByComponent.map(([component, elements]) => {
              const allowedCount = elements.filter((el) =>
                mapping?.allowedElements.includes(el.id),
              ).length;

              return (
                <div
                  key={component}
                  className={`rounded-lg border ${
                    isDark
                      ? "border-slate-700 bg-slate-800/30"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isDark ? "text-slate-100" : "text-slate-900"
                        }`}
                      >
                        {component}
                      </h4>
                    </div>
                  </div>
                  <div className="px-4 pb-3 grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    {elements.map((element) => {
                      const isAllowed = mapping?.allowedElements.includes(
                        element.id,
                      );
                      const isLinked = getLinkedGroup(element.id) !== null;
                      const isMaster = isMasterElement(element.id);

                      return (
                        <div
                          key={element.id}
                          className={`px-2 py-1.5 rounded text-xs flex items-center gap-2 ${
                            isAllowed
                              ? isDark
                                ? "bg-emerald-900/20 text-emerald-300"
                                : "bg-emerald-50 text-emerald-700"
                              : isDark
                                ? "bg-slate-800/30 text-slate-400"
                                : "bg-white text-slate-500"
                          }`}
                        >
                          <span>{isAllowed ? "✓" : "✗"}</span>
                          <span className="truncate flex-1">{element.name}</span>
                          {isLinked && isMaster && (
                            <span
                              className={`text-[9px] ${
                                isDark ? "text-violet-400" : "text-violet-600"
                              }`}
                            >
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
    </div>
  );
}