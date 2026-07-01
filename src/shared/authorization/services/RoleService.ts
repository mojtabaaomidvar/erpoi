// src/shared/authorization/services/RoleService.ts

import { Role, RoleInfo, Permission } from '../types';
import { ROLES as DEFAULT_ROLES } from '../roles';
import { eventBus } from '@infra/events';

const STORAGE_KEY = 'ics_custom_roles';

interface CustomRole extends RoleInfo {
  isCustom: boolean;
  isSystem?: boolean; // نقش‌های سیستمی قابل حذف نیستند
}

class RoleService {
  private static instance: RoleService;
  private customRoles: Map<string, CustomRole> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
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
  createRole(data: { id: string; name: string; description: string; permissions: Permission[] }): CustomRole {
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
  updateRole(id: string, data: Partial<{ name: string; description: string; permissions: Permission[] }>): CustomRole {
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
  deleteRole(id: string): void {
    if (id in DEFAULT_ROLES) {
      throw new Error('Cannot delete system roles');
    }
    if (!this.customRoles.has(id)) {
      throw new Error(`Role "${id}" not found`);
    }

    const role = this.customRoles.get(id)!;
    this.customRoles.delete(id);
    this.saveToStorage();

    eventBus.publish({
      type: 'user.role.deleted' as any,
      payload: { roleId: id, roleName: role.name },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });
  }

  // duplicate role (برای ساخت سریع)
  duplicateRole(sourceId: string, newId: string, newName: string): CustomRole {
    const source = this.getRoleById(sourceId);
    if (!source) throw new Error('Source role not found');

    return this.createRole({
      id: newId,
      name: newName,
      description: `Copy of ${source.name}`,
      permissions: [...source.permissions],
    });
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