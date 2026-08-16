// src/features/resident-inspection/repositories/SupabaseResidentManDayRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentManDay } from "../domain/types";
import type { IResidentManDayRepository } from "./IResidentManDayRepository";

type ResidentManDayRow = Omit<
  ResidentManDay,
  "inspector_id" | "travel_hours" | "description" | "notes" | "activity_type"
> & {
  activity_type?: string;
  remarks?: string;
};

function normalizeManDayActivityType(type?: string): string | undefined {
  if (type === "DOCUMENTATION" || type === "REPORTING")
    return "DOCUMENT_REVIEW";
  if (type === "SITE_SUPERVISION") return "SURVEILLANCE";
  return type;
}

function toDomain(row: ResidentManDayRow): ResidentManDay {
  return {
    ...row,
    inspector_id: "",
    activity_type:
      row.activity_type === "DOCUMENT_REVIEW"
        ? "DOCUMENTATION"
        : row.activity_type === "SURVEILLANCE"
          ? "SITE_SUPERVISION"
          : (row.activity_type as ResidentManDay["activity_type"]),
    notes: row.remarks,
  };
}

function toPersistence(
  manDay: Partial<ResidentManDay>,
): Partial<ResidentManDayRow> {
  const {
    inspector_id: _inspectorId,
    travel_hours: _travelHours,
    description,
    notes,
    activity_type,
    ...persisted
  } = manDay;

  return {
    ...persisted,
    ...(activity_type
      ? { activity_type: normalizeManDayActivityType(activity_type) }
      : {}),
    ...(description !== undefined || notes !== undefined
      ? { remarks: notes ?? description }
      : {}),
  };
}

export class SupabaseResidentManDayRepository implements IResidentManDayRepository {
  private table() {
    return supabase.schema("tpi").from("resident_mandays");
  }

  async getById(id: string): Promise<ResidentManDay | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toDomain(data as ResidentManDayRow);
  }

  async getByEngagement(engagementId: string): Promise<ResidentManDay[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("work_date", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data as ResidentManDayRow[]) || []).map(toDomain);
  }

  async getByAssignment(assignmentId: string): Promise<ResidentManDay[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_assignment_id", assignmentId)
      .order("work_date", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data as ResidentManDayRow[]) || []).map(toDomain);
  }

  async getByAssignmentAndMonth(
    assignmentId: string,
    month: string,
  ): Promise<ResidentManDay[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_assignment_id", assignmentId)
      .like("work_date", `${month}%`)
      .order("work_date", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data as ResidentManDayRow[]) || []).map(toDomain);
  }

  async create(
    data: Omit<ResidentManDay, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentManDay> {
    const id = `res_man_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: record, error } = await this.table()
      .insert({
        id,
        ...toPersistence(data),
        day_of_week: new Date(`${data.work_date}T00:00:00`).getDay(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(record as ResidentManDayRow);
  }

  async update(
    id: string,
    data: Partial<ResidentManDay>,
  ): Promise<ResidentManDay> {
    const { data: record, error } = await this.table()
      .update({ ...toPersistence(data), updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(record as ResidentManDayRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.table().delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const residentManDayRepository = new SupabaseResidentManDayRepository();
