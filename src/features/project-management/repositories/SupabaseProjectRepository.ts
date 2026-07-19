// src/features/project-management/repositories/SupabaseProjectRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Project, ProjectMember, ProjectRole } from "../domain/types";
import type { IProjectRepository } from "./IProjectRepository";

export class SupabaseProjectRepository implements IProjectRepository {
  async getAll(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects.projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects.projects")
      .select("*, members:project_members(*)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Project;
  }

  async getByContract(contractId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects.projects")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getByClient(clientId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects.projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<Project, "id" | "created_at" | "updated_at">,
  ): Promise<Project> {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: project, error } = await supabase
      .from("projects.projects")
      .insert({ ...data, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return project as Project;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const { data: project, error } = await supabase
      .from("projects.projects")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return project as Project;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects.projects")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  // Member Management

  async addMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ProjectMember> {
    if (!userId || userId.trim() === "") {
      throw new Error("Cannot add member: userId is required");
    }
    if (!projectId || projectId.trim() === "") {
      throw new Error("Cannot add member: projectId is required");
    }

    const { data: existing } = await supabase
      .from("projects.project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (existing) {
      return existing as ProjectMember;
    }
    const id = `pmem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .from("projects.project_members")
      .insert({ id, project_id: projectId, user_id: userId, role })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: fallback } = await supabase
          .from("projects.project_members")
          .select("*")
          .eq("project_id", projectId)
          .eq("user_id", userId)
          .eq("role", role)
          .single();
        return fallback as ProjectMember;
      }
      throw new Error(error.message);
    }

    return data as ProjectMember;
  }

  async removeMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<void> {
    const { error } = await supabase
      .from("projects.project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw new Error(error.message);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from("projects.project_members")
      .select("*, user:users(id, full_name, username, email)")
      .eq("project_id", projectId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getUserRole(
    projectId: string,
    userId: string,
  ): Promise<ProjectRole | null> {
    const { data, error } = await supabase
      .from("projects.project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data.role as ProjectRole;
  }
}

// Singleton Export
export const projectRepository = new SupabaseProjectRepository();
