// src/features/inspection/services/InspectorService.ts

import { supabase } from "@shared/database/supabase";

class InspectorService {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from("inspectors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[InspectorService] Failed to get inspectors:", error);
      return [];
    }

    return data || [];
  }

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("inspectors")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async create(inspector: any): Promise<any> {
    const id = `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from("inspectors")
      .insert({
        id,
        ...inspector,
      })
      .select()
      .single();

    if (error) {
      console.error("[InspectorService] Failed to create inspector:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, inspector: any): Promise<any> {
    const { data, error } = await supabase
      .from("inspectors")
      .update({
        ...inspector,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[InspectorService] Failed to update inspector:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("inspectors")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[InspectorService] Failed to delete inspector:", error);
      throw new Error(error.message);
    }
  }
}

export const inspectorService = new InspectorService();