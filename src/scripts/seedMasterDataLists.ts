// src/scripts/seedMasterDataLists.ts
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

// نگاشت دسته‌بندی‌ها به مقادیر اولیه
const MASTER_DATA_SEED: Record<string, string[]> = {
  INSPECTOR_SPECIALTY: [
    "General",
    "Mechanical",
    "Dimensional",
    "Welding",
    "Paint & Coating",
    "Civil",
    "Piping",
    "Electrical",
    "Instrumentation",
    "Structure",
    "Process",
    "Safety",
    "Material",
    "HVAC",
    "Architecture",
    "Telecommunication",
    "MWS",
  ],
  TPI_DISCIPLINE: [
    "General",
    "Mechanical",
    "Dimensional",
    "Welding",
    "Paint & Coating",
    "Civil",
    "Piping",
    "Electrical",
    "Instrumentation",
    "Structure",
    "Process",
    "Safety",
    "Material",
    "HVAC",
    "Architecture",
    "Telecommunication",
  ],
  TPI_INSPECTION_STAGE: [
    "In-Process",
    "Final Inspection",
    "Pre-Shipment",
    "Others",
  ],
  TPI_INSPECTION_METHOD: [
    "Pre-Inspection Meeting",
    "Document Review",
    "Visual Inspection",
    "Dimensional Inspection",
    "Marking / ID Verification",
    "Functional Verification",
    "Performance Verification",
    "Quantity",
    "Sampling",
    "NDT (PT, MT, ...)",
    "PMI",
    "Laboratory Test",
    "Hydrostatic Test",
    "Others",
  ],
  TPI_CANCELLATION_REASON: [
    "REASSIGNED",
    "CLIENT_REQUEST",
    "VENDOR_UNAVAILABLE",
    "SCOPE_CHANGED",
    "Others",
  ],
  TPI_REPORT_TYPE: ["IR", "IRN", "SRN"],
  TPI_DOCUMENT_TYPE: [
    "ITP",
    "QCP",
    "Procedure",
    "Drawing",
    "MTC",
    "Calibration",
    "WPS/PQR",
    "NDT Report",
    "Others",
  ],
  MWS_DISCIPLINE: [
    "Marine Operations",
    "Naval Architecture",
    "Structural / Rigging",
    "Mooring & Anchoring",
    "Dynamic Positioning (DP)",
    "Subsea Operations",
    "Lifting & Heavy Transport",
  ],
  MWS_INSPECTION_STAGE: [
    "Pre-Mobilization",
    "Load-out",
    "Sea-Fastening",
    "Transit / Tow",
    "Installation / Hook-up",
    "Decommissioning",
    "Others",
  ],
  MWS_INSPECTION_METHOD: [
    "Marine Document Review",
    "Visual Inspection (Marine)",
    "Dimensional Check",
    "Tension / Load Monitoring",
    "DP Trial / FMEA Review",
    "Sea-Fastening Check",
    "Mooring Pattern Verification",
    "Weather Window Analysis",
    "Others",
  ],
  MWS_CANCELLATION_REASON: [
    "WEATHER_DELAY",
    "VESSEL_UNAVAILABLE",
    "CLIENT_REQUEST",
    "SCOPE_CHANGED",
    "Others",
  ],
  MWS_REPORT_TYPE: ["COA", "AOC", "MWS Report", "Daily Log", "Weather Report"],
  MWS_DOCUMENT_TYPE: [
    "MWS Plan",
    "Vessel Certificate",
    "Rigging Certificate",
    "Load-out Procedure",
    "Sea-fastening Calculation",
    "Mooring Plan",
    "FMEA",
    "Others",
  ],
};

// ✅ تابع تولید ID یکتا و خوانا بر اساس category و value
function generateId(category: string, value: string): string {
  const cleanValue = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `${category.toLowerCase()}_${cleanValue}`;
}

async function seed() {
  console.log("🌱 Starting Master Data Lists Seed...");
  let totalInserted = 0;

  for (const [category, values] of Object.entries(MASTER_DATA_SEED)) {
    console.log(`  ↳ Seeding ${category} (${values.length} items)...`);

    const records = values.map((val) => ({
      id: generateId(category, val), // ✅ تولید ID یکتا
      category,
      value: val,
      is_active: true,
    }));

    // استفاده از upsert برای جلوگیری از خطای تکراری بودن
    const { error } = await supabase
      .schema("master_data")
      .from("system_lists")
      .upsert(records, { onConflict: "id" });

    if (error) {
      console.error(`❌ Error seeding ${category}:`, error.message);
    } else {
      totalInserted += values.length;
      console.log(`    ✅ ${values.length} items added/updated`);
    }
  }

  console.log(`\n✅ Successfully seeded ${totalInserted} master data items!`);
}

seed().catch(console.error);
