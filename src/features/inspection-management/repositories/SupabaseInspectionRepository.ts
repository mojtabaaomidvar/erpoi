// src/features/inspection-management/repositories/SupabaseInspectionRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Inspection } from "../domain/types";
import type { IInspectionRepository } from "./IInspectionRepository";

export class SupabaseInspectionRepository implements IInspectionRepository {
  async getAll(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<Inspection | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Inspection;
  }

  async getByInspectionRequest(requestId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .eq("inspection_request_id", requestId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<Inspection, "id" | "created_at" | "updated_at">,
  ): Promise<Inspection> {
    const id = `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as Inspection;
  }

  async update(id: string, data: Partial<Inspection>): Promise<Inspection> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as Inspection;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("inspections")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const inspectionRepository = new SupabaseInspectionRepository();
