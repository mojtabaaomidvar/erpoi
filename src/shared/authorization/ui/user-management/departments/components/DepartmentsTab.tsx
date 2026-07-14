// src/shared/authorization/ui/user-management/components/DepartmentsTab.tsx

import { Button } from "@design-system";
import { useTheme } from "@app/providers/ThemeProvider";
import type { DBUser, DBDepartment } from "@shared/database/types";
import { DepartmentCard } from "./DepartmentCard";
import { DepartmentCardSkeleton } from "../skeletons/DepartmentCardSkeleton";

interface DepartmentsTabProps {
  departments: DBDepartment[];
  users: DBUser[];
  loading?: boolean;
  onAddDepartment: () => void;
  onEditDepartment: (department: DBDepartment) => void;
  onDeleteDepartment: (department: DBDepartment) => void;
  onViewUsers?: (department: DBDepartment) => void;
  getDepartmentManager: (departmentId: string) => DBUser | null;
}

export function DepartmentsTab({
  departments,
  users,
  loading = false,
  onAddDepartment,
  onEditDepartment,
  onDeleteDepartment,
  onViewUsers,
  getDepartmentManager,
}: DepartmentsTabProps) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2
          className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Departments ({departments.length})
        </h2>
        <Button
          onClick={onAddDepartment}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <span>➕</span>
          <span>New Department</span>
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <DepartmentCardSkeleton key={i} isDark={isDark} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-5xl mb-3">🏢</div>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>
                No departments found
              </p>
            </div>
          ) : (
            departments.map((department) => {
              const relatedUsers = users.filter(
                (u) => u.department === department.id,
              );
              const manager = getDepartmentManager(department.id);

              return (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  users={relatedUsers}
                  manager={manager}
                  onEdit={onEditDepartment}
                  onDelete={onDeleteDepartment}
                  onViewUsers={onViewUsers}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
