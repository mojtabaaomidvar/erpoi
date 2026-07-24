//src/features/user-management/hooks/useUserManagement.ts

import { useState, useEffect, useCallback } from "react";
import { userAppService, departmentAppService, type User, type Department } from "@/shared/authorization";
import { authAppService } from "@/features/auth";
import { showToast } from "@shared/ui/ToastContainer";
import { confirmDialog } from "@shared/ui/ConfirmDialog";
import { useAuth } from "@features/auth/hooks/useAuth";

export function useUserManagement() {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [showElementAccessModal, setShowElementAccessModal] = useState(false);
  const [userForElementAccess, setUserForElementAccess] = useState<User | null>(null);
  const [showDeptUsersModal, setShowDeptUsersModal] = useState(false);
  const [selectedDeptUsers, setSelectedDeptUsers] = useState<{ name: string; users: User[] }>({ name: "", users: [] });

  // ═══════════════════════════════════════
  // 🔄 Data Loading
  // ═══════════════════════════════════════
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedDepartments] = await Promise.all([
        userAppService.getAllUsers(),
        departmentAppService.getAll(),
      ]);
      setUsers(fetchedUsers);
      setDepartments(fetchedDepartments);
    } catch (error: any) {
      console.error("[useUserManagement] Failed to load:", error);
      showToast("error", "Load Failed", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ═══════════════════════════════════════
  // 🔧 Helpers
  // ═══════════════════════════════════════
  const syncSessionIfNeeded = useCallback((updatedUser: User) => {
    if (currentUser?.id === updatedUser.id) {
      authAppService.updateCurrentUser({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        department: updatedUser.department,
        customPermissions: updatedUser.customPermissions || [],
      });
    }
  }, [currentUser?.id]);

  const getDepartmentManager = useCallback((departmentId: string): User | null => {
    return users.find((u) => u.department === departmentId && u.role === "manager") || null;
  }, [users]);

  // ═══════════════════════════════════════
  // 👤 User Handlers
  // ═══════════════════════════════════════
  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleSaveUser = async (formData: any) => {
    try {
      if (editingUser) {
        const updated = await userAppService.updateUser(editingUser.id, formData);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        syncSessionIfNeeded(updated);
        showToast("success", "Updated", `User "${updated.fullName}" updated`);
      } else {
        const created = await userAppService.createUser({
          ...formData,
          customPermissions: formData.customPermissions || [],
        });
        setUsers((prev) => [...prev, created]);
        showToast("success", "Created", `User "${created.fullName}" created`);
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error: any) {
      showToast("error", "Save Failed", error.message);
    }
  };

  const handleDeleteUser = async (user: User) => {
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
      showToast("error", "Cannot Delete User", `❌ Cannot delete "${user.fullName}"\n\nThis user has active dependencies:\n${dependencies.join("\n")}\n\n⚠️ Please resolve these dependencies first.`);
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
      await userAppService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast("success", "Deleted", `User "${user.fullName}" deleted`);
    } catch (error: any) {
      showToast("error", "Delete Failed", error.message);
    }
  };

  const handleOpenElementAccess = (user: User) => {
    setUserForElementAccess(user);
    setShowElementAccessModal(true);
  };

  const handleSaveElementAccess = async (customPermissions: string[]) => {
    if (!userForElementAccess) return;
    try {
      const updated = await userAppService.updateUser(userForElementAccess.id, { customPermissions });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      syncSessionIfNeeded(updated);
      showToast("success", "Saved", `Element access updated for "${userForElementAccess.fullName}"`);
      setShowElementAccessModal(false);
      setUserForElementAccess(null);
    } catch (error: any) {
      showToast("error", "Save Failed", error.message);
    }
  };

  // ═══════════════════════════════════════
  // 🏢 Department Handlers
  // ═══════════════════════════════════════
  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleDeleteDepartment = async (department: Department) => {
    const relatedUsers = users.filter((u) => u.department === department.id);
    if (relatedUsers.length > 0) {
      showToast("error", "Cannot Delete Department", `❌ Cannot delete "${department.name}"\n\nThis department has ${relatedUsers.length} user(s). Please reassign or remove them first.`);
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
      await departmentAppService.delete(department.id);
      setDepartments((prev) => prev.filter((d) => d.id !== department.id));
      showToast("success", "Deleted", `Department "${department.name}" deleted`);
    } catch (error: any) {
      showToast("error", "Delete Failed", error.message);
    }
  };

  const handleSaveDepartment = async (formData: any) => {
    try {
      if (editingDepartment) {
        const updated = await departmentAppService.update(editingDepartment.id, formData);
        setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        showToast("success", "Updated", `Department "${updated.name}" updated`);
      } else {
        const created = await departmentAppService.create({
          name: formData.name,
          description: formData.description || "",
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

  const handleViewDepartmentUsers = (department: Department) => {
    const deptUsers = users.filter((u) => u.department === department.id);
    setSelectedDeptUsers({ name: department.name, users: deptUsers });
    setShowDeptUsersModal(true);
  };

  // ═══════════════════════════════════════
  // 🧮 Computed Values
  // ═══════════════════════════════════════
  const nonAdminUsers = users.filter((u) => u.role !== "admin");

  return {
    // State
    users,
    departments,
    nonAdminUsers,
    loading,
    
    // Modal States
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
    setUserForElementAccess,
    showDeptUsersModal,
    setShowDeptUsersModal,
    selectedDeptUsers,
    setSelectedDeptUsers,

    // Handlers
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
    loadData,
  };
}