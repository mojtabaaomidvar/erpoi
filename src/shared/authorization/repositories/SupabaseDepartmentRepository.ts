//src/shared/authorization/repositories/SupabaseDepartmentRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Department } from "../domain/models/Department";
import type { IDepartmentRepository } from "../domain/repositories/IDepartmentRepository";

export class SupabaseDepartmentRepository implements IDepartmentRepository {
  async getAll(): Promise<Department[]> {
    const { data, error } = await supabase
      .schema("core")
      .from("departments")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[SupabaseDepartmentRepository] Failed to get departments:", error);
      return [];
    }
    return (data || []) as Department[];
  }

  async getById(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .schema("core")
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Department;
  }

  async create(department: Omit<Department, "id" | "created_at" | "updated_at">): Promise<Department> {
    const id = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .schema("core")
      .from("departments")
      .insert({
        id,
        name: department.name,
        description: department.description || "",
      })
      .select()
      .single();

    if (error) {
      console.error("[SupabaseDepartmentRepository] Failed to create department:", error);
      throw new Error(error.message);
    }

    return data as Department;
  }

  async update(id: string, department: Partial<Department>): Promise<Department> {
    const { data, error } = await supabase
      .schema("core")
      .from("departments")
      .update({
        name: department.name,
        description: department.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SupabaseDepartmentRepository] Failed to update department:", error);
      throw new Error(error.message);
    }

    return data as Department;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("core")
      .from("departments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[SupabaseDepartmentRepository] Failed to delete department:", error);
      throw new Error(error.message);
    }
  }
}