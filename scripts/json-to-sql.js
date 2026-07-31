// scripts/json-to-sql.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// شبیه‌سازی __dirname در ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(
  __dirname,
  "../src/features/inspection-management/data",
);

function escapeSQL(str) {
  if (str === null || str === undefined) return "NULL";
  return String(str).replace(/'/g, "''");
}

function generateTemplatesSQL() {
  const filePath = path.join(DATA_DIR, "checklist_items_by_equipments.json");
  if (!fs.existsSync(filePath)) {
    console.log("⚠️  File not found:", filePath);
    return "";
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (data.length === 0) return "";

  const values = data
    .map(
      (item) =>
        `  ('${escapeSQL(item.id)}', '${escapeSQL(item.equipment_id)}','${escapeSQL(item.template_id)}','${escapeSQL(item.inspection_method)}','${escapeSQL(item.sequence)}','${escapeSQL(item.checklist_text)}',, ${item.is_active})`,
    )
    .join(",\n");

  return `-- ═══ Templates (${data.length} rows) ═══
INSERT INTO equipment.checklist (id,equipment_id,template_id, inspection_method, sequence, checklist_text, is_active) VALUES
${values}
ON CONFLICT (id) DO NOTHING;
`;
}

console.log("🔄 Converting JSON files to SQL...\n");

const sql = `
-- ═══════════════════════════════════════════════════
-- Generated SQL for Checklist Data Import
-- Generated at: ${new Date().toISOString()}
-- ═══════════════════════════════════════════════════

${generateTemplatesSQL()}


-- ═══ Verification ═══
SELECT 'Templates' as table_name, COUNT(*) as count FROM equipment.checklist_templates`;

const outputPath = path.join(__dirname, "generated_checklist_import.sql");
fs.writeFileSync(outputPath, sql, "utf8");

console.log(`✅ SQL file generated: ${outputPath}`);
console.log(
  `\n📝 Next step: Open '${outputPath}' and run it in Supabase SQL Editor`,
);
