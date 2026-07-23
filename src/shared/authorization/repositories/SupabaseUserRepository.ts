//src/shared/authorization/repositories/SupabaseUserRepository.ts

import { supabase } from "@shared/database/supabase";
import type { User, UserStatus } from "@/shared/authorization";
import type {
  IUserRepository,
  CreateUserPayload,
  UpdateUserPayload,
} from "../domain/repositories/IUserRepository";

export class SupabaseUserRepository implements IUserRepository {
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

  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .schema("core")
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[SupabaseUserRepository] Failed to get users:", error);
      return [];
    }
    return (data || []).map(this.dbUserToUser);
  }

  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .schema("core")
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return this.dbUserToUser(data);
  }

  async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .schema("core")
      .from("users")
      .select("*")
      .eq("username", username.trim())
      .single();
    if (error || !data) return null;
    return this.dbUserToUser(data);
  }

  async getByDepartmentAndRole(
    departmentId: string,
    role: string,
  ): Promise<User | null> {
    const { data, error } = await supabase
      .schema("core")
      .from("users")
      .select("*")
      .eq("department", departmentId)
      .eq("role", role)
      .single();
    if (error || !data) return null;
    return this.dbUserToUser(data);
  }

  async create(payload: CreateUserPayload): Promise<User> {
    const { data, error } = await supabase
      .schema("core")
      .from("users")
      .insert({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...payload,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.dbUserToUser(data);
  }

  async update(id: string, payload: UpdateUserPayload): Promise<User> {
    const { data, error } = await supabase
      .schema("core")
      .from("users")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.dbUserToUser(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("core")
      .from("users")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const { error } = await supabase
      .schema("core")
      .from("users")
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}
