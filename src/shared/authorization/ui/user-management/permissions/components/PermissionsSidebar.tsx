// src/shared/authorization/ui/permission-manager/components/PermissionsSidebar.tsx

import { Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBPermissionMapping } from "@shared/database/types";

interface PermissionsSidebarProps {
  permissions: Array<{
    permission: string;
    mapping: DBPermissionMapping;
    isPending: boolean;
    isSaved: boolean;
  }>;
  selectedPermission: string;
  onSelect: (permission: string) => void;
  onEdit: (permission: string) => void;
  onDelete: (permission: string) => void;
}

export function PermissionsSidebar({
  permissions,
  selectedPermission,
  onSelect,
  onEdit,
  onDelete,
}: PermissionsSidebarProps) {
  const { isDark } = useTheme();

  return (
    <div className="lg:col-span-1">
      <div
        className={`rounded-xl border p-4 sticky top-6 ${
          isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        <h2
          className={`text-sm font-bold mb-3 ${
            isDark ? "text-slate-100" : "text-slate-900"
          }`}
        >
          📋 Permissions
        </h2>
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {permissions.map(({ permission, mapping, isPending, isSaved }) => {
            const isSelected = selectedPermission === permission;

            return (
              <div
                key={permission}
                className={`group px-3 py-2 rounded-lg transition-all ${
                  isSelected
                    ? isDark
                      ? "bg-indigo-900/30 border border-indigo-500"
                      : "bg-indigo-50 border border-indigo-200"
                    : isDark
                      ? "hover:bg-slate-800 border border-transparent"
                      : "hover:bg-slate-100 border border-transparent"
                }`}
              >
                <div
                  onClick={() => onSelect(permission)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <code
                        className={`text-xs font-mono ${
                          isDark ? "text-indigo-300" : "text-indigo-700"
                        }`}
                      >
                        {permission}
                      </code>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {mapping.allowedElements.length} elements
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex gap-1">
                    {isPending && (
                      <Badge tone="amber" className="text-[9px]">
                        Modified
                      </Badge>
                    )}
                    {isSaved && !isPending && (
                      <Badge tone="emerald" className="text-[9px]">
                        Saved
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(permission);
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        isDark
                          ? "text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/30"
                          : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                      }`}
                      title="Edit permission elements"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
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
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(permission);
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        isDark
                          ? "text-slate-400 hover:text-rose-400 hover:bg-rose-900/30"
                          : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                      title="Delete permission"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
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
  );
}