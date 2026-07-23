// src/features/inspection-management/repositories/SupabaseNCRRepository.ts

import { supabase } from "@shared/database/supabase";
import type { NonConformity } from "../domain/types";
import type { INCRRepository } from "./INCRRepository";

export class SupabaseNCRRepository implements INCRRepository {
  async getAll(): Promise<NonConformity[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<NonConformity | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as NonConformity;
  }

  async getByInspection(inspectionId: string): Promise<NonConformity[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<NonConformity, "id" | "created_at" | "updated_at">,
  ): Promise<NonConformity> {
    const id = `ncr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ncr_number = `NCR-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}`;

    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .insert({
        id,
        ncr_number,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as NonConformity;
  }

  async update(
    id: string,
    data: Partial<NonConformity>,
  ): Promise<NonConformity> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as NonConformity;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("non_conformities")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const ncrRepository = new SupabaseNCRRepository();
