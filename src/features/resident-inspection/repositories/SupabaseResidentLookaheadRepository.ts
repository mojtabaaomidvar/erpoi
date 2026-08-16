// src/features/resident-inspection/repositories/SupabaseResidentLookaheadRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentLookaheadActivity } from "../domain/types";
import type { IResidentLookaheadRepository } from "./IResidentLookaheadRepository";

type ResidentLookaheadRow = Omit<
  ResidentLookaheadActivity,
  "status" | "categories" | "vendor_or_site" | "required_documents"
> & {
  lookahead_status: ResidentLookaheadActivity["status"] | "IN_PROGRESS";
  required_resources?: string;
  linked_activity_id?: string;
};

function toDomain(row: ResidentLookaheadRow): ResidentLookaheadActivity {
  return {
    ...row,
    status:
      row.lookahead_status === "IN_PROGRESS"
        ? "CONFIRMED"
        : row.lookahead_status,
    required_documents: row.required_resources
      ? row.required_resources.split("\n").filter(Boolean)
      : undefined,
  };
}

function toPersistence(
  activity: Partial<ResidentLookaheadActivity>,
): Partial<ResidentLookaheadRow> {
  const {
    status,
    categories: _categories,
    vendor_or_site: _vendorOrSite,
    required_documents,
    ...persisted
  } = activity;

  return {
    ...persisted,
    ...(status ? { lookahead_status: status } : {}),
    ...(required_documents !== undefined
      ? { required_resources: required_documents.join("\n") }
      : {}),
  };
}

export class SupabaseResidentLookaheadRepository implements IResidentLookaheadRepository {
  private table() {
    return supabase.schema("tpi").from("resident_lookahead_activities");
  }

  async getById(id: string): Promise<ResidentLookaheadActivity | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toDomain(data as ResidentLookaheadRow);
  }

  async getByEngagement(
    engagementId: string,
  ): Promise<ResidentLookaheadActivity[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("planned_start_date", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data as ResidentLookaheadRow[]) || []).map(toDomain);
  }

  async getUpcoming(
    engagementId: string,
    daysAhead: number = 14,
  ): Promise<ResidentLookaheadActivity[]> {
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .gte("planned_start_date", today)
      .lte("planned_start_date", futureDate)
      .order("planned_start_date", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data as ResidentLookaheadRow[]) || []).map(toDomain);
  }

  async create(
    data: Omit<ResidentLookaheadActivity, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentLookaheadActivity> {
    const id = `res_lka_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: record, error } = await this.table()
      .insert({
        id,
        ...toPersistence(data),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(record as ResidentLookaheadRow);
  }

  async update(
    id: string,
    data: Partial<ResidentLookaheadActivity>,
  ): Promise<ResidentLookaheadActivity> {
    const { data: record, error } = await this.table()
      .update({ ...toPersistence(data), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(record as ResidentLookaheadRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table().delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const residentLookaheadRepository =
  new SupabaseResidentLookaheadRepository();
