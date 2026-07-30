// src/features/tpi-management/repositories/EquipmentMasterDataRepository.ts

import { supabase } from "@shared/database/supabase";

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  level: "discipline" | "category" | "item";
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  discipline: string;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  inspection_method: string;
  sequence: number;
  checklist_text: string;
  is_active: boolean;
}

class EquipmentMasterDataRepository {
  async getEquipmentItemsByDiscipline(
    discipline: string,
  ): Promise<EquipmentItem[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .eq("level", "item")
      .eq("discipline", discipline)
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw new Error(`Failed to fetch equipment: ${error.message}`);
    return (data || []) as EquipmentItem[];
  }

  // دریافت سلسله‌مراتب (دسته‌بندی‌ها + آیتم‌ها) یک دیسیپلین
  async getEquipmentHierarchyByDiscipline(
    discipline: string,
  ): Promise<EquipmentItem[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("id, code, name, level, parent_id, discipline, is_active")
      .eq("discipline", discipline)
      .in("level", ["category", "item"])
      .eq("is_active", true)
      .order("level", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch equipment hierarchy: ${error.message}`);
    }
    return (data || []) as EquipmentItem[];
  }

  //  دریافت سلسله‌مراتب (دسته‌بندی‌ها + آیتم‌ها) چند دیسیپلین
  async getEquipmentHierarchyByDisciplines(
    disciplines: string[],
  ): Promise<EquipmentItem[]> {
    if (disciplines.length === 0) return [];

    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("id, code, name, level, parent_id, discipline, is_active")
      .in("discipline", disciplines)
      .in("level", ["category", "item"])
      .eq("is_active", true)
      .order("discipline", { ascending: true })
      .order("level", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch equipment hierarchy: ${error.message}`);
    }
    return (data || []) as EquipmentItem[];
  }

  // ✅ متد جدید: جستجوی آزاد در تمام تجهیزات
  async searchAllEquipment(
    query: string,
    limit: number = 50,
  ): Promise<EquipmentItem[]> {
    if (!query || query.trim().length < 2) return [];

    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("id, code, name, discipline, is_active")
      .eq("level", "item")
      .eq("is_active", true)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(limit)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to search equipment: ${error.message}`);
    }
    return (data || []) as EquipmentItem[];
  }

  async getAllDisciplines(): Promise<string[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("discipline")
      .eq("level", "discipline")
      .eq("is_active", true);

    if (error) throw new Error(`Failed to fetch disciplines: ${error.message}`);

    const disciplines = data?.map((d: any) => d.discipline) || [];
    return [...new Set(disciplines)];
  }

  async getChecklistForEquipment(equipmentId: string): Promise<{
    templateName: string;
    items: ChecklistItem[];
  } | null> {
    const { data, error } = await supabase
      .schema("inspection")
      .from("equipment_checklist_mapping")
      .select(
        `
        is_active,
        checklist_templates!inner (
          id,
          name,
          checklist_items (
            id,
            inspection_method,
            sequence,
            checklist_text,
            is_active
          )
        )
      `,
      )
      .eq("equipment_id", equipmentId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.warn(`No checklist mapping found for equipment: ${equipmentId}`);
      return null;
    }

    const template = data.checklist_templates as any;

    const items: ChecklistItem[] = (template.checklist_items || [])
      .filter((item: any) => item.is_active)
      .sort((a: any, b: any) => {
        if (a.inspection_method !== b.inspection_method) {
          return a.inspection_method.localeCompare(b.inspection_method);
        }
        return a.sequence - b.sequence;
      });

    return {
      templateName: template.name,
      items,
    };
  }
}

export const equipmentMasterDataRepository =
  new EquipmentMasterDataRepository();
