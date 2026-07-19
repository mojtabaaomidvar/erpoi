// src/features/inspection-management/repositories/SupabaseReportRepository.ts

import { supabase } from "@shared/database/supabase";
import type { InspectionReport } from "../domain/types";
import type { IReportRepository } from "./IReportRepository";

export class SupabaseReportRepository implements IReportRepository {
  async getAll(): Promise<InspectionReport[]> {
    const { data, error } = await supabase
      .from("inspection.inspection_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<InspectionReport | null> {
    const { data, error } = await supabase
      .from("inspection.inspection_reports")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as InspectionReport;
  }

  async getByInspection(inspectionId: string): Promise<InspectionReport[]> {
    const { data, error } = await supabase
      .from("inspection.inspection_reports")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<InspectionReport, "id" | "created_at">,
  ): Promise<InspectionReport> {
    const id = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const report_number = `${data.report_type}-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 10000,
    )
      .toString()
      .padStart(4, "0")}`;

    const { data: newRecord, error } = await supabase
      .from("inspection.inspection_reports")
      .insert({
        id,
        report_number,
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as InspectionReport;
  }

  async update(
    id: string,
    data: Partial<InspectionReport>,
  ): Promise<InspectionReport> {
    const { data: updatedRecord, error } = await supabase
      .from("inspection.inspection_reports")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as InspectionReport;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("inspection.inspection_reports")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
}

export const reportRepository = new SupabaseReportRepository();
