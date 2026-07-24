//src/shared/authorization/application/services/UserApplicationService.ts

import type { User, UserFormData } from "../../domain/models";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { authAppService } from "@/features/auth";
import { eventBus } from "@infra/events";
import { isManagerRole } from "../../config/RoleConfig";
import {
  calculateEffectivePermissions,
  filterCustomPermissionsOnly,
} from "../../utils/PermissionCalculator";

export class UserApplicationService {
  constructor(private userRepository: IUserRepository) {}

  private extractCustomPermissions(
    role: string,
    permissions: string[],
  ): string[] {
    return filterCustomPermissionsOnly(role, permissions);
  }

  private computeEffectivePermissions(
    role: string,
    customPermissions: string[] = [],
  ): string[] {
    return calculateEffectivePermissions(role, customPermissions);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.getAll();
  }

  async getUserById(id: string): Promise<User | undefined> {
    const user = await this.userRepository.getById(id);
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.userRepository.getByUsername(username);
    return user || undefined;
  }

  async getDepartmentManager(departmentId: string): Promise<User | null> {
    return await this.userRepository.getByDepartmentAndRole(
      departmentId,
      "manager",
    );
  }

  public async validateManagerConstraint(
    departmentId: string,
    userId: string,
    role: string,
    departmentName?: string,
  ) {
    if (!isManagerRole(role)) return { valid: true };

    const existingManager = await this.getDepartmentManager(departmentId);
    if (existingManager && existingManager.id !== userId) {
      const deptLabel = departmentName
        ? `"${departmentName}"`
        : "this department";
      return {
        valid: false,
        error: `${deptLabel} already has a manager: ${existingManager.fullName} (@${existingManager.username})`,
        existingManager,
      };
    }
    return { valid: true };
  }

  async createUser(formData: UserFormData): Promise<User> {
    if (formData.role && formData.department) {
      const validation = await this.validateManagerConstraint(
        formData.department,
        "",
        formData.role,
      );
      if (!validation.valid) throw new Error(validation.error!);
    }

    const customPermissions = formData.role
      ? this.extractCustomPermissions(
          formData.role,
          formData.customPermissions || [],
        )
      : formData.customPermissions || [];

    let finalManagerId: string | null = null;
    if (formData.role !== "admin" && formData.department) {
      const manager = await this.getDepartmentManager(formData.department);
      if (manager) finalManagerId = manager.id;
    }

    const user = await this.userRepository.create({
      username: formData.username,
      email: formData.email,
      fullName: formData.fullName,
      password: formData.password || "",
      role: formData.role,
      department: formData.department || "",
      status: formData.status || "active",
      manager_id: finalManagerId,
      custom_permissions: customPermissions,
    });

    eventBus.publish({
      type: "user.created" as any,
      payload: { userId: user.id, username: user.username, role: user.role },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "user-management",
    });

    return user;
  }

  async updateUser(id: string, formData: Partial<UserFormData>): Promise<User> {
    if (formData.role && formData.department) {
      const validation = await this.validateManagerConstraint(
        formData.department,
        id,
        formData.role,
      );
      if (!validation.valid) throw new Error(validation.error!);
    }

    const currentUser = await this.getUserById(id);
    if (!currentUser) throw new Error(`User ${id} not found`);

    const updateData: any = { updated_at: new Date().toISOString() };
    const effectiveRole = formData.role || currentUser.role;

    if (formData.role !== undefined) updateData.role = formData.role;
    if (formData.customPermissions !== undefined) {
      updateData.custom_permissions = this.extractCustomPermissions(
        effectiveRole,
        formData.customPermissions,
      );
    }
    if (formData.username !== undefined)
      updateData.username = formData.username;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.fullName !== undefined)
      updateData.full_name = formData.fullName;
    if (formData.department !== undefined)
      updateData.department = formData.department;
    if (formData.status !== undefined) updateData.status = formData.status;

    const effectiveDepartment = formData.department || currentUser.department;
    if (effectiveRole === "admin") {
      updateData.manager_id = null;
    } else if (
      formData.department !== undefined ||
      formData.role !== undefined
    ) {
      if (effectiveDepartment) {
        const manager = await this.getDepartmentManager(effectiveDepartment);
        updateData.manager_id = manager ? manager.id : null;
      } else {
        updateData.manager_id = null;
      }
    }

    const user = await this.userRepository.update(id, updateData);
    authAppService.updateCurrentUser(user);

    eventBus.publish({
      type: "user.updated" as any,
      payload: { userId: user.id, username: user.username, role: user.role },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "user-management",
    });

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
    eventBus.publish({
      type: "user.deleted" as any,
      payload: { userId: id },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: "user-management",
    });
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    await this.userRepository.changePassword(id, newPassword);
  }
}
