// src/features/inspection-management/repositories/SupabaseChecklistRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Checklist } from "../domain/types";
import type { IChecklistRepository } from "./IChecklistRepository";

export class SupabaseChecklistRepository implements IChecklistRepository {
  async getAll(): Promise<Checklist[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("checklists")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<Checklist | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("checklists")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Checklist;
  }

  async getByInspection(inspectionId: string): Promise<Checklist[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("checklists")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<Checklist, "id" | "created_at" | "updated_at">,
  ): Promise<Checklist> {
    const id = `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("checklists")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as Checklist;
  }

  async update(id: string, data: Partial<Checklist>): Promise<Checklist> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("checklists")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as Checklist;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("checklists")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const checklistRepository = new SupabaseChecklistRepository();
