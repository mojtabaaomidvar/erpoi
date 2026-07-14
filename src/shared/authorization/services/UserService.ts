// src/shared/authorization/services/UserService.ts

import { User, UserFormData, UserStatus } from "../types";
import { supabase } from "@shared/database/supabase";
import { authService } from "@features/auth/services/AuthService";
import { eventBus } from "@infra/events";
import {
  getRolePermissions,
  isManagerRole,
  type UserRole,
} from "../config/RoleConfig";
import {
  calculateEffectivePermissions,
  filterCustomPermissionsOnly,
} from "../utils/PermissionCalculator";

class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private dbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      fullName: dbUser.full_name,
      role: dbUser.role,
      department: dbUser.department,
      status: dbUser.status as UserStatus,
      customPermissions: dbUser.custom_permissions || [],
      managerId: dbUser.manager_id,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  // ═══════════════════════════════════════
  // 🔧 NEW: Helper Methods
  // ═══════════════════════════════════════

  /**
   * فیلتر کردن Custom Permissions (حذف Base ها)
   */
  private extractCustomPermissions(
    role: string,
    permissions: string[],
  ): string[] {
    return filterCustomPermissionsOnly(role, permissions);
  }

  /**
   * محاسبه Effective Permissions (Base + Custom)
   */
  private computeEffectivePermissions(
    role: string,
    customPermissions: string[] = [],
  ): string[] {
    return calculateEffectivePermissions(role, customPermissions);
  }

  // ═══════════════════════════════════════
  // 👤 Read Operations
  // ═══════════════════════════════════════

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[UserService] Failed to get users:", error);
      return [];
    }

    return data.map(this.dbUserToUser);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return this.dbUserToUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .single();

    if (error || !data) return undefined;
    return this.dbUserToUser(data);
  }

  // ═══════════════════════════════════════
  // 🎯 Manager Operations
  // ═══════════════════════════════════════

  async getDepartmentManager(departmentId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("department", departmentId)
      .eq("role", "manager")
      .single();

    if (error || !data) return null;
    return this.dbUserToUser(data);
  }

  async validateManagerConstraint(
    departmentId: string,
    userId: string,
    role: UserRole | string,
    departmentName?: string,
  ): Promise<{ valid: boolean; error?: string; existingManager?: User }> {
    if (!isManagerRole(role)) {
      return { valid: true };
    }

    const existingManager = await this.getDepartmentManager(departmentId);

    if (existingManager && existingManager.id !== userId) {
      const deptLabel = departmentName
        ? `"${departmentName}"`
        : `this department`;

      return {
        valid: false,
        error: `${deptLabel} already has a manager: ${existingManager.fullName} (@${existingManager.username})`,
        existingManager,
      };
    }

    return { valid: true };
  }

  // ═══════════════════════════════════════
  // ➕ Create User
  // ═══════════════════════════════════════

  async createUser(formData: UserFormData): Promise<User> {
    // بررسی constraint مدیر
    if (formData.role && formData.department) {
      const validation = await this.validateManagerConstraint(
        formData.department,
        "",
        formData.role,
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // فقط Custom Permissions را ذخیره کن
    const customPermissions = formData.role
      ? this.extractCustomPermissions(
          formData.role,
          formData.customPermissions || [],
        )
      : formData.customPermissions || [];

    // تعیین خودکار manager_id
    let finalManagerId: string | null = null;
    if (formData.role !== "admin" && formData.department) {
      const manager = await this.getDepartmentManager(formData.department);
      if (manager) {
        finalManagerId = manager.id;
      }
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: formData.username,
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password || "",
        role: formData.role,
        department: formData.department || "",
        status: formData.status || "active",
        manager_id: finalManagerId,
        custom_permissions: customPermissions,
      })
      .select()
      .single();

    if (error) {
      console.error("[UserService] Failed to create user:", error);
      throw new Error(error.message);
    }

    const user = this.dbUserToUser(data);

    eventBus.publish({
      type: "user.created" as any,
      payload: { userId: user.id, username: user.username, role: user.role },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "user-management",
    });

    return user;
  }

  // ═══════════════════════════════════════
  // ✏️ Update User
  // ═══════════════════════════════════════

  async updateUser(id: string, formData: Partial<UserFormData>): Promise<User> {
    // بررسی constraint مدیر
    if (formData.role && formData.department) {
      const validation = await this.validateManagerConstraint(
        formData.department,
        id,
        formData.role,
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // دریافت کاربر فعلی
    const currentUser = await this.getUserById(id);
    if (!currentUser) {
      throw new Error(`User ${id} not found`);
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    // مدیریت Role + Permissions
    const effectiveRole = formData.role || currentUser.role;

    if (formData.role !== undefined) {
      updateData.role = formData.role;
    }

    if (formData.customPermissions !== undefined) {
      // فقط Custom Permissions را ذخیره کن
      const customPermissions = this.extractCustomPermissions(
        effectiveRole,
        formData.customPermissions,
      );
      updateData.custom_permissions = customPermissions;
    }

    // سایر فیلدها
    if (formData.username !== undefined)
      updateData.username = formData.username;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.fullName !== undefined)
      updateData.full_name = formData.fullName;
    if (formData.department !== undefined)
      updateData.department = formData.department;
    if (formData.status !== undefined) updateData.status = formData.status;

    // 🔧 FIX: مدیریت manager_id با بررسی undefined
    const effectiveDepartment = formData.department || currentUser.department;

    if (effectiveRole === "admin") {
      updateData.manager_id = null;
    } else if (
      formData.department !== undefined ||
      formData.role !== undefined
    ) {
      // 🔧 FIX: بررسی undefined بودن department
      if (effectiveDepartment) {
        const manager = await this.getDepartmentManager(effectiveDepartment);
        updateData.manager_id = manager ? manager.id : null;
      } else {
        updateData.manager_id = null;
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[UserService] Failed to update user:", error);
      throw new Error(error.message);
    }

    const user = this.dbUserToUser(data);

    authService.updateCurrentUser(user);

    eventBus.publish({
      type: "user.updated" as any,
      payload: { userId: user.id, username: user.username, role: user.role },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "user-management",
    });

    return user;
  }

  // ═══════════════════════════════════════
  // 🗑️ Delete User
  // ═══════════════════════════════════════

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      console.error("[UserService] Failed to delete user:", error);
      throw new Error(error.message);
    }

    eventBus.publish({
      type: "user.deleted" as any,
      payload: { userId: id },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "user-management",
    });
  }

  // ═══════════════════════════════════════
  // 🔑 Change Password
  // ═══════════════════════════════════════

  async changePassword(id: string, newPassword: string): Promise<void> {
    const { error } = await supabase
      .from("users")
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const userService = UserService.getInstance();
