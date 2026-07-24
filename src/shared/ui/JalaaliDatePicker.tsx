// src/shared/ui/JalaaliDatePicker.tsx

import { useTheme } from "@app/providers/ThemeProvider";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";

interface JalaaliDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function JalaaliDatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  disabled = false,
  className = "",
}: JalaaliDatePickerProps) {
  const { isDark } = useTheme();

  // ✅ تبدیل ایمن رشته جلالی به DateObject
  const stringToDateObject = (jDate: string): DateObject | undefined => {
    if (!jDate) return undefined;
    try {
      const parts = jDate.split("/");
      if (parts.length !== 3) return undefined;

      const year = Number(parts[0]);
      const month = Number(parts[1]); // عدد ۱ تا ۱۲ (کتابخانه خودش ایندکس را مدیریت می‌کند)
      const day = Number(parts[2]);

      if (!year || !month || !day) return undefined;

      return new DateObject({
        year,
        month,
        day,
        calendar: persian,
        locale: persian_en,
      });
    } catch {
      return undefined;
    }
  };

  // ✅ هندلر انتخاب تاریخ با استفاده از متد داخلی format (حذف باگ یک ماه اختلاف)
  const handleSelect = (date: any) => {
    if (!date) {
      onChange("");
      return;
    }

    // اگر کاربر بازه انتخاب کرد، فقط تاریخ اول را در نظر می‌گیریم
    const selectedDate = Array.isArray(date) ? date[0] : date;

    if (selectedDate) {
      // 🔑 کلید حل مشکل: استفاده از متد format خود کتابخانه
      // این متد به صورت ذاتی تقویم و لوکال را می‌شناسد و باگ‌های 0-index یا 1-index را ندارد
      if (typeof selectedDate.format === "function") {
        onChange(selectedDate.format("YYYY/MM/DD"));
      } else {
        // Fallback نهایی برای اطمینان صددرصد
        const d = new DateObject({
          date: selectedDate,
          calendar: persian,
          locale: persian_en,
        });
        onChange(d.format("YYYY/MM/DD"));
      }
    }
  };

  return (
    <div className={`w-full relative ${className}`}>
      <DatePicker
        calendar={persian}
        locale={persian_en} // نمایش روزهای هفته به انگلیسی (Sat, Sun, ...)
        value={stringToDateObject(value)}
        onChange={handleSelect}
        minDate={minDate ? stringToDateObject(minDate) : undefined}
        maxDate={maxDate ? stringToDateObject(maxDate) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        portal // ✅ رندر مستقیم در body برای جلوگیری از رفتن به زیر مودال
        inputClass={`w-full rounded-lg py-2.5 px-3 text-sm text-left font-sans input-themed transition-colors outline-none cursor-pointer ${
          isDark
            ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        containerClassName="w-full"
        style={{ width: "100%" }}
      />
    </div>
  );
}
