// src/features/inspection-management/repositories/SupabaseChecklistRepository.ts

import { supabase } from "@shared/database/supabase";
import type {
  ChecklistData,
  ChecklistTemplate,
  ChecklistItem,
  ChecklistGroup,
} from "../domain/checklistTypes";

export interface ChecklistFilter {
  equipmentId: string[];
  stages?: string[];
  methods?: string[];
}

export class SupabaseChecklistRepository {
  async getChecklist(filters: ChecklistFilter): Promise<ChecklistData> {
    console.log(`🔍 Fetching checklist with filters:`, filters);

    let query = supabase
      .schema("equipment")
      .from("checklist")
      .select(
        "equipment_id, template_id, inspection_method, sequence, checklist_text, is_active",
      )
      .in("equipment_id", filters.equipmentId)
      .eq("is_active", true);

    const targetMethods = [
      ...(filters.stages || []),
      ...(filters.methods || []),
    ];

    if (targetMethods.length > 0) {
      query = query.in("inspection_method", targetMethods);
    }

    const { data: items, error } = await query.order("sequence", {
      ascending: true,
    });

    if (error) {
      console.error("❌ Error fetching checklist:", error);
      return { template: null, groups: [] };
    }

    if (!items || items.length === 0) {
      return { template: null, groups: [] };
    }

    const templateId = items[0].template_id;
    let templateName = "Inspection Checklist";

    try {
      const { data: templateData } = await supabase
        .schema("inspection")
        .from("checklist_templates")
        .select("name")
        .eq("id", templateId)
        .single();

      if (templateData?.name) {
        templateName = templateData.name;
      }
    } catch (e) {}

    const template: ChecklistTemplate = {
      id: templateId,
      name: templateName,
      description: `Checklist filtered by selected stages and methods.`,
      is_active: true,
    };

    const groupsMap = new Map<string, ChecklistItem[]>();
    items.forEach((item: any) => {
      if (!groupsMap.has(item.inspection_method)) {
        groupsMap.set(item.inspection_method, []);
      }
      groupsMap.get(item.inspection_method)!.push({
        id: `${item.equipment_id}_${item.inspection_method}_${item.sequence}`,
        template_id: item.template_id,
        inspection_method: item.inspection_method,
        sequence: Number(item.sequence),
        checklist_text: item.checklist_text,
        is_active: item.is_active,
      });
    });

    const groups: ChecklistGroup[] = Array.from(groupsMap.entries()).map(
      ([method, itemList]) => ({ method, items: itemList }),
    );

    return { template, groups };
  }

  async getAllTemplates(): Promise<ChecklistTemplate[]> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("checklist_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) return [];
    return (data || []) as ChecklistTemplate[];
  }
}

export const checklistRepository = new SupabaseChecklistRepository();
