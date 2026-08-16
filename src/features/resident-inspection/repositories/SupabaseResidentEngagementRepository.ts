// src/features/resident-inspection/repositories/SupabaseResidentEngagementRepository.ts

import { supabase } from "@shared/database/supabase";
import { applyDepartmentFilter } from "@/shared/data-access/withDepartmentFilter";
import type { ResidentEngagement } from "../domain/types";
import type { IResidentEngagementRepository } from "./IResidentEngagementRepository";

export class SupabaseResidentEngagementRepository implements IResidentEngagementRepository {
  private table() {
    return supabase.schema("tpi").from("resident_engagements");
  }

  private normalizeDates<T extends Partial<ResidentEngagement>>(data: T): T {
    const normalize = (value: string | null | undefined) =>
      value ? value.replace(/\//g, "-") : value;

    return {
      ...data,
      ...(data.planned_start_date !== undefined && {
        planned_start_date: normalize(data.planned_start_date),
      }),
      ...(data.planned_end_date !== undefined && {
        planned_end_date: normalize(data.planned_end_date),
      }),
      ...(data.actual_start_date !== undefined && {
        actual_start_date: normalize(data.actual_start_date),
      }),
      ...(data.actual_end_date !== undefined && {
        actual_end_date: normalize(data.actual_end_date),
      }),
    } as T;
  }

  async getAll(): Promise<ResidentEngagement[]> {
    let query = this.table()
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    query = applyDepartmentFilter(query, "department");
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as ResidentEngagement[]) || [];
  }

  async getById(id: string): Promise<ResidentEngagement | null> {
    let query = this.table().select("*").eq("id", id).eq("is_deleted", false);
    query = applyDepartmentFilter(query, "department");
    const { data, error } = await query.single();
    if (error || !data) return null;
    return data as ResidentEngagement;
  }

  async getByProject(projectId: string): Promise<ResidentEngagement[]> {
    let query = this.table()
      .select("*")
      .eq("project_id", projectId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });
    query = applyDepartmentFilter(query, "department");
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as ResidentEngagement[]) || [];
  }

  async create(
    data: Omit<ResidentEngagement, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentEngagement> {
    const id = `res_eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: record, error } = await this.table()
      .insert({
        id,
        ...this.normalizeDates(data),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentEngagement;
  }

  async update(
    id: string,
    data: Partial<ResidentEngagement>,
  ): Promise<ResidentEngagement> {
    const { data: record, error } = await this.table()
      .update({
        ...this.normalizeDates(data),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return record as ResidentEngagement;
  }
}

export const residentEngagementRepository =
  new SupabaseResidentEngagementRepository();
