// src/features/tpi-management/application/InspectionItemApplicationService.ts

import {
  inspectionItemRepository,
  type EquipmentItem,
} from "../repositories/SupabaseInspectionItemRepository";
import {
  DISCIPLINE_TO_CATEGORIES,
  getCategoriesForDisciplines,
} from "../domain/inspectionItemMapping";

class InspectionItemApplicationService {
  async getAllItems(): Promise<EquipmentItem[]> {
    return await inspectionItemRepository.getAllActive();
  }

  async getItemsByDisciplines(disciplines: string[]): Promise<EquipmentItem[]> {
    console.log("🔍 Filtering items for disciplines:", disciplines);

    const allItems = await this.getAllItems();
    console.log("📦 Total items loaded:", allItems.length);

    if (disciplines.length === 0) {
      console.log("️ No disciplines selected, returning all items");
      return allItems;
    }

    const allowedCategories = getCategoriesForDisciplines(disciplines);
    console.log("🎯 Allowed categories:", allowedCategories);

    // ✅ اگر هیچ mappingای پیدا نشد، خالی برگردان (نه fallback)
    if (allowedCategories.length === 0) {
      console.warn(
        "❌ No mapping found for disciplines, returning empty array",
      );
      return [];
    }

    const childrenMap = new Map<string, EquipmentItem[]>();
    allItems.forEach((item) => {
      if (item.parent_id) {
        if (!childrenMap.has(item.parent_id)) {
          childrenMap.set(item.parent_id, []);
        }
        childrenMap.get(item.parent_id)!.push(item);
      }
    });

    const allowedCategoryItems = allItems.filter(
      (item) =>
        item.level === "CATEGORY" && allowedCategories.includes(item.code),
    );

    console.log(
      "📋 Found category items:",
      allowedCategoryItems.map((i) => i.name),
    );

    const allowedItems = new Set<EquipmentItem>();

    const collectAllDescendants = (item: EquipmentItem) => {
      allowedItems.add(item);
      const children = childrenMap.get(item.id) || [];
      children.forEach((child) => collectAllDescendants(child));
    };

    allowedCategoryItems.forEach((category) => collectAllDescendants(category));

    console.log("✅ Filtered items count:", Array.from(allowedItems).length);
    return Array.from(allowedItems);
  }

  async getFilteredItemNames(disciplines: string[]): Promise<string[]> {
    const filtered = await this.getItemsByDisciplines(disciplines);
    return filtered.map((item) => item.name);
  }
}

export const inspectionItemAppService = new InspectionItemApplicationService();
