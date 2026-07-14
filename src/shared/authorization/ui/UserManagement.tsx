// src/shared/authorization/ui/UserManagement.tsx

import { useState, useEffect } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import { useAuth } from "@features/auth/hooks/useAuth";
import { authService } from "@features/auth/services/AuthService";
import { userService } from "../services/UserService";
import { departmentService } from "../services/DepartmentService";
import { permissionMappingService } from "../services/PermissionMappingService";
import type {
  DBUser,
  DBDepartment,
  DBPermissionMapping,
} from "@shared/database/types";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";

// Import کامپوننت‌های فاز ۱ و ۲
import {
  UserManagementTabs,
  UsersTab,
  DepartmentsTab,
  type UserManagementTab,
} from "./user-management";

// Import مودال‌ها
import { PermissionManager } from "./PermissionManager";
import { UserModal } from "./user-management/users/modals/UserModal";
import { DepartmentModal } from "./user-management/departments/modals/DepartmentModal";
import { UserElementAccessModal } from "./user-management/users/modals/UserElementAccessModal";
import { DepartmentUsersModal } from "./user-management/departments/modals/DepartmentUsersModal";

export function UserManagement() {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();

  // ═══════════════════════════════════════════════════════════════════
  // 📦 State
  // ═══════════════════════════════════════════════════════════════════

  const [activeTab, setActiveTab] = useState<UserManagementTab>("users");
  const [users, setUsers] = useState<DBUser[]>([]);
  const [departments, setDepartments] = useState<DBDepartment[]>([]);
  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  // Modals State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DBDepartment | null>(null);

  // 🔧 NEW: Element Access Modal
  const [showElementAccessModal, setShowElementAccessModal] = useState(false);
  const [userForElementAccess, setUserForElementAccess] =
    useState<DBUser | null>(null);

  const [showDeptUsersModal, setShowDeptUsersModal] = useState(false);
  const [selectedDeptUsers, setSelectedDeptUsers] = useState<{
    name: string;
    users: DBUser[];
  }>({ name: "", users: [] });

  // ═══════════════════════════════════════════════════════════════════
  // 🔄 Data Loading
  // ═══════════════════════════════════════════════════════════════════

  const loadData = async () => {
    setLoading(true);
    try {
      const [dbUsers, dbDepartments, dbMappings] = await Promise.all([
        userService.getAllUsers(),
        departmentService.getAll(),
        permissionMappingService.getAll(),
      ]);
      setUsers(dbUsers as DBUser[]);
      setDepartments(dbDepartments);
      const mappingsMap = new Map<string, DBPermissionMapping>(
        dbMappings.map((m) => [m.permission, m]),
      );
      setMappings(mappingsMap);
    } catch (error: any) {
      console.error("[UserManagement] Failed to load:", error);
      showToast("error", "Load Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // 🔧 Helper Functions
  // ═══════════════════════════════════════════════════════════════════

  const syncSessionIfNeeded = (updatedUser: DBUser) => {
    if (currentUser?.id === updatedUser.id) {
      authService.updateCurrentUser({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        department: updatedUser.department,
        customPermissions: updatedUser.customPermissions || [],
      });
    }
  };

  const getDepartmentManager = (departmentId: string): DBUser | null => {
    return (
      users.find(
        (u) => u.department === departmentId && u.role === "manager",
      ) || null
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 User Handlers
  // ═══════════════════════════════════════════════════════════════════

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: DBUser) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = async (formData: any) => {
    try {
      if (editingUser) {
        const updated = await userService.updateUser(editingUser.id, formData);
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? (updated as DBUser) : u)),
        );
        syncSessionIfNeeded(updated as DBUser);
        showToast("success", "Updated", `User "${updated.fullName}" updated`);
      } else {
        const created = await userService.createUser({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          status: formData.status,
          customPermissions: [],
        });
        setUsers((prev) => [...prev, created as DBUser]);
        showToast("success", "Created", `User "${created.fullName}" created`);
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error: any) {
      showToast("error", "Save Failed", error.message);
    }
  };

  const handleDeleteUser = async (user: DBUser) => {
    if (user.id === currentUser?.id) {
      showToast("error", "Cannot Delete", "You cannot delete your own account");
      return;
    }

    const dependencies: string[] = [];
    if (user.role === "manager" && user.department) {
      const dept = departments.find((d) => d.id === user.department);
      if (dept) dependencies.push(`👑 Manager of "${dept.name}" department`);
    }

    if (dependencies.length > 0) {
      let message = `❌ Cannot delete "${user.fullName}"\n\nThis user has active dependencies:\n\n`;
      dependencies.forEach((dep) => {
        message += `${dep}\n`;
      });
      message += `\n⚠️ Please resolve these dependencies before deleting this user.`;
      showToast("error", "Cannot Delete User", message);
      return;
    }

    const confirmed = await confirmDialog({
      title: "Delete User",
      message: `Are you sure you want to delete "${user.fullName}"?`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await userService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast("success", "Deleted", `User "${user.fullName}" deleted`);
    } catch (error: any) {
      showToast("error", "Delete Failed", error.message);
    }
  };

  // 🔧 NEW: Element Access Handlers
  const handleOpenElementAccess = (user: DBUser) => {
    setUserForElementAccess(user);
    setShowElementAccessModal(true);
  };

  const handleSaveElementAccess = async (customPermissions: string[]) => {
    if (!userForElementAccess) return;
    try {
      const updated = await userService.updateUser(userForElementAccess.id, {
        customPermissions,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? (updated as DBUser) : u)),
      );
      syncSessionIfNeeded(updated as DBUser);
      showToast(
        "success",
        "Saved",
        `Element access updated for "${userForElementAccess.fullName}"`,
      );
      setShowElementAccessModal(false);
      setUserForElementAccess(null);
    } catch (error: any) {
      showToast("error", "Save Failed", error.message);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 Department Handlers
  // ═══════════════════════════════════════════════════════════════════

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department: DBDepartment) => {
    setEditingDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleDeleteDepartment = async (department: DBDepartment) => {
    const relatedUsers = users.filter((u) => u.department === department.id);
    if (relatedUsers.length > 0) {
      let message = `❌ Cannot delete "${department.name}"\n\nThis department has ${relatedUsers.length} user(s):\n\n`;
      relatedUsers.slice(0, 5).forEach((u) => {
        message += `• ${u.fullName} (@${u.username})\n`;
      });
      if (relatedUsers.length > 5)
        message += `... and ${relatedUsers.length - 5} more\n`;
      message += `\n⚠️ To delete this department, you must first reassign or remove all users.`;
      showToast("error", "Cannot Delete Department", message);
      return;
    }
    const confirmed = await confirmDialog({
      title: "Delete Department",
      message: `Are you sure you want to delete "${department.name}"?`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await departmentService.delete(department.id);
      setDepartments((prev) => prev.filter((d) => d.id !== department.id));
      showToast(
        "success",
        "Deleted",
        `Department "${department.name}" deleted`,
      );
    } catch (error: any) {
      showToast("error", "Delete Failed", error.message);
    }
  };

  const handleSaveDepartment = async (formData: any) => {
    try {
      if (editingDepartment) {
        const updated = await departmentService.update(
          editingDepartment.id,
          formData,
        );
        setDepartments((prev) =>
          prev.map((d) => (d.id === updated.id ? updated : d)),
        );
        showToast("success", "Updated", `Department "${updated.name}" updated`);
      } else {
        const created = await departmentService.create({
          name: formData.name,
          description: formData.description,
        });
        setDepartments((prev) => [...prev, created]);
        showToast("success", "Created", `Department "${created.name}" created`);
      }
      setShowDepartmentModal(false);
      setEditingDepartment(null);
    } catch (error: any) {
      showToast("error", "Save Failed", error.message);
    }
  };

  const handleViewDepartmentUsers = (department: DBDepartment) => {
    const deptUsers = users.filter((u) => u.department === department.id);
    setSelectedDeptUsers({ name: department.name, users: deptUsers });
    setShowDeptUsersModal(true);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🧮 Computed Values
  // ═══════════════════════════════════════════════════════════════════

  const nonAdminUsers = users.filter((u) => u.role !== "admin");

  // ═══════════════════════════════════════════════════════════════════
  // 🎨 Render
  // ═══════════════════════════════════════════════════════════════════

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
          users={users}
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
          users={users}
          onClose={() => {
            setShowDepartmentModal(false);
            setEditingDepartment(null);
          }}
          onSave={handleSaveDepartment}
        />
      )}

      {/* 🔧 NEW: Element Access Modal */}
      {showElementAccessModal && userForElementAccess && (
        <UserElementAccessModal
          user={userForElementAccess}
          isOpen={true}
          onClose={() => {
            setShowElementAccessModal(false);
            setUserForElementAccess(null);
          }}
          onSave={handleSaveElementAccess}
        />
      )}

      {showDeptUsersModal && (
        <DepartmentUsersModal
          isOpen={true}
          onClose={() => {
            setShowDeptUsersModal(false);
            setSelectedDeptUsers({ name: "", users: [] });
          }}
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
