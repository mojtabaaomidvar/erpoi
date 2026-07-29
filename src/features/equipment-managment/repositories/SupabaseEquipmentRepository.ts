//src/features/equipment-management/repositories/SupabaseEquipmentRepository.ts

import { supabase } from "@shared/database/supabase";
import type { Equipment, EquipmentInstance } from "../domain";
import { EQUIPMENT_TAXONOMY_SEED } from "../data/equipmentSeed";

class SupabaseEquipmentRepository {
  // ═══════════════════════════════════════════════════════════
  // EQUIPMENT TAXONOMY
  // ═══════════════════════════════════════════════════════════
  async getAll(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .eq("is_active", true)
      .order("code");

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<Equipment | null> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Equipment;
  }

  async getByLevel(
    level: "CATEGORY" | "SUBCATEGORY" | "EQUIPMENT_TYPE",
  ): Promise<Equipment[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .eq("level", level)
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getChildren(parentId: string): Promise<Equipment[]> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_active", true)
      .order("name");

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getTree(): Promise<Equipment[]> {
    // دریافت تمام equipment ها و ساخت درخت در memory
    return await this.getAll();
  }

  async create(
    equipment: Omit<Equipment, "id" | "created_at" | "updated_at">,
  ): Promise<Equipment> {
    const id = `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .insert({ ...equipment, id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Equipment;
  }

  async update(id: string, equipment: Partial<Equipment>): Promise<Equipment> {
    const { data, error } = await supabase
      .schema("equipment")
      .from("equipment")
      .update({ ...equipment, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Equipment;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .schema("equipment")
      .from("equipment")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  // ═══════════════════════════════════════════════════════════
  // SEED DATA (فقط یک بار اجرا شود)
  // ═══════════════════════════════════════════════════════════
  async seedTaxonomy(): Promise<void> {
    console.log("🌱 Seeding Equipment Taxonomy...");

    // اول Categories (بدون parent)
    const categories = EQUIPMENT_TAXONOMY_SEED.filter(
      (eq) => eq.level === "CATEGORY",
    );
    for (const cat of categories) {
      await supabase
        .schema("equipment")
        .from("equipment")
        .insert({
          id: `eq_${cat.code.toLowerCase()}`,
          code: cat.code,
          name: cat.name,
          level: cat.level,
          parent_id: null,
          is_active: true,
        });
    }

    // دوم SubCategories (با parent)
    const subcategories = EQUIPMENT_TAXONOMY_SEED.filter(
      (eq) => eq.level === "SUBCATEGORY",
    );
    for (const sub of subcategories) {
      const parent = EQUIPMENT_TAXONOMY_SEED.find(
        (eq) => eq.code === sub.parent_code,
      );
      if (parent) {
        await supabase
          .schema("equipment")
          .from("equipment")
          .insert({
            id: `eq_${sub.code.toLowerCase()}`,
            code: sub.code,
            name: sub.name,
            level: sub.level,
            parent_id: `eq_${parent.code.toLowerCase()}`,
            is_active: true,
          });
      }
    }

    // سوم Equipment Types (با parent)
    const equipmentTypes = EQUIPMENT_TAXONOMY_SEED.filter(
      (eq) => eq.level === "EQUIPMENT_TYPE",
    );
    for (const eq of equipmentTypes) {
      const parent = EQUIPMENT_TAXONOMY_SEED.find(
        (e) => e.code === eq.parent_code,
      );
      if (parent) {
        await supabase
          .schema("equipment")
          .from("equipment")
          .insert({
            id: `eq_${eq.code.toLowerCase()}`,
            code: eq.code,
            name: eq.name,
            level: eq.level,
            parent_id: `eq_${parent.code.toLowerCase()}`,
            is_active: true,
          });
      }
    }

    console.log("✅ Equipment Taxonomy seeded successfully!");
  }
}

export const equipmentRepository = new SupabaseEquipmentRepository();
