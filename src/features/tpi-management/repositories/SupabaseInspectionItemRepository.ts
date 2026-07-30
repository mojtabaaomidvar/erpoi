// src/features/tpi-management/repositories/SupabaseInspectionItemRepository.ts

import { supabase } from "@shared/database/supabase";

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  level: "CATEGORY" | "SUBCATEGORY" | "EQUIPMENT_TYPE";
  parent_id?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

class SupabaseInspectionItemRepository {
  /**
   * دریافت تمام آیتم‌های فعال از جدول equipment.equipment
   */
  async getAllActive(): Promise<EquipmentItem[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .eq("is_active", true)
      .order("code", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as EquipmentItem[];
  }

  /**
   * دریافت همه آیتم‌ها (بدون فیلتر is_active)
   */
  async getAll(): Promise<EquipmentItem[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .order("code", { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as EquipmentItem[];
  }
}

export const inspectionItemRepository = new SupabaseInspectionItemRepository();
