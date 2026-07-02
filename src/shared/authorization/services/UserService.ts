// src/shared/authorization/services/UserService.ts

import { User, UserFormData, UserStatus, Permission } from '../types';
import { getDB } from '@shared/database';
import type { DBUser } from '@shared/database/types';
import { eventBus } from '@infra/events';

class UserService {
  private static instance: UserService;
  private users: Map<string, User> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.initializeDB();
  }

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private async initializeDB() {
    if (this.initialized) return;
    
    try {
      const db = await getDB();
      const dbUsers = await db.getAllUsers();
      
      this.users.clear();
      for (const dbUser of dbUsers) {
        const user = this.dbUserToUser(dbUser);
        this.users.set(user.id, user);
      }
      
      this.initialized = true;
    } catch (error: any) {
      console.error('[UserService] Failed to initialize DB:', error);
    }
  }

  private dbUserToUser(dbUser: DBUser): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role,
      department: dbUser.department,
      status: dbUser.status as UserStatus,
      customPermissions: dbUser.customPermissions || [],
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    };
  }

  async getAllUsers(): Promise<User[]> {
    await this.initializeDB();
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.initializeDB();
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.initializeDB();
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(formData: UserFormData): Promise<User> {
    const db = await getDB();
    
    const dbUser = await db.createUser({
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password || '',
      role: formData.role,
      department: formData.department || '',
      status: formData.status || 'active',
      customPermissions: formData.customPermissions || [],
    });

    const user = this.dbUserToUser(dbUser);
    this.users.set(user.id, user);

    eventBus.publish({
      type: 'user.created' as any,
      payload: { userId: user.id, username: user.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return user;
  }

  async updateUser(id: string, formData: Partial<UserFormData>): Promise<User> {
    const db = await getDB();
    
    const dbUser = await db.updateUser(id, {
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      role: formData.role,
      department: formData.department,
      status: formData.status,
      customPermissions: formData.customPermissions,
    });

    const user = this.dbUserToUser(dbUser);
    this.users.set(user.id, user);

    eventBus.publish({
      type: 'user.updated' as any,
      payload: { userId: user.id, username: user.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const db = await getDB();
    await db.deleteUser(id);
    this.users.delete(id);

    eventBus.publish({
      type: 'user.deleted' as any,
      payload: { userId: id },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const db = await getDB();
    await db.updateUser(id, { password: newPassword });
  }

  async resetToDefaults(): Promise<void> {
    const db = await getDB();
    await db.reset();
    this.users.clear();
    await this.initializeDB();
  }
}

export const userService = UserService.getInstance();