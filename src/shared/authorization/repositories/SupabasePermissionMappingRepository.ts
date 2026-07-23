//src/shared/authorization/repositories/SupabasePermissionMappingRepository.ts

import { supabase } from "@shared/database/supabase";
import type { PermissionMapping } from "../domain/models/PermissionMapping";
import type { IPermissionMappingRepository } from "../domain/repositories/IPermissionMappingRepository";

export class SupabasePermissionMappingRepository implements IPermissionMappingRepository {
  private mapToDomain(data: any): PermissionMapping {
    return {
      permission: data.permission,
      allowedElements: data.allowed_elements || [],
      deniedElements: data.denied_elements || [],
      updatedAt: data.updated_at,
    };
  }

  async getAll(): Promise<PermissionMapping[]> {
    const { data, error } = await supabase
      .schema("core")
      .from("permission_mappings")
      .select("*");

    if (error) {
      console.error("[SupabasePermissionMappingRepository] Failed to get mappings:", error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getByPermission(permission: string): Promise<PermissionMapping | null> {
    const { data, error } = await supabase
      .schema("core")
      .from("permission_mappings")
      .select("*")
      .eq("permission", permission)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async setMapping(permission: string, allowed: string[], denied: string[] = []): Promise<void> {
    const { error } = await supabase
      .schema("core")
      .from("permission_mappings")
      .upsert({
        permission,
        allowed_elements: allowed,
        denied_elements: denied,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("[SupabasePermissionMappingRepository] Failed to set mapping:", error);
      throw new Error(error.message);
    }
  }

  async deleteMapping(permission: string): Promise<void> {
    const { error } = await supabase
      .schema("core")
      .from("permission_mappings")
      .delete()
      .eq("permission", permission);

    if (error) {
      console.error("[SupabasePermissionMappingRepository] Failed to delete mapping:", error);
      throw new Error(error.message);
    }
  }
}