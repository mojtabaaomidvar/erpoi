// src/shared/authorization/ui/user-management/users/components/UserRow.tsx

import { useMemo } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import type { User } from "@/shared/authorization";
import { getRoleConfig } from "@/shared/authorization/config/RoleConfig";
import type { Department } from "@shared/authorization";

interface UserRowProps {
  user: User;
  isDark?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onAssignPermissions?: (user: User) => void;
  onElementAccess?: (user: User) => void;
  isCurrentUser?: boolean;
  departments?: Department[];
}

export function UserRow({
  user,
  isDark: isDarkProp,
  onEdit,
  onDelete,
  onAssignPermissions,
  onElementAccess,
  isCurrentUser = false,
  departments = [],
}: UserRowProps) {
  const { isDark: themeIsDark } = useTheme();
  const isDark = isDarkProp ?? themeIsDark;

  const roleConfig = getRoleConfig(user.role);

  const departmentName = useMemo(() => {
    if (!user.department) return "-";
    const dept = departments.find((d) => d.id === user.department);
    return dept?.name || user.department;
  }, [user.department, departments]);

  return (
    <tr className={isDark ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}>
      {/* User Info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br ${roleConfig.color} text-white`}
          >
            {user.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <div
              className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              {user.fullName}
              {isCurrentUser && (
                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  YOU
                </span>
              )}
            </div>
            <div
              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              @{user.username}
            </div>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <span
          className={`text-xs px-2 py-1 rounded capitalize bg-gradient-to-r ${roleConfig.color} text-white font-semibold inline-flex items-center gap-1`}
        >
          {roleConfig.icon} {roleConfig.label}
        </span>
      </td>

      {/* Department */}
      <td
        className={`px-4 py-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
      >
        {departmentName}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex gap-1 justify-end flex-wrap">
          {onElementAccess && (
            <button
              onClick={() => onElementAccess(user)}
              className={`px-2 py-1 text-xs rounded ${isDark ? "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50" : "bg-purple-100 text-purple-700 hover:bg-purple-200"}`}
              title="Element Access"
            >
              🎯
            </button>
          )}
          {onAssignPermissions && (
            <button
              onClick={() => onAssignPermissions(user)}
              className={`px-2 py-1 text-xs rounded ${isDark ? "bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50" : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"}`}
              title="Assign Permissions"
            >
              🔐
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className={`px-2 py-1 text-xs rounded ${isDark ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(user)}
              disabled={isCurrentUser}
              className={`px-2 py-1 text-xs rounded ${
                isCurrentUser
                  ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400"
                  : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
              }`}
            >
              🗑️
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
