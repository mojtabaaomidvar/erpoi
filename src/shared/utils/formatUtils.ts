// src/shared/utils/formatUtils.ts

/**
 * تابع استاندارد پروژه برای تبدیل ایمن هر نوع داده‌ای به رشته نمایشی
 * - آرایه را با کاما جدا می‌کند
 * - رشته JSON را پارس می‌کند
 * - مقادیر خالی را با "—" نشان می‌دهد
 */
export const formatArrayField = (value: any): string => {
  if (!value) return "—";

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? parsed.join(", ") : "—";
      }
      return String(parsed);
    } catch {
      // اگر JSON نبود، خود رشته را برمی‌گرداند (مثلاً "Mechanical")
      return value;
    }
  }

  return String(value);
};