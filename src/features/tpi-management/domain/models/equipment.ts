//src/features/tpi-management/domain/models/equipment.ts

export interface Equipment {
  id: string;
  code: string;
  name: string;
  discipline: string;
  is_active: boolean;
}
