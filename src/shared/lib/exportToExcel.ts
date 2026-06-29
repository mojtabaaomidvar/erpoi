import * as XLSX from "xlsx";

/**
 * تابع عمومی برای خروجی گرفتن از هر آرایه‌ای به فرمت اکسل
 * @param data آرایه‌ای از آبجکت‌ها که می‌خواهید اکسپورت شود
 * @param fileName نام فایل خروجی (بدون پسوند)
 * @param sheetName نام شیت داخل فایل اکسل
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = "Sheet1") {
  // ۱. ساخت یک ورک‌بوک جدید
  const wb = XLSX.utils.book_new();
  
  // ۲. تبدیل داده‌های JSON به شیت اکسل
  const ws = XLSX.utils.json_to_sheet(data);
  
  // ۳. تنظیم عرض ستون‌ها برای خوانایی بهتر (اختیاری ولی توصیه می‌شود)
  const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }));
  ws["!cols"] = colWidths;

  // ۴. اضافه کردن شیت به ورک‌بوک
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // ۵. دانلود فایل
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}




