// src/features/inspection-management/repositories/NcrRepository.ts

import { supabase } from "@shared/database/supabase";
import type { ChecklistItemResult } from "../domain/checklistTypes";

export interface NcrReport {
  id: string;
  ncr_number: string;
  request_id: string;
  equipment_id: string;
  inspection_method: string;
  checklist_item_id: string;
  checklist_text: string;
  title: string;
  description: string;
  severity: "MINOR" | "MAJOR" | "OBSERVATION" | "HOLD POINT";
  category: string;
  corrective_action?: string;
  responsible_person?: string;
  due_date?: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "REJECTED";
  closed_by?: string;
  closed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Observation {
  id: string;
  request_id: string;
  equipment_id: string;
  inspection_method: string;
  checklist_item_id: string;
  checklist_text: string;
  observation_text: string;
  category?: string;
  created_by: string;
  created_at: string;
}

export class NcrRepository {
  /**
   * تولید شماره NCR یکتا
   */
  async generateNcrNumber(): Promise<string> {
    const year = new Date().getFullYear();

    // دریافت آخرین شماره NCR در سال جاری
    const { data } = await supabase
      .schema("inspection")
      .from("ncr_reports")
      .select("ncr_number")
      .like("ncr_number", `NCR-${year}-%`)
      .order("ncr_number", { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (data?.ncr_number) {
      const lastNumber = parseInt(data.ncr_number.split("-")[2]);
      sequence = lastNumber + 1;
    }

    return `NCR-${year}-${sequence.toString().padStart(4, "0")}`;
  }

  /**
   * ایجاد NCR از آیتم REJECT
   */
  async createNcrFromReject(
    result: ChecklistItemResult,
    title: string,
    description: string,
    severity: "MINOR" | "MAJOR" | "OBSERVATION" | "HOLD POINT",
    category: string,
    createdBy: string,
  ): Promise<NcrReport> {
    const ncrNumber = await this.generateNcrNumber();
    const id = `ncr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const ncr: Partial<NcrReport> = {
      id,
      ncr_number: ncrNumber,
      request_id: result.request_id || "",
      equipment_id: result.equipment_id,
      inspection_method: result.inspection_method,
      checklist_item_id: result.item_id,
      checklist_text: result.checklist_text || "",
      title,
      description,
      severity,
      category,
      status: "OPEN",
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .schema("inspection")
      .from("ncr_reports")
      .insert(ncr)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as NcrReport;
  }

  /**
   * ایجاد Observation از آیتم NOTE
   */
  async createObservationFromNote(
    result: ChecklistItemResult,
    observationText: string,
    category: string,
    createdBy: string,
  ): Promise<Observation> {
    const id = `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const observation: Partial<Observation> = {
      id,
      request_id: result.request_id || "",
      equipment_id: result.equipment_id,
      inspection_method: result.inspection_method,
      checklist_item_id: result.item_id,
      checklist_text: result.checklist_text || "",
      observation_text: observationText,
      category,
      created_by: createdBy,
    };

    const { data, error } = await supabase
      .schema("inspection")
      .from("observations")
      .insert(observation)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Observation;
  }

  /**
   * دریافت تمام NCRهای یک درخواست
   */
  async getNcrsByRequestId(requestId: string): Promise<NcrReport[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("ncr_reports")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as NcrReport[];
  }

  /**
   * دریافت تمام Observations یک درخواست
   */
  async getObservationsByRequestId(requestId: string): Promise<Observation[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("observations")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Observation[];
  }

  /**
   * به‌روزرسانی وضعیت NCR
   */
  async updateNcrStatus(
    ncrId: string,
    status: "OPEN" | "IN_PROGRESS" | "CLOSED" | "REJECTED",
    closedBy?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "CLOSED" || status === "REJECTED") {
      updateData.closed_by = closedBy;
      updateData.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .schema("inspection")
      .from("ncr_reports")
      .update(updateData)
      .eq("id", ncrId);

    if (error) throw new Error(error.message);
  }
}

export const ncrRepository = new NcrRepository();
