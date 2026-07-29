import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ خطا: متغیرهای VITE_SUPABASE_URL یا VITE_SUPABASE_ANON_KEY در فایل .env پیدا نشدند.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedDataPath = join(__dirname, "equipmentSeed.json");
const seedData = JSON.parse(readFileSync(seedDataPath, "utf-8"));

async function seed() {
  console.log("🚀 شروع عملیات Seed تجهیزات (Equipment Taxonomy)...");

  // بررسی اتصال
  const { data: testData, error: testError } = await supabase
    .schema("equipment")
    .from("equipment")
    .select("count")
    .limit(1);
  if (testError) {
    console.error("❌ خطا در اتصال به دیتابیس:", testError);
    console.log("💡 احتمالاً RLS فعال است یا پالیسی‌ها اجازه دسترسی نمی‌دهند.");
    console.log("💡 راه‌حل: در SQL Editor این دستور را اجرا کنید:");
    console.log(
      "   ALTER TABLE equipment.equipment DISABLE ROW LEVEL SECURITY;",
    );
    return;
  }

  try {
    // ۱. درج دسته‌بندی‌های اصلی
    const categories = seedData.filter((item) => item.level === "CATEGORY");
    console.log(`📦 در حال درج ${categories.length} دسته‌بندی اصلی...`);

    for (const cat of categories) {
      const { error } = await supabase
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

      if (error) {
        console.error(`❌ خطا در درج ${cat.name}:`, error.message);
        if (error.code === "23505") {
          console.log("⚠️ این رکورد قبلاً وجود دارد (duplicate key)");
        }
      }
    }

    // ۲. درج زیردسته‌ها
    const subcategories = seedData.filter(
      (item) => item.level === "SUBCATEGORY",
    );
    console.log(`📦 در حال درج ${subcategories.length} زیردسته...`);

    for (const sub of subcategories) {
      const parent = seedData.find((p) => p.code === sub.parent_code);
      const { error } = await supabase
        .schema("equipment")
        .from("equipment")
        .insert({
          id: `eq_${sub.code.toLowerCase()}`,
          code: sub.code,
          name: sub.name,
          level: sub.level,
          parent_id: parent ? `eq_${parent.code.toLowerCase()}` : null,
          is_active: true,
        });

      if (error) {
        console.error(`❌ خطا در درج ${sub.name}:`, error.message);
      }
    }

    // ۳. درج انواع تجهیزات
    const equipmentTypes = seedData.filter(
      (item) => item.level === "EQUIPMENT_TYPE",
    );
    console.log(`📦 در حال درج ${equipmentTypes.length} نوع تجهیز...`);

    for (const eq of equipmentTypes) {
      const parent = seedData.find((p) => p.code === eq.parent_code);
      const { error } = await supabase
        .schema("equipment")
        .from("equipment")
        .insert({
          id: `eq_${eq.code.toLowerCase()}`,
          code: eq.code,
          name: eq.name,
          level: eq.level,
          parent_id: parent ? `eq_${parent.code.toLowerCase()}` : null,
          is_active: true,
        });

      if (error) {
        console.error(`❌ خطا در درج ${eq.name}:`, error.message);
      }
    }

    // بررسی نهایی
    const { count, error: countError } = await supabase
      .schema("equipment")
      .from("equipment")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ خطا در شمارش:", countError);
    } else {
      console.log(
        `✅ عملیات Seed با موفقیت انجام شد! تعداد کل رکوردها: ${count}`,
      );
    }
  } catch (error) {
    console.error("❌ عملیات Seed با خطا مواجه شد:", error);
  }
}

seed();
