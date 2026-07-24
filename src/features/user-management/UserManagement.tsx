//src/features/user-management/UserManagement.tsx

import { useState } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useUserManagement } from "./hooks/useUserManagement";
import {
  UserManagementTabs,
  UsersTab,
  DepartmentsTab,
  type UserManagementTab,
} from "./ui";
import { PermissionManager } from "./PermissionManager";
import { UserModal } from "./ui/users/modals/UserModal";
import { DepartmentModal } from "./ui/departments/modals/DepartmentModal";
import { UserElementAccessModal } from "./ui/users/modals/UserElementAccessModal";
import { DepartmentUsersModal } from "./ui/departments/modals/DepartmentUsersModal";

export function UserManagement() {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();

  const {
    nonAdminUsers,
    departments,
    loading,
    showUserModal,
    setShowUserModal,
    editingUser,
    setEditingUser,
    showDepartmentModal,
    setShowDepartmentModal,
    editingDepartment,
    setEditingDepartment,
    showElementAccessModal,
    setShowElementAccessModal,
    userForElementAccess,
    showDeptUsersModal,
    setShowDeptUsersModal,
    selectedDeptUsers,
    handleCreateUser,
    handleEditUser,
    handleSaveUser,
    handleDeleteUser,
    handleOpenElementAccess,
    handleSaveElementAccess,
    handleCreateDepartment,
    handleEditDepartment,
    handleDeleteDepartment,
    handleSaveDepartment,
    handleViewDepartmentUsers,
    getDepartmentManager,
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState<UserManagementTab>("users");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1
          className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          {activeTab === "users" && "👥 Users"}
          {activeTab === "departments" && "🏢 Departments"}
          {activeTab === "permissions" && "🔐 Permission Manager"}
        </h1>
      </div>

      {/* Tabs */}
      <UserManagementTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "users" && (
        <UsersTab
          users={nonAdminUsers}
          loading={loading}
          currentUserId={currentUser?.id}
          onAddUser={handleCreateUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onElementAccess={handleOpenElementAccess}
          departments={departments}
        />
      )}

      {activeTab === "departments" && (
        <DepartmentsTab
          departments={departments}
          users={[]} // اگر UsersTab به لیست کل کاربران نیاز ندارد، این را خالی بگذارید یا از هوک بگیرید
          loading={loading}
          onAddDepartment={handleCreateDepartment}
          onEditDepartment={handleEditDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          onViewUsers={handleViewDepartmentUsers}
          getDepartmentManager={getDepartmentManager}
        />
      )}

      {activeTab === "permissions" && <PermissionManager />}

      {/* Modals */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          departments={departments}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}

      {showDepartmentModal && (
        <DepartmentModal
          department={editingDepartment}
          users={[]} // در صورت نیاز به لیست کاربران برای نمایش در مودال، از هوک بگیرید
          onClose={() => {
            setShowDepartmentModal(false);
            setEditingDepartment(null);
          }}
          onSave={handleSaveDepartment}
        />
      )}

      {showElementAccessModal && userForElementAccess && (
        <UserElementAccessModal
          user={userForElementAccess}
          isOpen={true}
          onClose={() => {
            setShowElementAccessModal(false);
          }}
          onSave={handleSaveElementAccess}
        />
      )}

      {showDeptUsersModal && (
        <DepartmentUsersModal
          isOpen={true}
          onClose={() => setShowDeptUsersModal(false)}
          departmentName={selectedDeptUsers.name}
          users={selectedDeptUsers.users}
          manager={
            selectedDeptUsers.users.find((u) => u.role === "manager") || null
          }
        />
      )}
    </div>
  );
}
