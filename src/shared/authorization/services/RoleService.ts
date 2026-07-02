// src/shared/authorization/services/RoleService.ts

import { Role, RoleInfo, Permission } from '../types';
import { ROLES as DEFAULT_ROLES } from '../roles';
import { eventBus } from '@infra/events';
import { db } from '@shared/database';
import type { DBRole } from '@shared/database/types';

const STORAGE_KEY = 'ics_custom_roles';

interface CustomRole extends RoleInfo {
  isCustom: boolean;
  isSystem?: boolean;
}

class RoleService {
  private static instance: RoleService;
  private customRoles: Map<string, CustomRole> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.loadFromStorage();
    this.initializeDB();
  }

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  // 🎯 Initialize DB از localStorage
  private async initializeDB() {
    if (this.initialized) return;
    
    try {
      const dbRoles = await db.getAllRoles();
      
      // اگه DB خالیه، از localStorage یا defaults پر کن
      if (dbRoles.length === 0) {
        // ایجاد نقش‌های پیش‌فرض
        const defaultRoles = Object.values(DEFAULT_ROLES);
        for (const role of defaultRoles) {
          await db.createRole({
            name: role.id,
            displayName: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystem: true,
          });
        }
        
        // ایجاد custom roles از localStorage
        for (const role of this.customRoles.values()) {
          await db.createRole({
            name: role.id,
            displayName: role.name,
            description: role.description,
            permissions: role.permissions,
            isSystem: false,
          });
        }
      } else {
        // اگه DB داده داره، custom roles رو از DB بخون
        this.customRoles.clear();
        for (const dbRole of dbRoles) {
          if (!dbRole.isSystem) {
            this.customRoles.set(dbRole.name, {
              id: dbRole.name as Role,
              name: dbRole.displayName,
              description: dbRole.description,
              permissions: dbRole.permissions as Permission[],
              isCustom: true,
            });
          }
        }
        this.saveToStorage(); // Sync با localStorage
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[RoleService] Failed to initialize DB:', error);
    }
  }

  // دریافت همه role ها (پیش‌فرض + custom)
  getAllRoles(): CustomRole[] {
    const defaultRoles = Object.values(DEFAULT_ROLES).map(r => ({
      ...r,
      isCustom: false,
      isSystem: true,
    }));
    const customRoles = Array.from(this.customRoles.values());
    return [...defaultRoles, ...customRoles];
  }

  getRoleById(id: string): CustomRole | undefined {
    if (id in DEFAULT_ROLES) {
      const role = DEFAULT_ROLES[id as Role];
      if (role) {
        return { ...role, isCustom: false, isSystem: true };
      }
    }
    return this.customRoles.get(id);
  }

  getRolePermissions(roleId: string): Permission[] {
    const role = this.getRoleById(roleId);
    return role?.permissions || [];
  }

  // ایجاد role جدید
  async createRole(data: { id: string; name: string; description: string; permissions: Permission[] }): Promise<CustomRole> {
    if (this.getRoleById(data.id)) {
      throw new Error(`Role "${data.id}" already exists`);
    }

    const newRole: CustomRole = {
      id: data.id as Role,
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      isCustom: true,
    };

    this.customRoles.set(data.id, newRole);
    this.saveToStorage();

    // 🎯 Save به DB
    try {
      await db.createRole({
        name: data.id,
        displayName: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystem: false,
      });
    } catch (error) {
      console.error('[RoleService] Failed to save to DB:', error);
    }

    eventBus.publish({
      type: 'user.role.created' as any,
      payload: { roleId: data.id, roleName: data.name, permissionCount: data.permissions.length },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });

    return newRole;
  }

  // ویرایش role
  async updateRole(id: string, data: Partial<{ name: string; description: string; permissions: Permission[] }>): Promise<CustomRole> {
    if (id in DEFAULT_ROLES) {
      throw new Error('Cannot modify system roles');
    }

    const existing = this.customRoles.get(id);
    if (!existing) {
      throw new Error(`Role "${id}" not found`);
    }

    const updated: CustomRole = {
      ...existing,
      ...data,
      isCustom: true,
    };

    this.customRoles.set(id, updated);
    this.saveToStorage();

    // 🎯 Update در DB
    try {
      const dbRole = await db.getRoleByName(id);
      if (dbRole) {
        await db.updateRole(dbRole.id, {
          displayName: updated.name,
          description: updated.description,
          permissions: updated.permissions,
        });
      }
    } catch (error) {
      console.error('[RoleService] Failed to update DB:', error);
    }

    eventBus.publish({
      type: 'user.role.updated' as any,
      payload: { roleId: id, roleName: updated.name },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });

    return updated;
  }

  // حذف role
  async deleteRole(id: string): Promise<void> {
    if (id in DEFAULT_ROLES) {
      throw new Error('Cannot delete system roles');
    }
    if (!this.customRoles.has(id)) {
      throw new Error(`Role "${id}" not found`);
    }

    const role = this.customRoles.get(id)!;
    this.customRoles.delete(id);
    this.saveToStorage();

    // 🎯 Delete از DB
    try {
      const dbRole = await db.getRoleByName(id);
      if (dbRole) {
        await db.deleteRole(dbRole.id);
      }
    } catch (error) {
      console.error('[RoleService] Failed to delete from DB:', error);
    }

    eventBus.publish({
      type: 'user.role.deleted' as any,
      payload: { roleId: id, roleName: role.name },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });
  }

  // duplicate role (برای ساخت سریع)
  async duplicateRole(sourceId: string, newName?: string): Promise<CustomRole> {
  const source = this.getRoleById(sourceId);
  if (!source) throw new Error('Source role not found');

  // 🔧 FIX: تولید ID منحصر به فرد در اینجا (نه در کامپوننت)
  const newId = `${sourceId}_custom_${Math.random().toString(36).substr(2, 9)}`;
  const finalName = newName || `${source.name} (Custom)`;

  return await this.createRole({
    id: newId,
    name: finalName,
    description: `Copy of ${source.name}`,
    permissions: [...source.permissions],
  });
}

  // 🎯 Reset به defaults
  async resetToDefaults(): Promise<void> {
    this.customRoles.clear();
    this.saveToStorage();
    
    // Reset در DB
    await db.roles.clear();
    
    // ایجاد مجدد نقش‌های پیش‌فرض
    const defaultRoles = Object.values(DEFAULT_ROLES);
    for (const role of defaultRoles) {
      await db.createRole({
        name: role.id,
        displayName: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: true,
      });
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((r: CustomRole) => {
          this.customRoles.set(r.id, r);
        });
      }
    } catch (error) {
      console.error('[RoleService] Failed to load:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const arr = Array.from(this.customRoles.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (error) {
      console.error('[RoleService] Failed to save:', error);
    }
  }
}

export const roleService = RoleService.getInstance();