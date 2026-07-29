// src/features/inspection-management/repositories/SupabaseChecklistRepository.ts

import { supabase } from "@shared/database/supabase";
import type { IChecklistRepository } from "./IChecklistRepository";
import type { InspectionChecklist, ChecklistItem } from "../domain/types";

export class SupabaseChecklistRepository implements IChecklistRepository {
  
  async getByInspectionId(inspectionId: string): Promise<InspectionChecklist | null> {
    // ۱. دریافت خود چک‌لیست
    const { data: checklistData, error: checklistError } = await supabase
      .schema("inspection")
      .from("checklists")
      .select("*")
      .eq("inspection_id", inspectionId)
      .single();

    if (checklistError || !checklistData) return null;

    // ۲. دریافت آیتم‌های مرتبط با آن چک‌لیست
    const { data: itemsData, error: itemsError } = await supabase
      .schema("inspection")
      .from("checklist_items")
      .select("*")
      .eq("checklist_id", checklistData.id);

    if (itemsError) throw new Error(itemsError.message);

    return {
      ...checklistData,
      items: itemsData || [],
    } as InspectionChecklist;
  }

  async upsertChecklist(
    inspectionId: string,
    inspectorId: string,
    items: Omit<ChecklistItem, "id" | "checklist_id">[]
  ): Promise<InspectionChecklist> {
    
    // ۱. بررسی وجود چک‌لیست قبلی
    const { data: existingChecklist } = await supabase
      .schema("inspection")
      .from("checklists")
      .select("id")
      .eq("inspection_id", inspectionId)
      .single();

    let checklistId = existingChecklist?.id;

    if (!checklistId) {
      // اگر وجود نداشت، جدید بساز
      checklistId = `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { error: createError } = await supabase
        .schema("inspection")
        .from("checklists")
        .insert({
          id: checklistId,
          inspection_id: inspectionId,
          inspector_id: inspectorId,
          status: "DRAFT",
        });
      
      if (createError) throw new Error(createError.message);
    } else {
      // اگر وجود داشت، وضعیت را به DRAFT برگردان و زمان آپدیت را به‌روز کن
      await supabase
        .schema("inspection")
        .from("checklists")
        .update({ updated_at: new Date().toISOString(), status: "DRAFT" })
        .eq("id", checklistId);
    }

    // ۲. حذف تمام آیتم‌های قدیمی چک‌لیست (برای جایگزینی با لیست جدید)
    await supabase
      .schema("inspection")
      .from("checklist_items")
      .delete()
      .eq("checklist_id", checklistId);

    // ۳. درج آیتم‌های جدید
    if (items.length > 0) {
      const itemsToInsert = items.map((item, index) => ({
        id: `chki_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
        checklist_id: checklistId,
        category: item.category,
        description: item.description,
        result: item.result,
        remarks: item.remarks || null,
        photo_urls: item.photo_urls || [],
      }));

      const { error: insertError } = await supabase
        .schema("inspection")
        .from("checklist_items")
        .insert(itemsToInsert);
      
      if (insertError) throw new Error(insertError.message);
    }

    // ۴. بازگرداندن چک‌لیست به‌روزرسانی‌شده به صورت کامل
    const updatedChecklist = await this.getByInspectionId(inspectionId);
    if (!updatedChecklist) throw new Error("Failed to retrieve updated checklist");
    
    return updatedChecklist;
  }
}

export const checklistRepository = new SupabaseChecklistRepository();