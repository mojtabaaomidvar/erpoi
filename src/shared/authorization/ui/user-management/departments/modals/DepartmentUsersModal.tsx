// src/shared/authorization/ui/modals/DepartmentUsersModal.tsx

import { Modal, Badge } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser } from "@shared/database/types";
import { getRoleConfig } from "../../../../config/RoleConfig";

interface DepartmentUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName: string;
  users: DBUser[];
  manager: DBUser | null;
}

interface UserRowProps {
  user: DBUser;
  isDark: boolean;
}

function UserRow({ user, isDark }: UserRowProps) {
  const roleConfig = getRoleConfig(user.role);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
        isDark
          ? "border-slate-700 bg-slate-800/50 hover:border-slate-600"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
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
          </div>
          <div
            className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            @{user.username} • {user.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          tone={
            user.status === "active"
              ? "emerald"
              : user.status === "suspended"
                ? "danger"
                : "slate"
          }
          className="text-[9px]"
        >
          {user.status === "active"
            ? "✅ Active"
            : user.status === "suspended"
              ? "🚫 Suspended"
              : "⏸️ Inactive"}
        </Badge>
        <span
          className={`text-xs px-2 py-1 rounded capitalize bg-gradient-to-r ${roleConfig.color} text-white font-semibold inline-flex items-center gap-1`}
        >
          {roleConfig.icon} {roleConfig.label}
        </span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 🎯 کامپوننت اصلی
// ═══════════════════════════════════════

export function DepartmentUsersModal({
  isOpen,
  onClose,
  departmentName,
  users,
  manager,
}: DepartmentUsersModalProps) {
  const { isDark } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Users in ${departmentName}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Manager Section */}
        {manager && (
          <div>
            <h3
              className={`text-sm font-bold mb-2 flex items-center gap-2 ${
                isDark ? "text-slate-200" : "text-slate-700"
              }`}
            >
              <span>👑</span>
              <span>Department Manager</span>
            </h3>
            <div
              className={`p-3 rounded-xl border ${
                isDark
                  ? "bg-blue-950/20 border-blue-900/50"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              {/* 🔧 FIX: پاس دادن isDark به UserRow */}
              <UserRow user={manager} isDark={isDark} />
            </div>
          </div>
        )}

        {/* Users List */}
        <div>
          <h3
            className={`text-sm font-bold mb-2 flex items-center gap-2 ${
              isDark ? "text-slate-200" : "text-slate-700"
            }`}
          >
            <span>👥</span>
            <span>All Users ({users.length})</span>
          </h3>

          {users.length === 0 ? (
            <div
              className={`text-center py-8 text-sm ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              No users in this department
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <UserRow key={user.id} user={user} isDark={isDark} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
