// src/features/tpi-management/repositories/SupabaseInspectorAttendanceRepository.ts
import { supabase } from "@shared/database/supabase";
import type { InspectorAttendance, MonthlyAttendanceSummary } from "../domain/types";
import type { IInspectorAttendanceRepository } from "./IInspectorAttendanceRepository";

export class SupabaseInspectorAttendanceRepository implements IInspectorAttendanceRepository {
  async getAll(): Promise<InspectorAttendance[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .select("*")
      .order("attendance_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<InspectorAttendance | null> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as InspectorAttendance;
  }

  async getByResidentInspection(residentInspectionId: string): Promise<InspectorAttendance[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .select("*")
      .eq("resident_inspection_id", residentInspectionId)
      .order("attendance_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getByMonth(residentInspectionId: string, month: string): Promise<InspectorAttendance[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .select("*")
      .eq("resident_inspection_id", residentInspectionId)
      .like("attendance_date", `${month}%`)
      .order("attendance_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(data: Omit<InspectorAttendance, "id" | "created_at">): Promise<InspectorAttendance> {
    const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newRecord as InspectorAttendance;
  }

  async update(id: string, data: Partial<InspectorAttendance>): Promise<InspectorAttendance> {
    const { data: updatedRecord, error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as InspectorAttendance;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("tpi")
      .from("inspector_attendance")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async getMonthlySummary(residentInspectionId: string, month: string): Promise<MonthlyAttendanceSummary[]> {
    const attendances = await this.getByMonth(residentInspectionId, month);
    
    // Group by inspector
    const grouped = new Map<string, InspectorAttendance[]>();
    attendances.forEach((att) => {
      const existing = grouped.get(att.inspector_id) || [];
      existing.push(att);
      grouped.set(att.inspector_id, existing);
    });

    // Calculate summary for each inspector
    const summaries: MonthlyAttendanceSummary[] = [];
    for (const [inspectorId, records] of grouped.entries()) {
      const totalDays = records.length;
      const presentDays = records.filter((r) => r.status === "PRESENT").length;
      const absentDays = records.filter((r) => r.status === "ABSENT").length;
      const lateDays = records.filter((r) => r.status === "LATE").length;
      const leaveDays = records.filter((r) => r.status === "LEAVE").length;
      const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      summaries.push({
        inspector_id: inspectorId,
        inspector_name: records[0]?.notes || "Unknown", // TODO: Fetch from users table
        discipline: records[0]?.discipline || "",
        total_days: totalDays,
        present_days: presentDays,
        absent_days: absentDays,
        late_days: lateDays,
        leave_days: leaveDays,
        attendance_percentage: attendancePercentage,
      });
    }

    return summaries;
  }
}

export const inspectorAttendanceRepository = new SupabaseInspectorAttendanceRepository();