// src/shared/authorization/ui/user-management/components/DepartmentCard.tsx

import { Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser } from "@shared/database/types";
import { getRoleConfig } from "../../../../config/RoleConfig";
import type { Department } from "@shared/authorization";

interface DepartmentCardProps {
  department: Department;
  users: DBUser[];
  manager: DBUser | null;
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
  onViewUsers?: (department: Department) => void;
  isDark?: boolean;
}

export function DepartmentCard({
  department,
  users,
  manager,
  onEdit,
  onDelete,
  onViewUsers,
  isDark: isDarkProp,
}: DepartmentCardProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = isDarkProp ?? themeIsDark;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDark
          ? "border-slate-700 bg-slate-800/30"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <h3
              className={`text-lg font-bold truncate ${
                isDark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {department.name}
            </h3>
          </div>
          {department.description && (
            <p
              className={`text-xs mt-1 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {department.description}
            </p>
          )}
        </div>
      </div>

      {/* Manager Section */}
      {manager ? (
        <div
          className={`rounded-lg border p-2 mb-3 ${
            isDark
              ? "border-blue-700/50 bg-blue-950/30"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">👑</span>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[10px] font-semibold uppercase ${
                  isDark ? "text-blue-300" : "text-blue-700"
                }`}
              >
                Manager
              </div>
              <div
                className={`text-xs font-semibold truncate ${
                  isDark ? "text-blue-200" : "text-blue-900"
                }`}
              >
                {manager.fullName}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-lg border p-2 mb-3 ${
            isDark
              ? "border-amber-700/50 bg-amber-950/30"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <div
              className={`text-xs ${
                isDark ? "text-amber-300" : "text-amber-700"
              }`}
            >
              No manager assigned
            </div>
          </div>
        </div>
      )}

      {/* Users Count */}
      <div
        className={`text-xs mb-3 ${
          isDark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        <strong>{users.length}</strong> user(s)
      </div>

      {/* Users List Preview */}
      {users.length > 0 && (
        <div
          className={`rounded border p-2 mb-3 max-h-24 overflow-y-auto ${
            isDark
              ? "border-slate-700 bg-slate-900/30"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          {users.slice(0, 5).map((u) => {
            const roleConfig = getRoleConfig(u.role);
            return (
              <div
                key={u.id}
                className={`flex items-center gap-2 text-xs py-0.5 ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold bg-gradient-to-br ${roleConfig.color} text-white`}
                >
                  {u.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{u.fullName}</span>
                <span
                  className={`text-[9px] px-1 rounded ${
                    isDark ? "bg-slate-700" : "bg-slate-200"
                  }`}
                >
                  {roleConfig.icon}
                </span>
              </div>
            );
          })}
          {users.length > 5 && (
            <div
              className={`text-[10px] ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              +{users.length - 5} more
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1">
        {onViewUsers && (
          <button
            onClick={() => onViewUsers(department)}
            className={`flex-1 px-2 py-1.5 text-xs rounded ${
              isDark
                ? "bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            👥 View Users
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(department)}
            className={`flex-1 px-2 py-1.5 text-xs rounded ${
              isDark
                ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            ✏️ Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(department)}
            className="flex-1 px-2 py-1.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
}
