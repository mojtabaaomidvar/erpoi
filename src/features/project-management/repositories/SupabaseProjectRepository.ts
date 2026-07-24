// src/features/project-management/repositories/SupabaseProjectRepository.ts

import { supabase } from "@shared/database/supabase";
import {
  applyDepartmentFilter,
  getDepartmentFilter,
} from "@/shared/data-access/withDepartmentFilter";
import type { Project, ProjectMember, ProjectRole } from "../domain/types";
import type { IProjectRepository } from "./IProjectRepository";

export class SupabaseProjectRepository implements IProjectRepository {
  // ✅ متد کمکی برای دریافت و ترکیب اطلاعات کاربران به صورت دستی (بدون نیاز به FK)
  private async enrichMembersWithUserData(
    members: any[],
  ): Promise<ProjectMember[]> {
    if (!members || members.length === 0) return [];

    const userIds = [...new Set(members.map((m) => m.user_id).filter(Boolean))];
    if (userIds.length === 0) {
      return members.map((m) => ({ ...m, user: undefined }));
    }

    // ⚠️ نکته: اگر جدول users شما در schema پیش‌فرض (public) است، "core" را به "public" تغییر دهید
    const { data: users, error: usersError } = await supabase
      .schema("core")
      .from("users")
      .select("id, full_name, username, email, role")
      .in("id", userIds);

    if (usersError) {
      console.warn(
        "[SupabaseProjectRepository] Failed to fetch users:",
        usersError,
      );
    }

    const usersMap = new Map((users || []).map((u) => [u.id, u]));

    return members.map((m) => ({
      ...m,
      user: usersMap.get(m.user_id) || undefined,
    }));
  }

  // ✅ متد کمکی برای دریافت اطلاعات مشتری
  private async enrichProjectWithClient(project: any): Promise<any> {
    if (!project || !project.client_id) return project;

    const { data: client } = await supabase
      .schema("crm")
      .from("clients")
      .select("id, name_en, name_fa")
      .eq("id", project.client_id)
      .single();

    return client ? { ...project, client } : project;
  }

  async getAll(): Promise<Project[]> {
    let query = supabase
      .schema("projects")
      .from("projects")
      .select("*") // ❌ بدون هیچگونه join دستی
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const projectIds = data.map((p) => p.id);

    // 1. دریافت تمام اعضای این پروژه‌ها
    const { data: allMembers } = await supabase
      .schema("projects")
      .from("project_members")
      .select("*")
      .in("project_id", projectIds);

    // 2. دریافت اطلاعات کاربران مرتبط (یکبار برای همه)
    const allUserIds = [
      ...new Set((allMembers || []).map((m) => m.user_id).filter(Boolean)),
    ];
    let usersMap = new Map<string, any>();
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .schema("core") // ⚠️ اگر جدول users در public است، "public" بگذارید
        .from("users")
        .select("id, full_name, username, email, role")
        .in("id", allUserIds);
      usersMap = new Map((users || []).map((u) => [u.id, u]));
    }

    // 3. دریافت اطلاعات مشتریان مرتبط (یکبار برای همه)
    const clientIds = [
      ...new Set(data.map((p) => p.client_id).filter(Boolean)),
    ];
    let clientsMap = new Map<string, any>();
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .schema("crm")
        .from("clients")
        .select("id, name_en, name_fa")
        .in("id", clientIds);
      clientsMap = new Map((clients || []).map((c) => [c.id, c]));
    }

    // 4. ترکیب نهایی داده‌ها در حافظه (Memory)
    return data.map((p) => {
      const projectMembers = (allMembers || []).filter(
        (m) => m.project_id === p.id,
      );
      const enrichedMembers = projectMembers.map((m) => ({
        ...m,
        user: usersMap.get(m.user_id) || undefined,
      }));

      return {
        ...p,
        members: enrichedMembers,
        client: clientsMap.get(p.client_id) || null,
      } as Project;
    });
  }

  async getById(id: string): Promise<Project | null> {
    let query = supabase
      .schema("projects")
      .from("projects")
      .select("*") // ❌ بدون join
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query.single();
    if (error || !data) return null;

    // دریافت members و client به صورت جداگانه
    const { data: members } = await supabase
      .schema("projects")
      .from("project_members")
      .select("*")
      .eq("project_id", id);

    const enrichedMembers = await this.enrichMembersWithUserData(members || []);
    const enrichedProject = await this.enrichProjectWithClient(data);

    return {
      ...enrichedProject,
      members: enrichedMembers,
    } as Project;
  }

  async getByContract(contractId: string): Promise<Project[]> {
    let query = supabase
      .schema("projects")
      .from("projects")
      .select("*") // ❌ بدون join
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const projectIds = data.map((p) => p.id);
    const { data: allMembers } = await supabase
      .schema("projects")
      .from("project_members")
      .select("*")
      .in("project_id", projectIds);

    const allUserIds = [
      ...new Set((allMembers || []).map((m) => m.user_id).filter(Boolean)),
    ];
    let usersMap = new Map<string, any>();
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .schema("core")
        .from("users")
        .select("id, full_name, username, email, role")
        .in("id", allUserIds);
      usersMap = new Map((users || []).map((u) => [u.id, u]));
    }

    const clientIds = [
      ...new Set(data.map((p) => p.client_id).filter(Boolean)),
    ];
    let clientsMap = new Map<string, any>();
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .schema("crm")
        .from("clients")
        .select("id, name_en, name_fa")
        .in("id", clientIds);
      clientsMap = new Map((clients || []).map((c) => [c.id, c]));
    }

    return data.map((p) => {
      const projectMembers = (allMembers || []).filter(
        (m) => m.project_id === p.id,
      );
      return {
        ...p,
        members: projectMembers.map((m) => ({
          ...m,
          user: usersMap.get(m.user_id) || undefined,
        })),
        client: clientsMap.get(p.client_id) || null,
      } as Project;
    });
  }

  async getByClient(clientId: string): Promise<Project[]> {
    let query = supabase
      .schema("projects")
      .from("projects")
      .select("*") // ❌ بدون join
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    query = applyDepartmentFilter(query, "department");

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];

    const projectIds = data.map((p) => p.id);
    const { data: allMembers } = await supabase
      .schema("projects")
      .from("project_members")
      .select("*")
      .in("project_id", projectIds);

    const allUserIds = [
      ...new Set((allMembers || []).map((m) => m.user_id).filter(Boolean)),
    ];
    let usersMap = new Map<string, any>();
    if (allUserIds.length > 0) {
      const { data: users } = await supabase
        .schema("core")
        .from("users")
        .select("id, full_name, username, email, role")
        .in("id", allUserIds);
      usersMap = new Map((users || []).map((u) => [u.id, u]));
    }

    const clientIds = [
      ...new Set(data.map((p) => p.client_id).filter(Boolean)),
    ];
    let clientsMap = new Map<string, any>();
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .schema("crm")
        .from("clients")
        .select("id, name_en, name_fa")
        .in("id", clientIds);
      clientsMap = new Map((clients || []).map((c) => [c.id, c]));
    }

    return data.map((p) => {
      const projectMembers = (allMembers || []).filter(
        (m) => m.project_id === p.id,
      );
      return {
        ...p,
        members: projectMembers.map((m) => ({
          ...m,
          user: usersMap.get(m.user_id) || undefined,
        })),
        client: clientsMap.get(p.client_id) || null,
      } as Project;
    });
  }

  async create(
    data: Omit<Project, "id" | "created_at" | "updated_at">,
  ): Promise<Project> {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentDept = getDepartmentFilter();

    const { data: project, error } = await supabase
      .schema("projects")
      .from("projects")
      .insert({
        ...data,
        id,
        department:
          currentDept !== null ? currentDept : (data as any).department || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return project as Project;
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    let query = supabase
      .schema("projects")
      .from("projects")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { data: project, error } = await query.select().single();
    if (error) throw new Error(error.message);
    return project as Project;
  }

  async delete(id: string): Promise<void> {
    let query = supabase
      .schema("projects")
      .from("projects")
      .delete()
      .eq("id", id);

    query = applyDepartmentFilter(query, "department");

    const { error } = await query;
    if (error) throw new Error(error.message);
  }

  async addMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
  ): Promise<ProjectMember> {
    if (!userId || userId.trim() === "")
      throw new Error("Cannot add member: userId is required");
    if (!projectId || projectId.trim() === "")
      throw new Error("Cannot add member: projectId is required");

    const { data: existing } = await supabase
      .schema("projects")
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (existing) return existing as ProjectMember;

    const id = `pmem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .schema("projects")
      .from("project_members")
      .insert({ id, project_id: projectId, user_id: userId, role })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: fallback } = await supabase
          .schema("projects")
          .from("project_members")
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
      .schema("projects")
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw new Error(error.message);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .schema("projects")
      .from("project_members")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw new Error(error.message);
    return this.enrichMembersWithUserData(data || []);
  }

  async getUserRole(
    projectId: string,
    userId: string,
  ): Promise<ProjectRole | null> {
    const { data, error } = await supabase
      .schema("projects")
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data.role as ProjectRole;
  }
}

export const projectRepository = new SupabaseProjectRepository();
