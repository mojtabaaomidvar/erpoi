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
        className={`rounded-2xl border p-4 sticky top-6 ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-white shadow-sm"}`}
      >
        <h2
          className={`text-xs font-bold uppercase tracking-wider mb-4 px-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
        >
          Permissions
        </h2>
        <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
          {permissions.map(({ permission, mapping, isPending, isSaved }) => {
            const isSelected = selectedPermission === permission;

            return (
              <div
                key={permission}
                className={`group relative rounded-xl transition-all duration-200 ${
                  isSelected
                    ? isDark
                      ? "bg-indigo-900/30 border border-indigo-500/50"
                      : "bg-indigo-50 border border-indigo-200"
                    : isDark
                      ? "hover:bg-slate-800 border border-transparent"
                      : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div
                  onClick={() => onSelect(permission)}
                  className="cursor-pointer p-3 pr-16"
                >
                  <div className="flex items-center justify-between mb-1">
                    <code
                      className={`text-xs font-mono font-semibold truncate ${isSelected ? (isDark ? "text-indigo-300" : "text-indigo-700") : isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      {permission}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      {mapping.allowedElements.length} elements
                    </span>
                    {isPending && (
                      <Badge
                        tone="amber"
                        className="text-[8px] scale-90 origin-left"
                      >
                        Modified
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons (Hover only) */}
                <div
                  className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(permission);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/50" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-100"}`}
                    title="Edit"
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
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-400 hover:text-rose-400 hover:bg-rose-900/50" : "text-slate-400 hover:text-rose-600 hover:bg-rose-100"}`}
                    title="Delete"
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
