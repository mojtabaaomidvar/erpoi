// src/shared/authorization/services/UserService.ts

import { User, UserFormData, UserStatus, Role, Permission } from '../types';
import { eventBus } from '@infra/events';

const STORAGE_KEY = 'ics_users';

// Default preferences
const DEFAULT_PREFERENCES = {
  theme: 'light' as const,
  language: 'en' as const,
  notifications: {
    email: true,
    inApp: true,
    contractExpiry: true,
    invoiceDue: true,
    inspectionAssigned: true,
  },
  timezone: 'Asia/Tehran',
  dateFormat: 'jalaali' as const,
};

// Initial users (با department IDs)
const INITIAL_USERS: User[] = [
  {
    id: 'user_001',
    username: 'admin',
    email: 'admin@ics.com',
    fullName: 'Ali Rezai',
    role: 'admin',
    department: 'it',
    status: 'active',
    phone: '+98 912 345 6789',
    preferences: DEFAULT_PREFERENCES,
    customPermissions: [],
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  {
    id: 'user_002',
    username: 'sara.m',
    email: 'sara.m@ics.com',
    fullName: 'Sara Mohammadi',
    role: 'manager',
    department: 'inspections',
    status: 'active',
    phone: '+98 912 234 5678',
    preferences: DEFAULT_PREFERENCES,
    customPermissions: [],
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
  {
    id: 'user_003',
    username: 'reza.h',
    email: 'reza.h@ics.com',
    fullName: 'Reza Hosseini',
    role: 'inspector',
    department: 'field',
    status: 'active',
    phone: '+98 912 123 4567',
    preferences: DEFAULT_PREFERENCES,
    customPermissions: [],
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'user_004',
    username: 'maryam.k',
    email: 'maryam.k@ics.com',
    fullName: 'Maryam Karimi',
    role: 'accountant',
    department: 'finance',
    status: 'active',
    phone: '+98 912 987 6543',
    preferences: DEFAULT_PREFERENCES,
    customPermissions: [],
    createdAt: new Date('2024-02-15'),
  },
  {
    id: 'user_005',
    username: 'hassan.t',
    email: 'hassan.t@ics.com',
    fullName: 'Hassan Tehrani',
    role: 'viewer',
    department: 'management',
    status: 'active',
    preferences: DEFAULT_PREFERENCES,
    customPermissions: [],
    createdAt: new Date('2024-03-01'),
  },
];

class UserService {
  private static instance: UserService;
  private users: User[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // ═══════════════════════════════════════
  // 🔍 Query Methods
  // ═══════════════════════════════════════

  getAll(): User[] {
    return [...this.users];
  }

  getById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getByUsername(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  getByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  getByRole(role: Role): User[] {
    return this.users.filter(u => u.role === role);
  }

  getByStatus(status: UserStatus): User[] {
    return this.users.filter(u => u.status === status);
  }

  getByDepartment(department: string): User[] {
    return this.users.filter(u => u.department === department);
  }

  // ═══════════════════════════════════════
  // ✏️ Mutation Methods
  // ═══════════════════════════════════════

  create(formData: UserFormData): User {
    // Check for duplicates
    if (this.getByUsername(formData.username)) {
      throw new Error('Username already exists');
    }
    if (this.getByEmail(formData.email)) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role,
      department: formData.department,
      phone: formData.phone,
      status: formData.status || 'active',
      preferences: { ...DEFAULT_PREFERENCES, ...formData.preferences },
      customPermissions: formData.customPermissions || [],
      createdAt: new Date(),
    };

    this.users.push(newUser);
    this.saveToStorage();

    // ✅ Publish Event
    eventBus.publish({
      type: 'user.created',
      payload: {
        userId: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return newUser;
  }

  update(id: string, formData: Partial<UserFormData>): User {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    if (formData.username && this.getByUsername(formData.username)?.id !== id) {
      throw new Error('Username already exists');
    }
    if (formData.email && this.getByEmail(formData.email)?.id !== id) {
      throw new Error('Email already exists');
    }

    const oldUser = { ...this.users[userIndex] };

    // ✅ اصلاح: preferences رو کامل merge کن
    const updatedUser: User = {
      ...this.users[userIndex],
      ...formData,
      preferences: formData.preferences 
        ? { ...this.users[userIndex].preferences, ...formData.preferences }
        : this.users[userIndex].preferences,
    };

    this.users[userIndex] = updatedUser;
    this.saveToStorage();

    eventBus.publish({
      type: 'user.updated',
      payload: {
        userId: id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        changes: this.getChanges(oldUser, updatedUser),
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return updatedUser;
  }

  updateStatus(id: string, status: UserStatus): User {
    const user = this.getById(id);
    if (!user) throw new Error('User not found');

    const oldStatus = user.status;
    const updatedUser = this.update(id, { status });

    // ✅ Publish Event
    eventBus.publish({
      type: 'user.status.changed',
      payload: {
        userId: id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        oldStatus,
        newStatus: status,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return updatedUser;
  }

  updatePreferences(id: string, preferences: Partial<User['preferences']>): User {
    const user = this.getById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return this.update(id, {
      preferences: { ...user.preferences, ...preferences },
    });
  }

  updateCustomPermissions(id: string, permissions: Permission[]): User {
    const user = this.getById(id);
    if (!user) throw new Error('User not found');

    const oldPermissions = [...(user.customPermissions || [])];
    const updatedUser = this.update(id, { customPermissions: permissions });

    // ✅ Publish Event
    eventBus.publish({
      type: 'user.permissions.changed',
      payload: {
        userId: id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        added: permissions.filter(p => !oldPermissions.includes(p)),
        removed: oldPermissions.filter(p => !permissions.includes(p)),
        total: permissions.length,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return updatedUser;
  }

  delete(id: string): void {
    const user = this.getById(id);
    if (!user) throw new Error('User not found');

    this.users = this.users.filter(u => u.id !== id);
    this.saveToStorage();

    // ✅ Publish Event
    eventBus.publish({
      type: 'user.deleted',
      payload: {
        userId: id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });
  }

  resetPassword(id: string, newPassword: string): void {
    const user = this.getById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real app, this would hash the password
    console.log(`Password reset for user ${user.username}`);

    // ✅ Publish Event
    eventBus.publish({
      type: 'user.password.reset',
      payload: {
        userId: id,
        username: user.username,
        fullName: user.fullName,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });
  }

  // ═══════════════════════════════════════
  // 📊 Stats & Helpers
  // ═══════════════════════════════════════

  getStats() {
    return {
      total: this.users.length,
      active: this.users.filter(u => u.status === 'active').length,
      inactive: this.users.filter(u => u.status === 'inactive').length,
      suspended: this.users.filter(u => u.status === 'suspended').length,
      byRole: this.users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<Role, number>),
      byDepartment: this.users.reduce((acc, user) => {
        if (user.department) {
          acc[user.department] = (acc[user.department] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Helper: Get changes between old and new user
   */
  private getChanges(oldUser: User, newUser: User): Record<string, { before: any; after: any }> {
    const changes: Record<string, { before: any; after: any }> = {};
    
    const fields: (keyof User)[] = ['username', 'email', 'fullName', 'role', 'department', 'status', 'phone'];
    
    fields.forEach(field => {
      const oldVal = oldUser[field];
      const newVal = newUser[field];
      
      // مقایسه عمیق برای آرایه‌ها (مثل customPermissions)
      const oldStr = JSON.stringify(oldVal);
      const newStr = JSON.stringify(newVal);
      
      if (oldStr !== newStr) {
        changes[field] = {
          before: oldVal,
          after: newVal,
        };
      }
    });

    // چک کردن preferences
    if (JSON.stringify(oldUser.preferences) !== JSON.stringify(newUser.preferences)) {
      changes.preferences = {
        before: oldUser.preferences,
        after: newUser.preferences,
      };
    }

    // چک کردن customPermissions
    if (JSON.stringify(oldUser.customPermissions) !== JSON.stringify(newUser.customPermissions)) {
      changes.customPermissions = {
        before: oldUser.customPermissions || [],
        after: newUser.customPermissions || [],
      };
    }

    return changes;
  }

  // ═══════════════════════════════════════
  // 💾 Storage Methods
  // ═══════════════════════════════════════

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.users = parsed.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined,
          customPermissions: u.customPermissions || [],
        }));
      } else {
        this.users = INITIAL_USERS;
        this.saveToStorage();
      }
    } catch (error) {
      console.error('[UserService] Failed to load:', error);
      this.users = INITIAL_USERS;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
    } catch (error) {
      console.error('[UserService] Failed to save:', error);
    }
  }
}

export const userService = UserService.getInstance();