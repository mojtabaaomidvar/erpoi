// src/features/tpi-management/domain/inspectionItemMapping.ts

export const DISCIPLINE_TO_CATEGORIES: Record<string, string[]> = {
  Mechanical: [
    "STATIC_EQUIPMENT",
    "ROTATING_EQUIPMENT",
    "PIPING",
    "VALVES",
    "HVAC",
    "UTILITY_SYSTEMS",
    "MECHANICAL_PACKAGES",
    "PIPELINE",
    "CORROSION_PROTECTION",
  ],
  Civil: ["CIVIL_STRUCTURAL", "LIFTING_EQUIPMENT", "CONSTRUCTION_ITEMS"],
  Structural: ["CIVIL_STRUCTURAL", "LIFTING_EQUIPMENT", "OFFSHORE_EQUIPMENT"],
  Electrical: ["ELECTRICAL", "INSTRUMENTATION", "FIRE_GAS"],
  Instrumentation: ["INSTRUMENTATION"],
  Piping: ["PIPING", "VALVES", "PIPELINE"],
  Welding: ["CONSTRUCTION_ITEMS", "PIPING", "STATIC_EQUIPMENT"],
  Safety: ["FIRE_GAS", "SAFETY_EQUIPMENT"],
  Marine: ["MARINE_EQUIPMENT", "OFFSHORE_EQUIPMENT"],
  Subsea: ["SUBSEA", "OFFSHORE_EQUIPMENT"],
  Drilling: ["DRILLING_EQUIPMENT"],
  NDT: ["CONSTRUCTION_ITEMS"],
  Coating: ["CORROSION_PROTECTION", "CONSTRUCTION_ITEMS"],
  HVAC: ["HVAC", "UTILITY_SYSTEMS"],
};

export const getCategoriesForDisciplines = (
  disciplines: string[],
): string[] => {
  const categories = new Set<string>();

  disciplines.forEach((discipline) => {
    const mappedCategories = DISCIPLINE_TO_CATEGORIES[discipline];
    if (mappedCategories) {
      mappedCategories.forEach((cat) => categories.add(cat));
    } else {
      console.warn(`⚠️ No mapping found for discipline: "${discipline}"`);
    }
  });

  return Array.from(categories);
};
