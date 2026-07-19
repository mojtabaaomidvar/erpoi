// src/features/project-management/application/ProjectApplicationService.ts

import { projectRepository } from "../repositories/SupabaseProjectRepository";
import type { Project, ProjectMember, ProjectRole } from "../domain/types";
import {
  CreateProjectCommand,
  CreateProjectSchema,
} from "./dto/CreateProjectCommand";

// ✅ قانون ۳: ایمپورت سیستم ایونت
import { publishEvent } from "@infra/events/publishEvent";

// ✅ قانون ۹: ایمپورت سرویس آدیت
import { auditLogService } from "@features/audit-log/services/AuditLogService";

const ROLE_HIERARCHY: Record<ProjectRole, number> = {
  INSPECTOR: 2,
  COORDINATOR: 3,
  PROJECT_MANAGER: 4,
};

class ProjectApplicationService {
  private repository = projectRepository;

  async getAllProjects(): Promise<Project[]> {
    return await this.repository.getAll();
  }

  async getProjectById(id: string): Promise<Project | null> {
    return await this.repository.getById(id);
  }

  async getProjectsByContract(contractId: string): Promise<Project[]> {
    return await this.repository.getByContract(contractId);
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    return await this.repository.getByClient(clientId);
  }

  async createProject(
    command: CreateProjectCommand,
    userId: string,
  ): Promise<Project> {
    const validatedData = CreateProjectSchema.parse(command);

    const newProject = await this.repository.create({
      ...validatedData,
      status: "ACTIVE",
    });

    // ۳. انتشار ایونت (Event-Driven)
    publishEvent(
      "project.created",
      {
        projectId: newProject.id,
        name: newProject.name,
        clientId: newProject.client_id,
        status: newProject.status,
      },
      userId,
    );

    // ۴. ثبت در Audit Log
    await auditLogService.log({
      user_id: userId,
      action: "PROJECT_CREATED",
      entity_type: "Project",
      entity_id: newProject.id,
      old_value: null,
      new_value: {
        name: newProject.name,
        client_id: newProject.client_id,
        status: newProject.status,
      },
      reason: "New project initialization via application layer",
    });

    return newProject;
  }

  async createProjectWithTeam(
    command: CreateProjectCommand,
    userId: string,
    teamMembers: { userId: string; role: ProjectRole }[],
  ): Promise<Project> {
    if (!teamMembers || teamMembers.length === 0) {
      throw new Error("At least one team member is required");
    }

    const project = await this.createProject(command, userId);

    for (const member of teamMembers) {
      await this.addProjectMember(
        project.id,
        member.userId,
        member.role,
        userId,
      );
    }

    return project;
  }

  async updateProject(
    id: string,
    data: Partial<Project>,
    userId: string,
    userGlobalRole: string,
  ): Promise<Project> {
    // بررسی مجوز دسترسی داده‌ای (Data-Level Authorization)
    const isAuthorized = await this.authorizeProjectAction(
      id,
      userId,
      userGlobalRole,
      "PROJECT_MANAGER",
    );

    if (!isAuthorized) {
      throw new Error(
        "Access Denied: You are not the Project Manager of this project.",
      );
    }

    const oldProject = await this.repository.getById(id);
    const updatedProject = await this.repository.update(id, data);

    // انتشار ایونت
    publishEvent(
      "project.updated",
      {
        projectId: updatedProject.id,
        changes: data,
      },
      userId,
    );

    // ثبت آدیت
    await auditLogService.log({
      user_id: userId,
      action: "PROJECT_UPDATED",
      entity_type: "Project",
      entity_id: updatedProject.id,
      old_value: oldProject,
      new_value: updatedProject,
      reason: "Project details updated by manager",
    });

    return updatedProject;
  }

  // ✅ قانون ۳ و ۹: حذف پروژه
  async deleteProject(
    id: string,
    userId: string,
    userGlobalRole: string,
  ): Promise<void> {
    const isAuthorized = await this.authorizeProjectAction(
      id,
      userId,
      userGlobalRole,
      "PROJECT_MANAGER",
    );

    if (!isAuthorized) {
      throw new Error(
        "Access Denied: You are not the Project Manager of this project.",
      );
    }

    const oldProject = await this.repository.getById(id);
    await this.repository.delete(id);

    publishEvent(
      "project.deleted",
      {
        projectId: id,
        name: oldProject?.name,
      },
      userId,
    );

    await auditLogService.log({
      user_id: userId,
      action: "PROJECT_DELETED",
      entity_type: "Project",
      entity_id: id,
      old_value: oldProject,
      new_value: null,
      reason: "Project deleted by manager",
    });
  }

  // ═══════════════════════════════════════
  // 👥 Member Management (با ایونت و آدیت)
  // ═══════════════════════════════════════

  async addProjectMember(
    projectId: string,
    userIdToAdd: string,
    role: ProjectRole,
    actionByUserId: string, // کسی که این عملیات را انجام می‌دهد
  ): Promise<ProjectMember> {
    const newMember = await this.repository.addMember(
      projectId,
      userIdToAdd,
      role,
    );

    publishEvent(
      "project.member.added",
      {
        projectId,
        userId: userIdToAdd,
        role,
      },
      actionByUserId,
    );

    await auditLogService.log({
      user_id: actionByUserId,
      action: "PROJECT_MEMBER_ADDED",
      entity_type: "ProjectMember",
      entity_id: newMember.id,
      old_value: null,
      new_value: { projectId, userId: userIdToAdd, role },
      reason: `Added user as ${role}`,
    });

    return newMember;
  }

  async removeProjectMember(
    projectId: string,
    userIdToRemove: string,
    role: ProjectRole,
    actionByUserId: string,
  ): Promise<void> {
    await this.repository.removeMember(projectId, userIdToRemove, role);

    publishEvent(
      "project.member.removed",
      {
        projectId,
        userId: userIdToRemove,
        role,
      },
      actionByUserId,
    );

    await auditLogService.log({
      user_id: actionByUserId,
      action: "PROJECT_MEMBER_REMOVED",
      entity_type: "ProjectMember",
      entity_id: `${projectId}_${userIdToRemove}`,
      old_value: { projectId, userId: userIdToRemove, role },
      new_value: null,
      reason: `Removed user with role ${role}`,
    });
  }

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return await this.repository.getMembers(projectId);
  }

  async getUserProjectRole(
    projectId: string,
    userId: string,
  ): Promise<ProjectRole | null> {
    return await this.repository.getUserRole(projectId, userId);
  }

  // ═══════════════════════════════════════
  // 🔐 Authorization Helper
  // ═══════════════════════════════════════

  async authorizeProjectAction(
    projectId: string,
    userId: string,
    userGlobalRole: string,
    requiredDataRole: ProjectRole,
  ): Promise<boolean> {
    if (userGlobalRole === "admin" || userGlobalRole === "super_admin")
      return true;

    const userDataRole = await this.repository.getUserRole(projectId, userId);
    if (!userDataRole) return false;

    return ROLE_HIERARCHY[userDataRole] >= ROLE_HIERARCHY[requiredDataRole];
  }
}

export const projectAppService = new ProjectApplicationService();
