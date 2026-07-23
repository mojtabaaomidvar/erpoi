// src/shared/authorization/ui/user-management/users/components/UsersTab.tsx

import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser } from "@shared/database/types";
import { UserTable } from "./UserTable";
import type { Department } from "@shared/authorization";

interface UsersTabProps {
  users: DBUser[];
  loading?: boolean;
  currentUserId?: string;
  onAddUser: () => void;
  onEditUser: (user: DBUser) => void;
  onDeleteUser: (user: DBUser) => void;
  onElementAccess: (user: DBUser) => void;
  departments?: Department[];
}

export function UsersTab({
  users,
  loading = false,
  currentUserId,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onElementAccess,
  departments,
}: UsersTabProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2
          className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Users ({users.length})
        </h2>
        <Button
          onClick={onAddUser}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>New User</span>
        </Button>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        loading={loading}
        currentUserId={currentUserId}
        onEdit={onEditUser}
        onDelete={onDeleteUser}
        onElementAccess={onElementAccess}
        departments={departments}
      />
    </div>
  );
}
