// src/pages/Users.tsx

import { useState } from 'react';
import { User, Role, UserStatus } from '@shared/authorization/types';
import { ROLES } from '@shared/authorization/roles';
import { usePermission } from '@shared/authorization/hooks/usePermission';
import { userService } from '@shared/authorization/services/UserService';
import { UserForm } from '@shared/authorization/components/UserForm';
import { confirmDialog } from '@shared/ui/ConfirmDialog';
import { showToast } from '@shared/ui/ToastContainer';

const getRoleName = (role: string): string => {
  const roleKey = role as keyof typeof ROLES;
  return ROLES[roleKey]?.name || 'Custom Role';
};

const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    inspector: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    accountant: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    viewer: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  };
  return colors[role] || 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
};

export function Users() {
  const [users, setUsers] = useState<User[]>(userService.getAll());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const { can } = usePermission();

  const refreshUsers = () => {
    setUsers(userService.getAll());
  };

  const handleDeleteUser = async (user: User) => {
	  const confirmed = await confirmDialog({
		title: 'Delete User',
		message: `Are you sure you want to delete "${user.fullName}"? This action cannot be undone.`,
		confirmText: 'Delete',
		variant: 'danger',
	  });

	  if (!confirmed) return;

	  userService.delete(user.id);
	  showToast('success', 'User Deleted', `${user.fullName} has been removed`);
	  refreshUsers();
  };

  const handleToggleStatus = async (user: User) => {
	  const newStatus = user.status === 'active' ? 'inactive' : 'active';
	  const confirmed = await confirmDialog({
		title: `${newStatus === 'active' ? 'Activate' : 'Deactivate'} User`,
		message: `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} "${user.fullName}"?`,
		confirmText: 'Confirm',
		variant: 'warning',
	  });

	  if (!confirmed) return;

	  userService.updateStatus(user.id, newStatus);
	  showToast('success', 'Status Updated', `${user.fullName} is now ${newStatus}`);
	  refreshUsers();
  };

  const handleResetPassword = async (user: User) => {
	  const confirmed = await confirmDialog({
		title: 'Reset Password',
		message: `Reset password for "${user.fullName}"? A temporary password will be generated.`,
		confirmText: 'Reset',
		variant: 'warning',
	  });

	  if (!confirmed) return;

	  userService.resetPassword(user.id, 'Temp1234!');
	  showToast('success', 'Password Reset', `Temporary password set for ${user.fullName}`);
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = userService.getStats();

  const statusColors: Record<UserStatus, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inactive: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            👤 User Management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>
        {can('user:create') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Create User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Users</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</div>
          <div className="text-sm text-green-700 dark:text-green-300">Active</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.inactive}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Inactive</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.suspended}</div>
          <div className="text-sm text-red-700 dark:text-red-300">Suspended</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.byRole.admin || 0}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Admins</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as Role | 'all')}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Roles</option>
            {Object.values(ROLES).map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">User</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Last Login</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {user.email}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
						  {getRoleName(user.role)}
					  </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {user.department || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {can('user:update') && (
                          <>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="text-yellow-600 dark:text-yellow-400 hover:underline text-xs"
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="text-orange-600 dark:text-orange-400 hover:underline text-xs"
                            >
                              Reset Pwd
                            </button>
                          </>
                        )}
                        {can('user:delete') && user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 dark:text-red-400 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <UserForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={refreshUsers}
        />
      )}

      {editingUser && (
        <UserForm
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={refreshUsers}
        />
      )}
    </div>
  );
}