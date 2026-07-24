import type { IProjectRepository } from "../repositories/IProjectRepository";
import type { Project, ProjectMember, ProjectRole } from "../domain/types";
import {
  CreateProjectSchema,
  type CreateProjectCommand,
} from "./dto/CreateProjectCommand";
import { publishEvent } from "@infra/events/publishEvent";

const ROLE_HIERARCHY: Record<ProjectRole, number> = {
  INSPECTOR: 2,
  COORDINATOR: 3,
  PROJECT_MANAGER: 4,
};

export class ProjectApplicationService {
  // ✅ تزریق وابستگی از طریق Constructor (اصل Dependency Inversion)
  constructor(private readonly repository: IProjectRepository) {}

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
      description: validatedData.description || "",
    });

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
    if (!oldProject) throw new Error("Project not found");

    const updatedProject = await this.repository.update(id, data);

    publishEvent(
      "project.updated",
      {
        projectId: updatedProject.id,
        oldData: oldProject,
        newData: updatedProject,
      },
      userId,
    );

    return updatedProject;
  }

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
  }

  async addProjectMember(
    projectId: string,
    userIdToAdd: string,
    role: ProjectRole,
    actionByUserId: string,
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

  private async authorizeProjectAction(
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
