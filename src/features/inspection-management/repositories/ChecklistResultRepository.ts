// src/features/inspection-management/repositories/ChecklistResultRepository.ts

import { supabase } from "@shared/database/supabase";
import type {
  ChecklistItemResult,
  ChecklistSession,
} from "../domain/checklistTypes";

export class ChecklistResultRepository {
  /**
   * ذخیره نتایج چک‌لیست (Optimistic UI)
   */
  async saveResults(session: ChecklistSession): Promise<void> {
    const { error } = await supabase
      .schema("inspection")
      .from("checklist_results")
      .upsert(
        session.results.map((result) => ({
          id: `${session.id}_${result.item_id}`,
          request_id: session.request_id,
          equipment_id: session.equipment_id,
          inspection_method: session.inspection_method,
          item_id: result.item_id,
          status: result.status,
          comment: result.comment || null,
          checked_by: result.checked_by || null,
          checked_at: result.checked_at || null,
          created_by: session.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "id" },
      );

    if (error) throw new Error(error.message);
  }

  async getResultsByRequestId(
    requestId: string,
  ): Promise<ChecklistItemResult[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("checklist_results")
      .select("*")
      .eq("request_id", requestId);

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      item_id: row.item_id,
      request_id: row.request_id,
      equipment_id: row.equipment_id,
      inspection_method: row.inspection_method,
      checklist_text: row.checklist_text,
      status: row.status,
      comment: row.comment,
      checked_by: row.checked_by,
      checked_at: row.checked_at,
    })) as ChecklistItemResult[];
  }

  async getResultsByEquipment(
    requestId: string,
    equipmentId: string,
  ): Promise<ChecklistItemResult[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("checklist_results")
      .select("*")
      .eq("request_id", requestId)
      .eq("equipment_id", equipmentId);

    if (error) throw new Error(error.message);
    return (data || []) as ChecklistItemResult[];
  }
}

export const checklistResultRepository = new ChecklistResultRepository();
