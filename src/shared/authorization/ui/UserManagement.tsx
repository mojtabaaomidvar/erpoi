// src/shared/authorization/ui/UserManagement.tsx

import { useState, useEffect } from 'react';
import { useTheme } from '@app/providers/ThemeProvider';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDB } from '@shared/database';
import type { DBUser, DBRole, DBDepartment } from '@shared/database/types';
import { showToast } from '@shared/ui/ToastContainer';
import { confirmDialog } from '@shared/ui/ConfirmDialog';
import { PermissionManager } from './PermissionManager';
import { UserModal } from './modals/UserModal';
import { RoleModal } from './modals/RoleModal';
import { DepartmentModal } from './modals/DepartmentModal';
import { UserPermissionsModal } from './modals/UserPermissionsModal';
import { RolePermissionsModal } from './modals/RolePermissionsModal';

type Tab = 'users' | 'roles' | 'departments' | 'permissions';

const tabs: Array<{ key: Tab; label: string; icon: string; description: string }> = [
  { key: 'users', label: 'Users', icon: '👤', description: 'Manage user accounts and access' },
  { key: 'roles', label: 'Roles', icon: '🎭', description: 'Define roles and assign permissions' },
  { key: 'departments', label: 'Departments', icon: '🏢', description: 'Manage organizational departments' },
  { key: 'permissions', label: 'Permissions', icon: '🔐', description: 'Define which UI elements each permission can access' },
];

export function UserManagement() {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<DBUser[]>([]);
  const [roles, setRoles] = useState<DBRole[]>([]);
  const [departments, setDepartments] = useState<DBDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State های مودال‌ها
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DBUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<DBRole | null>(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DBDepartment | null>(null);
  const [showUserPermissionsModal, setShowUserPermissionsModal] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState<DBUser | null>(null);
  const [showRolePermissionsModal, setShowRolePermissionsModal] = useState(false);
  const [roleForPermissions, setRoleForPermissions] = useState<DBRole | null>(null);

  const currentTab = tabs.find(t => t.key === activeTab)!;

  // ═══════════════════════════════════════
  // 💾 Load Data
  // ═══════════════════════════════════════

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await getDB();
      setUsers(await db.getAllUsers());
      setRoles(await db.getAllRoles());
      setDepartments(await db.getAllDepartments());
    } catch (error: any) {
      console.error('Failed to load:', error);
      showToast('error', 'Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      showToast('error', 'Cannot Delete', 'You cannot delete your own account');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete "${user.fullName}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const db = await getDB();
      await db.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast('success', 'Deleted', `User "${user.fullName}" deleted`);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.message);
    }
  };

  const handleSaveUser = async (formData: any) => {
    try {
      const db = await getDB();
      
      if (editingUser) {
        const updated = await db.updateUser(editingUser.id, formData);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        showToast('success', 'Updated', `User "${updated.fullName}" updated`);
      } else {
        const created = await db.createUser({
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          status: formData.status,
        });
        setUsers(prev => [...prev, created]);
        showToast('success', 'Created', `User "${created.fullName}" created`);
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message);
    }
  };

  const handleAssignUserPermissions = (user: DBUser) => {
    setUserForPermissions(user);
    setShowUserPermissionsModal(true);
  };

  const handleSaveUserPermissions = async (permissions: string[]) => {
    if (!userForPermissions) return;
    
    try {
      const db = await getDB();
      const updated = await db.updateUser(userForPermissions.id, { customPermissions: permissions });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      showToast('success', 'Saved', `Permissions updated for "${userForPermissions.fullName}"`);
      setShowUserPermissionsModal(false);
      setUserForPermissions(null);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message);
    }
  };

  // ═══════════════════════════════════════
  // 🎯 Role Handlers
  // ═══════════════════════════════════════

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: DBRole) => {
    setEditingRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (role: DBRole) => {
    if (role.isSystem) {
      showToast('error', 'Cannot Delete', 'System roles cannot be deleted');
      return;
    }

    const confirmed = await confirmDialog({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.displayName}"?`,
      confirmText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      const db = await getDB();
      await db.deleteRole(role.id);
      setRoles(prev => prev.filter(r => r.id !== role.id));
      showToast('success', 'Deleted', `Role "${role.displayName}" deleted`);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.message);
    }
  };

  const handleSaveRole = async (formData: any) => {
    try {
      const db = await getDB();
      
      if (editingRole) {
        const updated = await db.updateRole(editingRole.id, formData);
        setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
        showToast('success', 'Updated', `Role "${updated.displayName}" updated`);
      } else {
        const created = await db.createRole({
          name: formData.name,
          displayName: formData.displayName,
          description: formData.description,
          permissions: formData.permissions || [],
          isSystem: false,
        });
        setRoles(prev => [...prev, created]);
        showToast('success', 'Created', `Role "${created.displayName}" created`);
      }
      setShowRoleModal(false);
      setEditingRole(null);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message);
    }
  };

  const handleAssignRolePermissions = (role: DBRole) => {
    setRoleForPermissions(role);
    setShowRolePermissionsModal(true);
  };

  const handleSaveRolePermissions = async (permissions: string[]) => {
    if (!roleForPermissions) return;
    
    try {
      const db = await getDB();
      const updated = await db.updateRole(roleForPermissions.id, { permissions });
      setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
      showToast('success', 'Saved', `Permissions updated for "${roleForPermissions.displayName}"`);
      setShowRolePermissionsModal(false);
      setRoleForPermissions(null);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message);
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
    // 🔧 FIX: چک کردن اگه کاربری در این department هست
    const relatedUsers = users.filter(u => u.department === department.id);
    
    if (relatedUsers.length > 0) {
      const confirmed = await confirmDialog({
        title: 'Delete Department',
        message: `"${department.name}" has ${relatedUsers.length} user(s). Are you sure you want to delete it? Users will be unassigned from this department.`,
        confirmText: 'Delete',
        variant: 'danger',
      });
      
      if (!confirmed) return;
      
      // 🔧 FIX: حذف department از کاربران مرتبط
      try {
        const db = await getDB();
        for (const user of relatedUsers) {
          await db.updateUser(user.id, { department: '' });
        }
        setUsers(prev => prev.map(u => u.department === department.id ? { ...u, department: '' } : u));
      } catch (error: any) {
        showToast('error', 'Error', error.message);
        return;
      }
    } else {
      const confirmed = await confirmDialog({
        title: 'Delete Department',
        message: `Are you sure you want to delete "${department.name}"?`,
        confirmText: 'Delete',
        variant: 'danger',
      });
      
      if (!confirmed) return;
    }

    try {
      const db = await getDB();
      await db.deleteDepartment(department.id);
      setDepartments(prev => prev.filter(d => d.id !== department.id));
      showToast('success', 'Deleted', `Department "${department.name}" deleted`);
    } catch (error: any) {
      showToast('error', 'Delete Failed', error.message);
    }
  };

  const handleSaveDepartment = async (formData: any) => {
    try {
      const db = await getDB();
      
      if (editingDepartment) {
        const updated = await db.updateDepartment(editingDepartment.id, formData);
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        showToast('success', 'Updated', `Department "${updated.name}" updated`);
      } else {
        const created = await db.createDepartment({
          name: formData.name,
          description: formData.description,
        });
        setDepartments(prev => [...prev, created]);
        showToast('success', 'Created', `Department "${created.name}" created`);
      }
      setShowDepartmentModal(false);
      setEditingDepartment(null);
    } catch (error: any) {
      showToast('error', 'Save Failed', error.message);
    }
  };

  // ═══════════════════════════════════════
  // 🎯 Loading State
  // ═══════════════════════════════════════

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // 🎯 Render
  // ═══════════════════════════════════════

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            🛡️ User Management
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {currentTab.description}
          </p>
        </div>
      </div>

      <div className={`flex gap-1 p-1 rounded-lg w-fit ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? isDark ? 'bg-slate-800 text-slate-100 shadow-sm' : 'bg-white text-slate-900 shadow-sm'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Users ({users.length})
              </h2>
            </div>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>➕</span>
              <span>New User</span>
            </button>
          </div>

          <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <table className="w-full">
              <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>User</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Role</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Department</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Custom Perms</th>
                  <th className={`px-4 py-3 text-right text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
                {users.map(user => {
                  const userRole = roles.find(r => r.name === user.role);
                  const userDept = departments.find(d => d.id === user.department);
                  return (
                    <tr key={user.id} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                            isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {user.fullName}
                            </div>
                            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {userRole?.displayName || user.role}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {userDept?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {user.customPermissions?.length || 0} custom
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          <button
                            onClick={() => handleAssignUserPermissions(user)}
                            className={`px-2 py-1 text-xs rounded ${
                              isDark ? 'bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                            }`}
                            title="Assign Permissions"
                          >
                            🔐
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className={`px-2 py-1 text-xs rounded ${
                              isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            className={`px-2 py-1 text-xs rounded ${
                              user.id === currentUser?.id
                                ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Roles */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Roles ({roles.length})
              </h2>
            </div>
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>➕</span>
              <span>New Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => (
              <div
                key={role.id}
                className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {role.displayName}
                      </h3>
                      {role.isSystem && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                        }`}>
                          SYSTEM
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {role.description}
                    </p>
                  </div>
                </div>

                <div className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <strong>{role.permissions.length}</strong> permissions
                </div>

                <div className="flex flex-wrap gap-1 mb-3 max-h-20 overflow-y-auto">
                  {role.permissions.slice(0, 10).map(perm => (
                    <span
                      key={perm}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {perm}
                    </span>
                  ))}
                  {role.permissions.length > 10 && (
                    <span className={`text-[9px] px-1.5 py-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      +{role.permissions.length - 10} more
                    </span>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleAssignRolePermissions(role)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded ${
                      isDark ? 'bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/50' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                    }`}
                  >
                    🔐 Permissions
                  </button>
                  <button
                    onClick={() => handleEditRole(role)}
                    className={`flex-1 px-2 py-1.5 text-xs rounded ${
                      isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.isSystem}
                    className={`px-2 py-1.5 text-xs rounded ${
                      role.isSystem
                        ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-400'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔧 FIX: Tab: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Departments ({departments.length})
              </h2>
            </div>
            <button
              onClick={handleCreateDepartment}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <span>➕</span>
              <span>New Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(department => {
              const relatedUsers = users.filter(u => u.department === department.id);
              return (
                <div
                  key={department.id}
                  className={`rounded-xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏢</span>
                        <h3 className={`text-lg font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {department.name}
                        </h3>
                      </div>
                      {department.description && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {department.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <strong>{relatedUsers.length}</strong> user(s) in this department
                  </div>

                  {/* لیست کاربران مرتبط */}
                  {relatedUsers.length > 0 && (
                    <div className={`rounded border p-2 mb-3 max-h-24 overflow-y-auto ${
                      isDark ? 'border-slate-700 bg-slate-900/30' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div className="space-y-1">
                        {relatedUsers.slice(0, 5).map(user => (
                          <div key={user.id} className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate flex-1">{user.fullName}</span>
                          </div>
                        ))}
                        {relatedUsers.length > 5 && (
                          <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            +{relatedUsers.length - 5} more...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditDepartment(department)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded ${
                        isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(department)}
                      className={`flex-1 px-2 py-1.5 text-xs rounded ${
                        'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                      }`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Permissions */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div>
            
          </div>
          <PermissionManager />
        </div>
      )}

      {/* مودال‌ها */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          roles={roles}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }}
          onSave={handleSaveUser}
        />
      )}

      {showRoleModal && (
        <RoleModal
          role={editingRole}
          onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
          onSave={handleSaveRole}
        />
      )}

      {showDepartmentModal && (
        <DepartmentModal
          department={editingDepartment}
          users={users}
          onClose={() => { setShowDepartmentModal(false); setEditingDepartment(null); }}
          onSave={handleSaveDepartment}
        />
      )}

      {showUserPermissionsModal && userForPermissions && (
        <UserPermissionsModal
          user={userForPermissions}
          onClose={() => { setShowUserPermissionsModal(false); setUserForPermissions(null); }}
          onSave={handleSaveUserPermissions}
        />
      )}

      {showRolePermissionsModal && roleForPermissions && (
        <RolePermissionsModal
          role={roleForPermissions}
          onClose={() => { setShowRolePermissionsModal(false); setRoleForPermissions(null); }}
          onSave={handleSaveRolePermissions}
        />
      )}
    </div>
  );
}