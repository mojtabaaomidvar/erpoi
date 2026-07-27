// src/features/inspection-management/repositories/SupabaseInspectionRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Inspection } from "../domain/types";
import type { TPICancellationReason } from "@/features/tpi-management";
import type { IInspectionRepository } from "./IInspectionRepository";

export class SupabaseInspectionRepository implements IInspectionRepository {
  async getAll(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async getInspectionsByInspectorAndDate(
    inspectorId: string,
    executionDate: string,
  ): Promise<Inspection[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .eq("inspector_id", inspectorId)
      .eq("execution_date", executionDate)
      .in("status", ["SCHEDULED", "IN_PROGRESS"]);

    if (error) throw new Error(error.message);
    return (data || []) as Inspection[];
  }

  async getById(id: string): Promise<Inspection | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Inspection;
  }

  async getByInspectionRequest(requestId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .eq("inspection_request_id", requestId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(
    data: Omit<Inspection, "id" | "created_at" | "updated_at">,
  ): Promise<Inspection> {
    const id = `insp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: newRecord, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .insert({
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return newRecord as Inspection;
  }

  async update(id: string, data: Partial<Inspection>): Promise<Inspection> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updatedRecord as Inspection;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("inspections")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  }

  async cancelInspection(
    id: string,
    cancelledBy: string,
    reason?: TPICancellationReason,
    relatedInspectionId?: string,
    newScheduledDate?: string,
    dateIsUnknown?: boolean,
    newScopes?: string[],
    cancellationNotes?: string,
  ): Promise<Inspection> {
    const { data: updatedRecord, error } = await supabase
      .schema("inspection")
      .from("inspections")
      .update({
        status: "CANCELLED",
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
        cancellation_reason: reason || null,
        related_inspection_id: relatedInspectionId || null,
        new_scheduled_date: newScheduledDate || null,
        date_is_unknown: dateIsUnknown || false,
        new_scope: newScopes || null,
        cancellation_notes: cancellationNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updatedRecord as Inspection;
  }

  async getInspectionWithDetails(id: string): Promise<any> {
    // ۱. دریافت خود بازرسی
    const { data: inspection, error: inspError } = await supabase
      .schema("inspection")
      .from("inspections")
      .select("*")
      .eq("id", id)
      .single();

    if (inspError || !inspection) throw new Error("Inspection not found");

    const { data: request, error: reqError } = await supabase
      .schema("inspection")
      .from("inspection_requests")
      .select("*")
      .eq("id", inspection.inspection_request_id)
      .single();

    if (reqError || !request) throw new Error("Inspection request not found");

    // ۳. دریافت اطلاعات پروژه
    const { data: project, error: projError } = await supabase
      .schema("project")
      .from("projects")
      .select(
        `
        id,
        name,
        description,
        start_date,
        end_date,
        client:clients (id, name_en, name_fa)
      `,
      )
      .eq("id", request.project_id)
      .single();

    let vendor = null;
    if (request.vendor_id) {
      const { data: vendorData } = await supabase
        .schema("inspection")
        .from("vendors")
        .select("id, name")
        .eq("id", request.vendor_id)
        .single();
      vendor = vendorData;
    }

    const { data: inspector } = await supabase
      .schema("core")
      .from("inspectors")
      .select("id, name_en, name_fa")
      .eq("id", inspection.inspector_id)
      .single();

    return {
      inspection,
      request,
      project,
      vendor,
      inspector,
    };
  }
}

export const inspectionRepository = new SupabaseInspectionRepository();
