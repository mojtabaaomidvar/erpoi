// src/features/resident-inspection/repositories/SupabaseResidentITPMonitoringRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentITPMonitoring } from "../domain/types";
import type { IResidentITPMonitoringRepository } from "./IResidentITPMonitoringRepository";

export class SupabaseResidentITPMonitoringRepository
  implements IResidentITPMonitoringRepository
{
  private table() {
    return supabase.schema("tpi").from("resident_itp_monitoring");
  }

  async getById(id: string): Promise<ResidentITPMonitoring | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as ResidentITPMonitoring;
  }

  async getByEngagement(engagementId: string): Promise<ResidentITPMonitoring[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("planned_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ResidentITPMonitoring[]) || [];
  }

  async getPending(engagementId: string): Promise<ResidentITPMonitoring[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .eq("status", "PENDING")
      .order("planned_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ResidentITPMonitoring[]) || [];
  }

  async create(
    data: Omit<ResidentITPMonitoring, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentITPMonitoring> {
    const id = `res_itp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    return record as ResidentITPMonitoring;
  }

  async update(
    id: string,
    data: Partial<ResidentITPMonitoring>,
  ): Promise<ResidentITPMonitoring> {
    const { data: record, error } = await this.table()
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentITPMonitoring;
  }
}

export const residentITPMonitoringRepository =
  new SupabaseResidentITPMonitoringRepository();
