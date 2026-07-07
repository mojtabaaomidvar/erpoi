// src/shared/authorization/services/PermissionMappingService.ts

import { supabase } from '@shared/database/supabase';
import type { DBPermissionMapping } from '@shared/database/types';

class PermissionMappingService {
  async getAll(): Promise<DBPermissionMapping[]> {
    const { data, error } = await supabase
      .from('permission_mappings')
      .select('*');

    if (error) {
      console.error('[PermissionMappingService] Failed to get mappings:', error);
      return [];
    }

    return (data || []).map(m => ({
      permission: m.permission,
      allowedElements: m.allowed_elements || [],
      deniedElements: m.denied_elements || [],
      updatedAt: m.updated_at,
    }));
  }

  async setMapping(permission: string, allowed: string[], denied: string[] = []): Promise<void> {
    const { error } = await supabase
      .from('permission_mappings')
      .upsert({
        permission,
        allowed_elements: allowed,
        denied_elements: denied,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[PermissionMappingService] Failed to set mapping:', error);
      throw new Error(error.message);
    }
  }

  async deleteMapping(permission: string): Promise<void> {
    const { error } = await supabase
      .from('permission_mappings')
      .delete()
      .eq('permission', permission);

    if (error) {
      console.error('[PermissionMappingService] Failed to delete mapping:', error);
      throw new Error(error.message);
    }
  }

  async getByPermission(permission: string): Promise<DBPermissionMapping | null> {
    const { data, error } = await supabase
      .from('permission_mappings')
      .select('*')
      .eq('permission', permission)
      .single();

    if (error || !data) return null;
    return {
      permission: data.permission,
      allowedElements: data.allowed_elements || [],
      deniedElements: data.denied_elements || [],
      updatedAt: data.updated_at,
    };
  }
}

export const permissionMappingService = new PermissionMappingService();