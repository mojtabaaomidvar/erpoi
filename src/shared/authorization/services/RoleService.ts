// src/shared/authorization/services/RoleService.ts

import { Permission } from '../types';
import { eventBus } from '@infra/events';
import { getDB } from '@shared/database';
import type { DBRole } from '@shared/database/types';

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isCustom: boolean;
  isSystem?: boolean;
}

class RoleService {
  private static instance: RoleService;
  private customRoles: Map<string, CustomRole> = new Map();
  private initialized: boolean = false;

  private constructor() {
    this.initializeDB();
  }

  static getInstance(): RoleService {
    if (!RoleService.instance) {
      RoleService.instance = new RoleService();
    }
    return RoleService.instance;
  }

  // ═══════════════════════════════════════
  // 🔧 Initialize DB
  // ═══════════════════════════════════════

  private async initializeDB() {
    if (this.initialized) return;
    
    try {
      const db = await getDB();
      const dbRoles = await db.getAllRoles();
      
      if (dbRoles.length === 0) {
        // 🔧 FIX: فقط admin رو بساز
        await db.createRole({
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full system access - cannot be deleted',
          permissions: ['*:*'],
          isSystem: true,
        });
      }
      
      // 🔧 FIX: همه roles رو از DB بخون
      await this.loadFromDB();
      this.initialized = true;
    } catch (error) {
      console.error('[RoleService] Failed to initialize DB:', error);
    }
  }

  private async loadFromDB() {
    try {
      const db = await getDB();
      const dbRoles = await db.getAllRoles();
      this.customRoles.clear();
      
      for (const dbRole of dbRoles) {
        this.customRoles.set(dbRole.name, {
          id: dbRole.id,
          name: dbRole.name,
          displayName: dbRole.displayName,
          description: dbRole.description,
          permissions: dbRole.permissions as Permission[],
          isCustom: !dbRole.isSystem,
          isSystem: dbRole.isSystem,
        });
      }
    } catch (error) {
      console.error('[RoleService] Failed to load from DB:', error);
    }
  }

  // ═══════════════════════════════════════
  // 🎭 Getters
  // ═══════════════════════════════════════

  async getAllRoles(): Promise<CustomRole[]> {
    await this.loadFromDB();
    return Array.from(this.customRoles.values());
  }

  async getRoleById(id: string): Promise<CustomRole | undefined> {
    await this.loadFromDB();
    return this.customRoles.get(id);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.getRoleById(roleId);
    return role?.permissions || [];
  }

  // ═══════════════════════════════════════
  // ➕ Create
  // ═══════════════════════════════════════

  async createRole(data: { name: string; displayName: string; description: string; permissions: Permission[] }): Promise<CustomRole> {
    if (this.customRoles.has(data.name)) {
      throw new Error(`Role "${data.name}" already exists`);
    }

    const db = await getDB();
    const dbRole = await db.createRole({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      permissions: data.permissions,
      isSystem: false,
    });

    const newRole: CustomRole = {
      id: dbRole.id,
      name: dbRole.name,
      displayName: dbRole.displayName,
      description: dbRole.description,
      permissions: dbRole.permissions as Permission[],
      isCustom: true,
      isSystem: false,
    };

    this.customRoles.set(data.name, newRole);

    eventBus.publish({
      type: 'user.role.created' as any,
      payload: { roleId: dbRole.id, roleName: data.name },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });

    return newRole;
  }

  // ═══════════════════════════════════════
  // ✏️ Update
  // ═══════════════════════════════════════

  async updateRole(id: string, data: Partial<{ displayName: string; description: string; permissions: Permission[] }>): Promise<CustomRole> {
    const db = await getDB();
    const dbRole = await db.getRole(id);
    if (!dbRole) throw new Error(`Role "${id}" not found`);
    
    if (dbRole.isSystem && data.permissions) {
      throw new Error('Cannot modify system role permissions');
    }

    const updated = await db.updateRole(id, data);
    
    const updatedRole: CustomRole = {
      id: updated.id,
      name: updated.name,
      displayName: updated.displayName,
      description: updated.description,
      permissions: updated.permissions as Permission[],
      isCustom: !updated.isSystem,
      isSystem: updated.isSystem,
    };

    this.customRoles.set(updated.name, updatedRole);

    eventBus.publish({
      type: 'user.role.updated' as any,
      payload: { roleId: id, roleName: updated.name },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });

    return updatedRole;
  }

  // ═══════════════════════════════════════
  // 🗑️ Delete
  // ═══════════════════════════════════════

  async deleteRole(id: string): Promise<void> {
    const db = await getDB();
    const dbRole = await db.getRole(id);
    if (!dbRole) throw new Error(`Role "${id}" not found`);
    
    if (dbRole.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    await db.deleteRole(id);
    this.customRoles.delete(dbRole.name);

    eventBus.publish({
      type: 'user.role.deleted' as any,
      payload: { roleId: id, roleName: dbRole.name },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'role-management',
    });
  }

  // ═══════════════════════════════════════
  // 📋 Duplicate
  // ═══════════════════════════════════════

  async duplicateRole(sourceId: string, newName?: string): Promise<CustomRole> {
    const source = await this.getRoleById(sourceId);
    if (!source) throw new Error('Source role not found');

    const newId = `${sourceId}_custom_${Math.random().toString(36).substr(2, 9)}`;
    const finalName = newName || `${source.displayName} (Custom)`;

    return await this.createRole({
      name: newId,
      displayName: finalName,
      description: `Copy of ${source.displayName}`,
      permissions: [...source.permissions],
    });
  }

  // ═══════════════════════════════════════
  // 🔄 Reset
  // ═══════════════════════════════════════

  async resetToDefaults(): Promise<void> {
    const db = await getDB();
    await db.reset();
    this.customRoles.clear();
    await this.loadFromDB();
  }
}

export const roleService = RoleService.getInstance();