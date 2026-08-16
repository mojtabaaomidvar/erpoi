// src/features/resident-inspection/repositories/SupabaseResidentCloseoutRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentCloseout } from "../domain/types";
import type { IResidentCloseoutRepository } from "./IResidentCloseoutRepository";

export class SupabaseResidentCloseoutRepository
  implements IResidentCloseoutRepository
{
  private table() {
    return supabase.schema("tpi").from("resident_closeouts");
  }

  async getById(id: string): Promise<ResidentCloseout | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as ResidentCloseout;
  }

  async getByEngagement(engagementId: string): Promise<ResidentCloseout | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .limit(1)
      .single();
    if (error || !data) return null;
    return data as ResidentCloseout;
  }

  async create(
    data: Omit<ResidentCloseout, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentCloseout> {
    const id = `res_co_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: record, error } = await this.table()
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentCloseout;
  }

  async update(
    id: string,
    data: Partial<ResidentCloseout>,
  ): Promise<ResidentCloseout> {
    const { data: record, error } = await this.table()
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentCloseout;
  }
}

export const residentCloseoutRepository =
  new SupabaseResidentCloseoutRepository();
