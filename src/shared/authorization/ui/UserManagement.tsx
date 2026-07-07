// src/shared/authorization/ui/UserManagement.tsx

import { useState, useEffect, useCallback } from "react";
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
import { PermissionManager } from "./PermissionManager";
import { UserModal } from "./modals/UserModal";
import { DepartmentModal } from "./modals/DepartmentModal";
import { UserPermissionsModal } from "./modals/UserPermissionsModal";

// ═══════════════════════════════════════
// 🔧 FIX: تعریف کامپوننت‌ها خارج از render
// ═══════════════════════════════════════

interface TableSkeletonProps {
  isDark: boolean;
}

function TableSkeleton({ isDark }: TableSkeletonProps) {
  return (
    <div
      className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-700" : "border-slate-200"}`}
    >
      <table className="w-full">
        <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold">User</th>
            <th className="px-4 py-3 text-left text-xs font-semibold">
              Position
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold">
              Department
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold">
              Custom Perms
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold">
              Actions
            </th>
          </tr>
        </thead>
        <tbody
          className={`divide-y ${isDark ? "divide-slate-700" : "divide-slate-200"}`}
        >
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                  />
                  <div className="space-y-2">
                    <div
                      className={`h-4 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                    />
                    <div
                      className={`h-3 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-6 w-20 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-4 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-6 w-16 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
              <td className="px-4 py-3">
                <div
                  className={`h-8 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DepartmentCardSkeletonProps {
  isDark: boolean;
}

function DepartmentCardSkeleton({ isDark }: DepartmentCardSkeletonProps) {
  return (
    <div
      className={`rounded-xl border p-4 animate-pulse ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-8 h-8 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        />
      </div>
      <div
        className={`h-4 w-24 rounded mb-3 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
      />
      <div
        className={`h-20 w-full rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
      />
    </div>
  );
}

// ═══════════════════════════════════════
// 🎯 کامپوننت اصلی
// ═══════════════════════════════════════

type Tab = "users" | "departments" | "permissions";

const tabs: Array<{
  key: Tab;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    key: "users",
    label: "Users",
    icon: "👤",
    description: "Manage user accounts and access",
  },
  {
    key: "departments",
    label: "Departments",
    icon: "🏢",
    description: "Manage organizational departments",
  },
  {
    key: "permissions",
    label: "Permissions",
    icon: "🔐",
    description: "Define which UI elements each permission can access",
  },
];

export function UserManagement() {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [users, setUsers] = useState<DBUser[]>([]);
  const [departments, setDepartments] = useState<DBDepartment[]>([]);
  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DBDepartment | null>(null);
  const [showUserPermissionsModal, setShowUserPermissionsModal] =
    useState(false);
  const [userForPermissions, setUserForPermissions] = useState<DBUser | null>(
    null,
  );

  // ═══════════════════════════════════════
  // 💾 Load Data از Supabase
  // ═══════════════════════════════════════

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

      console.log("[UserManagement] ✅ Loaded:", {
        users: dbUsers.length,
        departments: dbDepartments.length,
        mappings: dbMappings.length,
      });
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

  // ═══════════════════════════════════════
  // 🔧 Helper: Sync session after user update
  // ═══════════════════════════════════════

  const syncSessionIfNeeded = (updatedUser: DBUser) => {
    if (currentUser?.id === updatedUser.id) {
      console.log(
        "[UserManagement] 🔄 Syncing session for current user:",
        updatedUser.username,
      );
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

  // ═══════════════════════════════════════
  // 🎯 User Handlers
  // ═══════════════════════════════════════

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: DBUser) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (user: DBUser) => {
    if (user.id === currentUser?.id) {
      showToast("error", "Cannot Delete", "You cannot delete your own account");
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

  const handleAssignUserPermissions = (user: DBUser) => {
    setUserForPermissions(user);
    setShowUserPermissionsModal(true);
  };

  const handleSaveUserPermissions = async (permissions: string[]) => {
    if (!userForPermissions) return;
    try {
      const updated = await userService.updateUser(userForPermissions.id, {
        customPermissions: permissions,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? (updated as DBUser) : u)),
      );
      syncSessionIfNeeded(updated as DBUser);
      showToast(
        "success",
        "Saved",
        `Permissions updated for "${userForPermissions.fullName}"`,
      );
      setShowUserPermissionsModal(false);
      setUserForPermissions(null);
    } catch (error: any) {
      showToast("error", "Save Failed", error.message);
    }
  };

  // ═══════════════════════════════════════
  // 🎯 Department Handlers
  // ═══════════════════════════════════════

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
      const confirmed = await confirmDialog({
        title: "Delete Department",
        message: `"${department.name}" has ${relatedUsers.length} user(s). Delete anyway?`,
        confirmText: "Delete",
        variant: "danger",
      });
      if (!confirmed) return;
      try {
        for (const user of relatedUsers) {
          const updatedUser = await userService.updateUser(user.id, {
            department: "",
          });
          syncSessionIfNeeded(updatedUser as DBUser);
        }
        setUsers((prev) =>
          prev.map((u) =>
            u.department === department.id ? { ...u, department: "" } : u,
          ),
        );
      } catch (error: any) {
        showToast("error", "Error", error.message);
        return;
      }
    } else {
      const confirmed = await confirmDialog({
        title: "Delete Department",
        message: `Are you sure you want to delete "${department.name}"?`,
        confirmText: "Delete",
        variant: "danger",
      });
      if (!confirmed) return;
    }
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

  // ═══════════════════════════════════════
  // 🎯 Render
  // ═══════════════════════════════════════

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1
          className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          {activeTab === "users" && "👥 Users"}
          {activeTab === "departments" && "🏢 Departments"}
          {activeTab === "permissions" && "🔐 Permission Manager"}
        </h1>
      </div>

      <div
        className={`flex gap-1 p-1 rounded-lg w-fit ${isDark ? "bg-slate-900" : "bg-slate-100"}`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? isDark
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "bg-white text-slate-900 shadow-sm"
                : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2
              className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Users ({users.length})
            </h2>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>➕</span>
              <span>New User</span>
            </button>
          </div>

          {/* 🔧 FIX: استفاده از کامپوننت‌های خارج از render */}
          {loading ? (
            <TableSkeleton isDark={isDark} />
          ) : (
            <div
              className={`rounded-xl border overflow-hidden ${isDark ? "border-slate-700" : "border-slate-200"}`}
            >
              <table className="w-full">
                <thead className={isDark ? "bg-slate-800/50" : "bg-slate-50"}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      User
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Position
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Department
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Custom Perms
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
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
                        <p
                          className={
                            isDark ? "text-slate-400" : "text-slate-500"
                          }
                        >
                          No users found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const userDept = departments.find(
                        (d) => d.id === user.department,
                      );
                      return (
                        <tr
                          key={user.id}
                          className={
                            isDark
                              ? "hover:bg-slate-800/30"
                              : "hover:bg-slate-50"
                          }
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                                  isDark
                                    ? "bg-indigo-900/30 text-indigo-300"
                                    : "bg-indigo-100 text-indigo-700"
                                }`}
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
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded capitalize ${isDark ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-700"}`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-sm ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          >
                            {userDept?.name || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-1 rounded ${isDark ? "bg-cyan-900/30 text-cyan-300" : "bg-cyan-100 text-cyan-700"}`}
                            >
                              {user.customPermissions?.length || 0} custom
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 justify-end flex-wrap">
                              <button
                                onClick={() =>
                                  handleAssignUserPermissions(user)
                                }
                                className={`px-2 py-1 text-xs rounded ${isDark ? "bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50" : "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"}`}
                                title="Assign Permissions"
                              >
                                🔐
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className={`px-2 py-1 text-xs rounded ${isDark ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={user.id === currentUser?.id}
                                className={`px-2 py-1 text-xs rounded ${user.id === currentUser?.id ? "opacity-50 cursor-not-allowed bg-slate-200 text-slate-400" : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"}`}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Departments */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2
              className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}
            >
              Departments ({departments.length})
            </h2>
            <button
              onClick={handleCreateDepartment}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>➕</span>
              <span>New Department</span>
            </button>
          </div>

          {/* 🔧 FIX: استفاده از کامپوننت‌های خارج از render */}
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
                  return (
                    <div
                      key={department.id}
                      className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🏢</span>
                            <h3
                              className={`text-lg font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                            >
                              {department.name}
                            </h3>
                          </div>
                          {department.description && (
                            <p
                              className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                            >
                              {department.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className={`text-xs mb-3 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        <strong>{relatedUsers.length}</strong> user(s)
                      </div>
                      {relatedUsers.length > 0 && (
                        <div
                          className={`rounded border p-2 mb-3 max-h-24 overflow-y-auto ${isDark ? "border-slate-700 bg-slate-900/30" : "border-slate-200 bg-slate-50"}`}
                        >
                          {relatedUsers.slice(0, 5).map((u) => (
                            <div
                              key={u.id}
                              className={`flex items-center gap-2 text-xs py-0.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isDark ? "bg-indigo-900/30 text-indigo-300" : "bg-indigo-100 text-indigo-700"}`}
                              >
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate">{u.fullName}</span>
                            </div>
                          ))}
                          {relatedUsers.length > 5 && (
                            <div
                              className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}
                            >
                              +{relatedUsers.length - 5} more
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className={`flex-1 px-2 py-1.5 text-xs rounded ${isDark ? "bg-slate-700 text-slate-200 hover:bg-slate-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department)}
                          className="flex-1 px-2 py-1.5 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: Permissions */}
      {activeTab === "permissions" && <PermissionManager />}

      {/* مودال‌ها */}
      {showUserModal && (
        <UserModal
          user={editingUser}
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
      {showUserPermissionsModal && userForPermissions && (
        <UserPermissionsModal
          user={userForPermissions}
          onClose={() => {
            setShowUserPermissionsModal(false);
            setUserForPermissions(null);
          }}
          onSave={handleSaveUserPermissions}
        />
      )}
    </div>
  );
}
