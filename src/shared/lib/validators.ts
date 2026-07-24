// src/shared/lib/validators.ts

/**
 * فرمت قیمت را به صورت سه رقم سه رقم با کاما جدا می‌کند
 */
export function formatPrice(value: number | string): string {
  const num =
    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US");
}

/**
 * کاماها را از رشته حذف کرده و عدد برمی‌گرداند
 */
export function parsePrice(value: string): number {
  const cleaned = value.replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * اعتبارسنجی شماره موبایل ایران
 */
export function validateMobile(mobile: string): boolean {
  const regex = /^09[0-9]{9}$/;
  return regex.test(mobile);
}

/**
 * اعتبارسنجی کد ملی ایران
 */
export function validateNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;

  const check = parseInt(code[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code[i], 10) * (10 - i);
  }
  const remainder = sum % 11;

  return (
    (remainder < 2 && check === remainder) ||
    (remainder >= 2 && check === 11 - remainder)
  );
}

/**
 * اعتبارسنجی شناسه ملی شرکت
 */
export function validateNationalId(id: string): boolean {
  if (!/^\d{11}$/.test(id)) return false;
  return true; // می‌توانید الگوریتم دقیق‌تر را اضافه کنید
}

/**
 * ✅ تبدیل تاریخ جلالی (YYYY/MM/DD) به عدد قابل مقایسه
 */
function jalaaliDateToNumber(date: string): number {
  if (!date) return 0;
  const parts = date.split("/").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [year, month, day] = parts;
  // تبدیل به یک عدد یکتا برای مقایسه: YYYYMMDD
  return year * 10000 + month * 100 + day;
}

/**
 * ✅ اعتبارسنجی بازه تاریخ (تاریخ شروع نباید بعد از تاریخ پایان باشد)
 * @param startDate تاریخ شروع به فرمت YYYY/MM/DD
 * @param endDate تاریخ پایان به فرمت YYYY/MM/DD
 * @returns نتیجه اعتبارسنجی
 */
export function validateDateRange(
  startDate: string,
  endDate: string,
): { isValid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { isValid: true }; // اگر یکی خالی است، اعتبارسنجی بازه لازم نیست
  }

  const startNum = jalaaliDateToNumber(startDate);
  const endNum = jalaaliDateToNumber(endDate);

  if (startNum === 0 || endNum === 0) {
    return { isValid: false, error: "Invalid date format" };
  }

  if (startNum > endNum) {
    return {
      isValid: false,
      error: "Start date cannot be after end date",
    };
  }

  return { isValid: true };
}

/**
 * ✅ بررسی معتبر بودن فرمت تاریخ جلالی
 */
export function isValidJalaaliDate(date: string): boolean {
  if (!date) return false;
  const parts = date.split("/").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return false;
  const [year, month, day] = parts;
  if (year < 1300 || year > 1500) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}
