// src/scripts/seedEquipment.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

// ✅ ۱. شبیه‌سازی __dirname برای محیط ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ ۲. دریافت کلیدها از فایل .env
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ خطا: لطفاً VITE_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY را در فایل .env تنظیم کنید.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedEquipment() {
  console.log("🚀 شروع فرآیند وارد کردن داده‌های تجهیزات...");

  try {
    // ✅ ۳. ساخت مسیر دقیق فایل JSON (مطمئن شوید این فایل کنار همین اسکریپت است)
    const jsonPath = join(__dirname, "equipmentSeed.json");

    console.log(`📂 در حال خواندن فایل از مسیر: ${jsonPath}`);

    const rawData = readFileSync(jsonPath, "utf-8");
    const equipmentData = JSON.parse(rawData);

    console.log(`📦 تعداد کل رکوردها: ${equipmentData.length}`);

    // ✅ ۴. وارد کردن دسته‌به‌دسته (Batch) برای جلوگیری از خطای حجم درخواست
    const batchSize = 100;
    for (let i = 0; i < equipmentData.length; i += batchSize) {
      const batch = equipmentData.slice(i, i + batchSize);
      console.log(
        `⏳ در حال پردازش دسته ${Math.floor(i / batchSize) + 1} از ${Math.ceil(equipmentData.length / batchSize)}...`,
      );

      const { error } = await supabase
        .schema("equipment")
        .from("equipment")
        .upsert(batch, { onConflict: "id" }); // اگر رکورد وجود داشت، آپدیت می‌کند

      if (error) {
        console.error(
          `❌ خطا در دسته ${Math.floor(i / batchSize) + 1}:`,
          error.message,
        );
        throw error;
      }

      console.log(
        `✅ دسته ${Math.floor(i / batchSize) + 1} با موفقیت وارد شد.`,
      );
    }

    console.log("🎉 فرآیند Seed کردن داده‌ها با موفقیت به پایان رسید!");
  } catch (error) {
    console.error("💥 خطای بحرانی در فرآیند Seed:", error);
  }
}

// اجرای تابع
seedEquipment();
