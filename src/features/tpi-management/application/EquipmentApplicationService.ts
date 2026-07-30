// src/features/tpi-management/application/EquipmentApplicationService.ts

import { equipmentMasterDataRepository } from "../repositories/EquipmentMasterDataRepository";
import type { EquipmentItem } from "../repositories/EquipmentMasterDataRepository";

export interface EquipmentGroup {
  categoryId: string;
  categoryName: string;
  items: EquipmentItem[];
}

export interface DisciplineGroup {
  discipline: string;
  categories: EquipmentGroup[];
}

export class EquipmentApplicationService {
  async getGroupedEquipmentByDisciplines(
    disciplines: string[],
  ): Promise<DisciplineGroup[]> {
    if (disciplines.length === 0) return [];

    const flatList =
      await equipmentMasterDataRepository.getEquipmentHierarchyByDisciplines(
        disciplines,
      );

    const byDiscipline: Record<string, EquipmentItem[]> = {};
    flatList.forEach((item) => {
      if (!byDiscipline[item.discipline]) {
        byDiscipline[item.discipline] = [];
      }
      byDiscipline[item.discipline].push(item);
    });

    const result: DisciplineGroup[] = disciplines
      .filter((d) => byDiscipline[d])
      .map((discipline) => {
        const items = byDiscipline[discipline];
        const categories = items.filter((item) => item.level === "category");

        const equipmentGroups: EquipmentGroup[] = categories.map((cat) => ({
          categoryId: cat.id,
          categoryName: cat.name,
          items: items.filter(
            (item) => item.level === "item" && item.parent_id === cat.id,
          ),
        }));
        const orphanItems = items.filter(
          (item) => item.level === "item" && !item.parent_id,
        );
        if (orphanItems.length > 0) {
          equipmentGroups.push({
            categoryId: `${discipline}-uncategorized`,
            categoryName: "Others",
            items: orphanItems,
          });
        }

        return {
          discipline,
          categories: equipmentGroups.filter((g) => g.items.length > 0),
        };
      })
      .filter((dg) => dg.categories.length > 0);

    return result;
  }

  async getGroupedEquipmentByDiscipline(
    discipline: string,
  ): Promise<EquipmentGroup[]> {
    const result = await this.getGroupedEquipmentByDisciplines([discipline]);
    return result.length > 0 ? result[0].categories : [];
  }

  async searchAllEquipment(query: string): Promise<EquipmentItem[]> {
    return await equipmentMasterDataRepository.searchAllEquipment(query, 50);
  }
}

export const equipmentAppService = new EquipmentApplicationService();
