//src/features/inspection-management/repositories/ChecklistRepository.ts

import { supabase } from "@shared/database/supabase";
import type {
  ChecklistTemplate,
  ChecklistItem,
  EquipmentChecklistMapping,
  ChecklistGroup,
  ChecklistData,
} from "../domain/checklistTypes";

export class ChecklistRepository {
  async getTemplateByEquipmentId(
    equipmentId: string,
  ): Promise<ChecklistTemplate | null> {
    const { data: mapping, error: mapError } = await supabase
      .schema("equipment")
      .from("equipment_checklist_mappings")
      .select("template_id")
      .eq("equipment_id", equipmentId)
      .eq("is_active", true)
      .single();

    if (mapError || !mapping) return null;

    const { data: template, error: tempError } = await supabase
      .schema("equipment")
      .from("checklist_templates")
      .select("*")
      .eq("id", mapping.template_id)
      .eq("is_active", true)
      .single();

    if (tempError || !template) return null;

    return template as ChecklistTemplate;
  }

  async getChecklistByTemplateId(templateId: string): Promise<ChecklistData> {
    // دریافت template
    const { data: template, error: tempError } = await supabase
      .schema("equipment")
      .from("checklist_templates")
      .select("*")
      .eq("id", templateId)
      .eq("is_active", true)
      .single();

    if (tempError || !template) {
      return { template: null, groups: [] };
    }

    const { data: items, error: itemsError } = await supabase
      .schema("equipment")
      .from("checklist_items")
      .select("*")
      .eq("template_id", templateId)
      .eq("is_active", true)
      .order("sequence", { ascending: true });

    if (itemsError || !items) {
      return { template: template as ChecklistTemplate, groups: [] };
    }

    const groupsMap = new Map<string, ChecklistItem[]>();
    items.forEach((item: any) => {
      if (!groupsMap.has(item.inspection_method)) {
        groupsMap.set(item.inspection_method, []);
      }
      groupsMap.get(item.inspection_method)!.push(item as ChecklistItem);
    });

    const groups: ChecklistGroup[] = Array.from(groupsMap.entries()).map(
      ([method, items]) => ({ method, items }),
    );

    return { template: template as ChecklistTemplate, groups };
  }

  async getChecklistByEquipmentId(equipmentId: string): Promise<ChecklistData> {
    const template = await this.getTemplateByEquipmentId(equipmentId);
    if (!template) {
      return { template: null, groups: [] };
    }

    return this.getChecklistByTemplateId(template.id);
  }

  async getAllTemplates(): Promise<ChecklistTemplate[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("checklist_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return (data || []) as ChecklistTemplate[];
  }
}

export const checklistRepository = new ChecklistRepository();
