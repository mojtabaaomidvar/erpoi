//src/features/inspection-management/domain/checklistTypes.ts

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  inspection_method: string;
  sequence: number;
  checklist_text: string;
  is_active: boolean;
}

export interface EquipmentChecklistMapping {
  id: string;
  equipment_id: string;
  template_id: string;
  is_active: boolean;
}

export interface ChecklistGroup {
  method: string;
  items: ChecklistItem[];
}

export interface ChecklistData {
  template: ChecklistTemplate | null;
  groups: ChecklistGroup[];
}
