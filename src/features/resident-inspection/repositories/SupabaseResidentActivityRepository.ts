// src/features/resident-inspection/repositories/SupabaseResidentActivityRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentDailyActivity } from "../domain/types";
import type { IResidentActivityRepository } from "./IResidentActivityRepository";

type ResidentActivityRow = Omit<
  ResidentDailyActivity,
  | "resident_assignment_id"
  | "inspector_id"
  | "status"
  | "outcome"
  | "hours_spent"
  | "vendor_or_site"
  | "reference_document"
  | "notes"
  | "weather_conditions"
  | "activity_type"
> & {
  activity_type:
    | Exclude<ResidentDailyActivity["activity_type"], "INSPECTION" | "TRAINING">
    | "ROUTINE_INSPECTION"
    | "ITP_MONITORING"
    | "QUALITY_CHECK";
  linked_assignment_id?: string;
  performed_by?: string;
  activity_status: ResidentDailyActivity["status"];
  result_outcome?: string;
  deferral_reason?: string;
};

function normalizeActivityType(
  type: ResidentDailyActivity["activity_type"],
): ResidentActivityRow["activity_type"] {
  if (type === "INSPECTION") return "ROUTINE_INSPECTION";
  if (type === "TRAINING") return "OTHER";
  return type;
}

function toDomain(row: ResidentActivityRow): ResidentDailyActivity {
  return {
    ...row,
    activity_type:
      row.activity_type === "ROUTINE_INSPECTION"
        ? "INSPECTION"
        : row.activity_type === "ITP_MONITORING" ||
            row.activity_type === "QUALITY_CHECK"
          ? "OTHER"
          : row.activity_type,
    resident_assignment_id: row.linked_assignment_id,
    inspector_id: row.performed_by || "",
    status: row.activity_status,
    outcome: row.result_outcome,
    notes: row.deferral_reason,
    hours_spent: 0,
  } as ResidentDailyActivity;
}

function toPersistence(
  activity: Partial<ResidentDailyActivity>,
): Partial<ResidentActivityRow> {
  const {
    resident_assignment_id,
    inspector_id,
    status,
    outcome,
    hours_spent: _hoursSpent,
    vendor_or_site: _vendorOrSite,
    reference_document: _referenceDocument,
    notes,
    weather_conditions: _weatherConditions,
    activity_type,
    ...persisted
  } = activity;

  return {
    ...persisted,
    ...(resident_assignment_id !== undefined
      ? { linked_assignment_id: resident_assignment_id }
      : {}),
    ...(inspector_id !== undefined
      ? { performed_by: inspector_id || null }
      : {}),
    ...(status ? { activity_status: status } : {}),
    ...(outcome !== undefined ? { result_outcome: outcome } : {}),
    ...(notes !== undefined ? { deferral_reason: notes } : {}),
    ...(activity_type
      ? { activity_type: normalizeActivityType(activity_type) }
      : {}),
  } as Partial<ResidentActivityRow>;
}

export class SupabaseResidentActivityRepository implements IResidentActivityRepository {
  private table() {
    return supabase.schema("tpi").from("resident_activities");
  }

  async getById(id: string): Promise<ResidentDailyActivity | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toDomain(data as ResidentActivityRow);
  }

  async getByEngagement(
    engagementId: string,
  ): Promise<ResidentDailyActivity[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("activity_date", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data as ResidentActivityRow[]) || []).map(toDomain);
  }

  async getByEngagementAndDate(
    engagementId: string,
    activityDate: string,
  ): Promise<ResidentDailyActivity[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .eq("activity_date", activityDate)
      .order("planned_start_time", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data as ResidentActivityRow[]) || []).map(toDomain);
  }

  async create(
    data: Omit<ResidentDailyActivity, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentDailyActivity> {
    const id = `res_act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    return toDomain(record as ResidentActivityRow);
  }

  async update(
    id: string,
    data: Partial<ResidentDailyActivity>,
  ): Promise<ResidentDailyActivity> {
    const { data: record, error } = await this.table()
      .update({ ...toPersistence(data), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(record as ResidentActivityRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table().delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const residentActivityRepository =
  new SupabaseResidentActivityRepository();
