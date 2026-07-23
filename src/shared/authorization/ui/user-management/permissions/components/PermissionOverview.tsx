// src/shared/authorization/ui/permission-manager/components/PermissionOverview.tsx

import { Button, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import {
  getLinkedGroup,
  isMasterElement,
} from "@shared/authorization/ui/ui-elements/linkedElements";

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
  const allowedCount = mapping?.allowedElements.length || 0;

  return (
    <div className="lg:col-span-3 space-y-6">
      {/* Header */}
      <div
        className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white shadow-sm"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2
                className={`text-2xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
              >
                {permission}
              </h2>
              <Badge tone="indigo" className="text-xs font-medium">
                Permission
              </Badge>
            </div>
            <p
              className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              This permission grants access to{" "}
              <span className="font-semibold text-indigo-500">
                {allowedCount}
              </span>{" "}
              UI elements across the application.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={onEdit}
            className="gap-2 shadow-sm"
          >
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
            Edit Access
          </Button>
        </div>
      </div>

      {/* Elements List */}
      <div
        className={`rounded-2xl border p-6 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white shadow-sm"}`}
      >
        <h3
          className={`text-lg font-bold mb-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Allowed UI Elements
        </h3>

        {elementsByComponent.length === 0 || allowedCount === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <div className="text-4xl mb-3">🔒</div>
            <p
              className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              No elements assigned yet
            </p>
            <p
              className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-slate-500"}`}
            >
              Click "Edit Access" to grant permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {elementsByComponent.map(([component, elements]) => {
              const allowedElements = elements.filter((el) =>
                mapping?.allowedElements.includes(el.id),
              );
              if (allowedElements.length === 0) return null;

              return (
                <div key={component}>
                  <h4
                    className={`text-xs font-bold uppercase tracking-wider mb-3 px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {component}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allowedElements.map((el) => {
                      const isLinked = getLinkedGroup(el.id) !== null;
                      const isMaster = isMasterElement(el.id);

                      return (
                        <div
                          key={el.id}
                          className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${
                            isDark
                              ? "border-slate-800 bg-slate-800/40 hover:border-indigo-500/50 hover:bg-slate-800"
                              : "border-slate-100 bg-slate-50/50 hover:border-indigo-200 hover:bg-white hover:shadow-sm"
                          }`}
                        >
                          <div className="mt-0.5 text-emerald-500">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}
                            >
                              {el.name || el.id}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <code
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? "bg-slate-900 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
                              >
                                {el.id}
                              </code>
                              {isLinked && isMaster && (
                                <span
                                  className="text-[10px] text-violet-500"
                                  title="Master Element"
                                >
                                  👑
                                </span>
                              )}
                              <Badge
                                tone="slate"
                                className="text-[9px] scale-90 origin-left"
                              >
                                {el.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
