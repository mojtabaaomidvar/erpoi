// src/features/resident-inspection/repositories/SupabaseResidentPeriodicReportRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentPeriodicReport } from "../domain/types";
import type { IResidentPeriodicReportRepository } from "./IResidentPeriodicReportRepository";

export class SupabaseResidentPeriodicReportRepository
  implements IResidentPeriodicReportRepository
{
  private table() {
    return supabase.schema("tpi").from("resident_periodic_reports");
  }

  async getById(id: string): Promise<ResidentPeriodicReport | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as ResidentPeriodicReport;
  }

  async getByEngagement(engagementId: string): Promise<ResidentPeriodicReport[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("report_period_end", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ResidentPeriodicReport[]) || [];
  }

  async create(
    data: Omit<ResidentPeriodicReport, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentPeriodicReport> {
    const id = `res_rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    return record as ResidentPeriodicReport;
  }

  async update(
    id: string,
    data: Partial<ResidentPeriodicReport>,
  ): Promise<ResidentPeriodicReport> {
    const { data: record, error } = await this.table()
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentPeriodicReport;
  }
}

export const residentPeriodicReportRepository =
  new SupabaseResidentPeriodicReportRepository();
