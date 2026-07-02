// src/shared/database/IDBDatabase.ts

import Dexie, { type Table } from 'dexie';
import type { DatabaseService } from './DatabaseService';
import type { DBUser, DBRole, DBPermissionMapping, DBUIElement, DBSettings, DatabaseSchema } from './types';

export class IDBDatabase extends Dexie {
  users!: Table<DBUser, string>;
  roles!: Table<DBRole, string>;
  permissionMappings!: Table<DBPermissionMapping, string>;
  uiElements!: Table<DBUIElement, string>;
  settings!: Table<DBSettings, string>;

  constructor() {
    super('ICSDatabase');
    
    this.version(1).stores({
      users: 'id, username, email, role, department, status',
      roles: 'id, name',
      permissionMappings: 'permission',
      uiElements: 'id, module, entity, type',
      settings: 'key',
    });
  }

  // ═══════════════════════════════════════
  // 👤 Users
  // ═══════════════════════════════════════

  async createUser(user: Omit<DBUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBUser> {
    const now = new Date().toISOString();
    const newUser: DBUser = {
      ...user,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    await this.users.add(newUser);
    return newUser;
  }

  async updateUser(id: string, data: Partial<DBUser>): Promise<DBUser> {
    const existing = await this.users.get(id);
    if (!existing) throw new Error(`User ${id} not found`);
    
    const updated: DBUser = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await this.users.put(updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await this.users.delete(id);
  }

  async getUser(id: string): Promise<DBUser | null> {
    return (await this.users.get(id)) || null;
  }

  async getUserByUsername(username: string): Promise<DBUser | null> {
    return (await this.users.where('username').equals(username).first()) || null;
  }

  async getUserByEmail(email: string): Promise<DBUser | null> {
    return (await this.users.where('email').equals(email).first()) || null;
  }

  async getAllUsers(): Promise<DBUser[]> {
    return await this.users.toArray();
  }

  // ═══════════════════════════════════════
  // 🎭 Roles
  // ═══════════════════════════════════════

  async createRole(role: Omit<DBRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBRole> {
    const now = new Date().toISOString();
    const newRole: DBRole = {
      ...role,
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    await this.roles.add(newRole);
    return newRole;
  }

  async updateRole(id: string, data: Partial<DBRole>): Promise<DBRole> {
    const existing = await this.roles.get(id);
    if (!existing) throw new Error(`Role ${id} not found`);
    
    const updated: DBRole = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await this.roles.put(updated);
    return updated;
  }

  async deleteRole(id: string): Promise<void> {
    await this.roles.delete(id);
  }

  async getRole(id: string): Promise<DBRole | null> {
    return (await this.roles.get(id)) || null;
  }

  async getRoleByName(name: string): Promise<DBRole | null> {
    return (await this.roles.where('name').equals(name).first()) || null;
  }

  async getAllRoles(): Promise<DBRole[]> {
    return await this.roles.toArray();
  }

  // ═══════════════════════════════════════
  // 🔐 Permission Mappings
  // ═══════════════════════════════════════

  async setPermissionMapping(permission: string, allowed: string[], denied: string[] = []): Promise<void> {
    const mapping: DBPermissionMapping = {
      permission,
      allowedElements: allowed,
      deniedElements: denied,
      updatedAt: new Date().toISOString(),
    };
    await this.permissionMappings.put(mapping);
  }

  async getPermissionMapping(permission: string): Promise<DBPermissionMapping | null> {
    return (await this.permissionMappings.get(permission)) || null;
  }

  async getAllPermissionMappings(): Promise<DBPermissionMapping[]> {
    return await this.permissionMappings.toArray();
  }

  // ═══════════════════════════════════════
  // 🎨 UI Elements
  // ═══════════════════════════════════════

  async createUIElement(element: Omit<DBUIElement, 'id'>): Promise<DBUIElement> {
    const newElement: DBUIElement = {
      ...element,
      id: `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    await this.uiElements.add(newElement);
    return newElement;
  }

  async updateUIElement(id: string, data: Partial<DBUIElement>): Promise<DBUIElement> {
    const existing = await this.uiElements.get(id);
    if (!existing) throw new Error(`UI Element ${id} not found`);
    
    const updated: DBUIElement = { ...existing, ...data };
    await this.uiElements.put(updated);
    return updated;
  }

  async deleteUIElement(id: string): Promise<void> {
    await this.uiElements.delete(id);
  }

  async getUIElement(id: string): Promise<DBUIElement | null> {
    return (await this.uiElements.get(id)) || null;
  }

  async getAllUIElements(): Promise<DBUIElement[]> {
    return await this.uiElements.toArray();
  }

  async getUIElementsByModule(module: string): Promise<DBUIElement[]> {
    return await this.uiElements.where('module').equals(module).toArray();
  }

  async getUIElementsByEntity(entity: string): Promise<DBUIElement[]> {
    return await this.uiElements.where('entity').equals(entity).toArray();
  }

  // ═══════════════════════════════════════
  // ⚙️ Settings
  // ═══════════════════════════════════════

  async setSetting(key: string, value: any): Promise<void> {
    const setting: DBSettings = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    await this.settings.put(setting);
  }

  async getSetting(key: string): Promise<any> {
    const setting = await this.settings.get(key);
    return setting?.value ?? null;
  }

  async getAllSettings(): Promise<DBSettings[]> {
    return await this.settings.toArray();
  }

  // ═══════════════════════════════════════
  // 🔄 Bulk Operations
  // ═══════════════════════════════════════

  async initialize(): Promise<void> {
    // ایجاد کاربر پیش‌فرض admin
    const adminExists = await this.getUserByUsername('admin');
    if (!adminExists) {
      await this.createUser({
        username: 'admin',
        email: 'admin@ics.com',
        fullName: 'System Administrator',
        password: 'admin123',
        role: 'admin',
        department: 'general',
        status: 'active',
      });
    }

    // ایجاد نقش‌های پیش‌فرض
    const adminRole = await this.getRoleByName('admin');
    if (!adminRole) {
      await this.createRole({
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full system access',
        permissions: ['*:*'],
        isSystem: true,
      });
    }

    const viewerRole = await this.getRoleByName('viewer');
    if (!viewerRole) {
      await this.createRole({
        name: 'viewer',
        displayName: 'Viewer',
        description: 'Read-only access',
        permissions: ['*:read', '*:view_all'],
        isSystem: true,
      });
    }
  }

  async reset(): Promise<void> {
    await this.users.clear();
    await this.roles.clear();
    await this.permissionMappings.clear();
    await this.uiElements.clear();
    await this.settings.clear();
    await this.initialize();
  }

  async isInitialized(): Promise<boolean> {
    const count = await this.users.count();
    return count > 0;
  }
}

export const db = new IDBDatabase();