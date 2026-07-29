//src/features/equipment-management/domain/types/index.ts

// ═══════════════════════════════════════════════════════════
// EQUIPMENT TAXONOMY - ساختار درختی ۳ سطحی
// ═══════════════════════════════════════════════════════════

export type EquipmentLevel = "CATEGORY" | "SUBCATEGORY" | "EQUIPMENT_TYPE";

export interface Equipment {
  id: string;
  code: string; // e.g., "STATIC_EQUIPMENT", "PRESSURE_VESSEL", "SEPARATOR"
  name: string; // e.g., "Static Equipment", "Pressure Vessel", "Separator"
  level: EquipmentLevel;
  parent_id?: string; // Reference to parent (null for top-level categories)
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════
// EQUIPMENT ATTRIBUTES - ویژگی‌های خاص هر تجهیز
// ═══════════════════════════════════════════════════════════

export interface EquipmentAttribute {
  id: string;
  equipment_type_id: string;
  attribute_name: string; // e.g., "Design Pressure", "Material", "Capacity"
  attribute_type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT";
  is_required: boolean;
  unit?: string; // e.g., "bar", "kg", "m³"
  options?: string[]; // برای نوع SELECT
}

// ═══════════════════════════════════════════════════════════
// EQUIPMENT INSTANCE - نمونه واقعی تجهیز در پروژه
// ═══════════════════════════════════════════════════════════

export interface EquipmentInstance {
  id: string;
  equipment_type_id: string; // Reference to Equipment Type
  project_id: string;
  tag_number: string; // e.g., "V-101", "P-201A"
  description?: string;
  location?: string;
  attributes?: Record<string, any>; // Dynamic attributes
  is_active: boolean;
  created_at: string;
}
