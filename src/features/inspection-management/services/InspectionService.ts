// src/features/inspection/services/InspectionService.ts

import { supabase } from "@shared/database/supabase";

class InspectionService {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[InspectionService] Failed to get inspections:", error);
      return [];
    }

    return data || [];
  }

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("inspections")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async create(inspection: any): Promise<any> {
    const id = `ins_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from("inspections")
      .insert({
        id,
        ...inspection,
      })
      .select()
      .single();

    if (error) {
      console.error("[InspectionService] Failed to create inspection:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, inspection: any): Promise<any> {
    const { data, error } = await supabase
      .from("inspections")
      .update({
        ...inspection,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[InspectionService] Failed to update inspection:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("inspections")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[InspectionService] Failed to delete inspection:", error);
      throw new Error(error.message);
    }
  }
}

export const inspectionService = new InspectionService();