// src/features/inspection-management/utils/checklistTemplates.ts

import type { ChecklistCategory, ChecklistItem } from "@/types/inspection";

export interface ChecklistTemplate {
  id: string;
  name: string;
  category: ChecklistCategory;
  description: string;
  items: Omit<ChecklistItem, "id" | "checked_by" | "checked_at">[];
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: "visual_inspection",
    name: "Visual Inspection Checklist",
    category: "VISUAL",
    description: "Standard visual inspection checklist",
    items: [
      { description: "Surface condition check", category: "VISUAL" },
      { description: "Color and appearance", category: "VISUAL" },
      { description: "Visible defects or damage", category: "VISUAL" },
      { description: "Cleanliness", category: "VISUAL" },
      { description: "Marking and labeling", category: "VISUAL" },
    ],
  },
  {
    id: "dimensional_check",
    name: "Dimensional Check",
    category: "DIMENSIONAL",
    description: "Dimensional verification checklist",
    items: [
      { description: "Length measurement", category: "DIMENSIONAL" },
      { description: "Width measurement", category: "DIMENSIONAL" },
      { description: "Height/Thickness measurement", category: "DIMENSIONAL" },
      { description: "Diameter measurement", category: "DIMENSIONAL" },
      { description: "Tolerance check", category: "DIMENSIONAL" },
    ],
  },
  {
    id: "welding_inspection",
    name: "Welding Inspection",
    category: "WELDING",
    description: "Welding quality inspection",
    items: [
      { description: "Weld bead appearance", category: "WELDING" },
      { description: "Weld size and profile", category: "WELDING" },
      { description: "Undercut check", category: "WELDING" },
      { description: "Porosity check", category: "WELDING" },
      { description: "Crack inspection", category: "WELDING" },
      { description: "Weld penetration", category: "WELDING" },
    ],
  },
  {
    id: "coating_inspection",
    name: "Coating Inspection",
    category: "COATING",
    description: "Coating and painting inspection",
    items: [
      { description: "Surface preparation", category: "COATING" },
      { description: "Coating thickness", category: "COATING" },
      { description: "Adhesion test", category: "COATING" },
      { description: "Holiday detection", category: "COATING" },
      { description: "Curing check", category: "COATING" },
    ],
  },
  {
    id: "material_verification",
    name: "Material Verification",
    category: "MATERIAL",
    description: "Material certificate and verification",
    items: [
      { description: "Material certificate check", category: "MATERIAL" },
      { description: "Grade verification", category: "MATERIAL" },
      { description: "Heat number verification", category: "MATERIAL" },
      { description: "PMI test (if required)", category: "MATERIAL" },
      { description: "Mechanical properties", category: "MATERIAL" },
    ],
  },
  {
    id: "packaging_inspection",
    name: "Packaging Inspection",
    category: "PACKAGING",
    description: "Packaging and preservation check",
    items: [
      { description: "Packaging material check", category: "PACKAGING" },
      { description: "Labeling accuracy", category: "PACKAGING" },
      { description: "Protection from damage", category: "PACKAGING" },
      { description: "Weather protection", category: "PACKAGING" },
      { description: "Packing list verification", category: "PACKAGING" },
    ],
  },
];

export function getTemplateById(
  templateId: string,
): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find((t) => t.id === templateId);
}

export function getTemplatesByCategory(
  category: ChecklistCategory,
): ChecklistTemplate[] {
  return CHECKLIST_TEMPLATES.filter((t) => t.category === category);
}

export function createChecklistFromTemplate(
  templateId: string,
): ChecklistItem[] | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return template.items.map((item, index) => ({
    ...item,
    id: `item_${Date.now()}_${index}`,
  }));
}
