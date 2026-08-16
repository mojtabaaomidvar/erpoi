// src/features/resident-inspection/repositories/SupabaseResidentAssignmentRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ResidentAssignment } from "../domain/types";
import type { IResidentAssignmentRepository } from "./IResidentAssignmentRepository";

type ResidentAssignmentRow = Omit<
  ResidentAssignment,
  | "resident_engagement_id"
  | "assignment_date"
  | "planned_hours_per_day"
  | "status"
  | "role_description"
  | "disciplines"
  | "location"
  | "assigned_by"
  | "assigned_at"
  | "relieved_reason"
> & {
  resident_engagement_id: string;
  assignment_status: ResidentAssignment["status"];
  relief_reason?: string;
  notes?: string;
};

function toDomain(row: ResidentAssignmentRow): ResidentAssignment {
  return {
    ...row,
    assignment_date: row.planned_start_date,
    planned_hours_per_day: 8,
    status: row.assignment_status,
    role_description: row.notes,
    disciplines: [],
    relieved_reason: row.relief_reason,
  };
}

function toPersistence(
  assignment: Partial<ResidentAssignment>,
): Partial<ResidentAssignmentRow> {
  const {
    assignment_date: _assignmentDate,
    planned_hours_per_day: _plannedHoursPerDay,
    status,
    role_description,
    disciplines,
    location,
    assigned_by,
    assigned_at,
    relieved_reason,
    ...persisted
  } = assignment;

  void disciplines;
  void location;
  void assigned_by;
  void assigned_at;

  return {
    ...persisted,
    ...(status ? { assignment_status: status } : {}),
    ...(role_description !== undefined ? { notes: role_description } : {}),
    ...(relieved_reason !== undefined
      ? { relief_reason: relieved_reason }
      : {}),
  } as Partial<ResidentAssignmentRow>;
}

export class SupabaseResidentAssignmentRepository implements IResidentAssignmentRepository {
  private table() {
    return supabase.schema("tpi").from("resident_assignments");
  }

  async getById(id: string): Promise<ResidentAssignment | null> {
    const { data, error } = await this.table()
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toDomain(data as ResidentAssignmentRow);
  }

  async getByEngagement(engagementId: string): Promise<ResidentAssignment[]> {
    const { data, error } = await this.table()
      .select("*")
      .eq("resident_engagement_id", engagementId)
      .order("planned_start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data as ResidentAssignmentRow[]) || []).map(toDomain);
  }

  async create(
    data: Omit<ResidentAssignment, "id" | "created_at" | "updated_at">,
  ): Promise<ResidentAssignment> {
    const id = `res_asg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    return toDomain(record as ResidentAssignmentRow);
  }

  async update(
    id: string,
    data: Partial<ResidentAssignment>,
  ): Promise<ResidentAssignment> {
    const { data: record, error } = await this.table()
      .update({
        ...toPersistence(data),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toDomain(record as ResidentAssignmentRow);
  }
}

export const residentAssignmentRepository =
  new SupabaseResidentAssignmentRepository();
