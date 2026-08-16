// src/features/resident-inspection/repositories/SupabaseResidentQualityIssueRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentQualityIssue } from "../domain/types";
import type { IResidentQualityIssueRepository } from "./IResidentQualityIssueRepository";

export class SupabaseResidentQualityIssueRepository
  implements IResidentQualityIssueRepository
{
  private table() {
    return supabase.schema("tpi").from("resident_quality_issues");
  }

  async getById(id: string): Promise<ResidentQualityIssue | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as ResidentQualityIssue;
  }

  async getByEngagement(engagementId: string): Promise<ResidentQualityIssue[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as ResidentQualityIssue[]) || [];
  }

  async getOpen(engagementId: string): Promise<ResidentQualityIssue[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .in("status", ["OPEN", "CORRECTIVE_ACTION", "VERIFICATION"])
      .order("severity", { ascending: true })
      .order("raised_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as ResidentQualityIssue[]) || [];
  }

  async create(
    data: Omit<ResidentQualityIssue, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentQualityIssue> {
    const id = `res_qi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    return record as ResidentQualityIssue;
  }

  async update(
    id: string,
    data: Partial<ResidentQualityIssue>,
  ): Promise<ResidentQualityIssue> {
    const { data: record, error } = await this.table()
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentQualityIssue;
  }
}

export const residentQualityIssueRepository =
  new SupabaseResidentQualityIssueRepository();
