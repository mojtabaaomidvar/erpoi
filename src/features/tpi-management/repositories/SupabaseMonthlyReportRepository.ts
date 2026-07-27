// src/features/tpi-management/repositories/SupabaseMonthlyReportRepository.ts
import { supabase } from "@shared/database/supabase";
import type { MonthlyReport } from "../domain/types";
import type { IMonthlyReportRepository } from "./IMonthlyReportRepository";

export class SupabaseMonthlyReportRepository implements IMonthlyReportRepository {
  async getAll(): Promise<MonthlyReport[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .select("*")
      .order("report_year", { ascending: false })
      .order("report_month", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<MonthlyReport | null> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as MonthlyReport;
  }

  async getByResidentInspection(residentInspectionId: string): Promise<MonthlyReport[]> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .select("*")
      .eq("resident_inspection_id", residentInspectionId)
      .order("report_year", { ascending: false })
      .order("report_month", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getByMonth(residentInspectionId: string, month: string): Promise<MonthlyReport | null> {
    const { data, error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .select("*")
      .eq("resident_inspection_id", residentInspectionId)
      .eq("report_month", month)
      .single();

    if (error || !data) return null;
    return data as MonthlyReport;
  }

  async create(data: Omit<MonthlyReport, "id" | "created_at" | "updated_at">): Promise<MonthlyReport> {
    const id = `month_rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return newRecord as MonthlyReport;
  }

  async update(id: string, data: Partial<MonthlyReport>): Promise<MonthlyReport> {
    const { data: updatedRecord, error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as MonthlyReport;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("tpi")
      .from("monthly_reports")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}

export const monthlyReportRepository = new SupabaseMonthlyReportRepository();