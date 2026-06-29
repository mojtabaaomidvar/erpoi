// src/components/JalaaliDatePicker.tsx
import { useTheme } from "@app/providers/ThemeProvider";
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_en from 'react-date-object/locales/persian_en';
import * as jalaali from 'jalaali-js';

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

  // 🔑 تبدیل تاریخ جلالی (1405/01/15) به Date object
  const jalaaliToDate = (jDate: string): Date | undefined => {
    if (!jDate) return undefined;
    try {
      const [jy, jm, jd] = jDate.split('/').map(Number);
      if (!jy || !jm || !jd) return undefined;
      const g = jalaali.toGregorian(jy, jm, jd);
      return new Date(g.gy, g.gm, g.gd);
    } catch {
      return undefined;
    }
  };

  // 🔑 تبدیل Date object به تاریخ جلالی (1405/01/15)
  const dateToJalaali = (date: Date): string => {
    const j = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
  };

  const handleSelect = (date: any) => {
    if (date && !Array.isArray(date)) {
      if (date instanceof Date) {
        onChange(dateToJalaali(date));
      } else if (date.year && date.month && date.day) {
        const formatted = `${date.year}/${String(date.month.index || date.month).padStart(2, '0')}/${String(date.day).padStart(2, '0')}`;
        onChange(formatted);
      }
    } else {
      onChange("");
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <DatePicker
        calendar={persian}
        locale={persian_en}
        calendarPosition="bottom-right"
        value={jalaaliToDate(value)}
        onChange={handleSelect}
        minDate={minDate ? jalaaliToDate(minDate) : undefined}
        maxDate={maxDate ? jalaaliToDate(maxDate) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        format="YYYY/MM/DD"
        inputClass={`w-full rounded-lg py-2.5 px-3 text-sm text-left font-sans input-themed ${
          isDark
            ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500"
            : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"
        }`}
        containerClassName="w-full"
        style={{ width: "100%" }}
      />
    </div>
  );
}



