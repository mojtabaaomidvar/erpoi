// src/shared/authorization/ui/user-management/users/components/UserTable.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser } from "@shared/database/types";
import { UserRow } from "./UserRow";
import { TableSkeleton } from "../skeletons/TableSkeleton";
import type { Department } from "@shared/authorization";

interface UserTableProps {
  users: DBUser[];
  loading?: boolean;
  currentUserId?: string;
  onEdit?: (user: DBUser) => void;
  onDelete?: (user: DBUser) => void;
  onElementAccess?: (user: DBUser) => void;
  departments?: Department[];
}

export function UserTable({
  users,
  loading = false,
  currentUserId,
  onEdit,
  onDelete,
  onElementAccess,
  departments,
}: UserTableProps) {
  const { isDark } = useTheme();

  if (loading) {
    return <TableSkeleton isDark={isDark} />;
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isDark ? "border-slate-700" : "border-slate-200"
      }`}
    >
      <table className="w-full">
        <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
          <tr>
            <th
              className={`px-4 py-3 text-left text-xs font-semibold ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              User
            </th>
            <th
              className={`px-4 py-3 text-left text-xs font-semibold ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Role
            </th>
            <th
              className={`px-4 py-3 text-left text-xs font-semibold ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Department
            </th>

            <th
              className={`px-4 py-3 text-right text-xs font-semibold ${
                isDark ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          className={`divide-y ${isDark ? "divide-slate-700" : "divide-slate-200"}`}
        >
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center">
                <div className="text-4xl mb-2">👤</div>
                <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                  No users found
                </p>
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
                onElementAccess={onElementAccess}
                departments={departments}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
