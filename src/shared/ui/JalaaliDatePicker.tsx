// src/shared/ui/JalaaliDatePicker.tsx

import { useState } from "react";
import { useTheme } from "@app/providers/ThemeProvider";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

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

  const [activeCalendar, setActiveCalendar] = useState<"jalali" | "gregorian">(
    "jalali",
  );

  const currentCalendar = activeCalendar === "jalali" ? persian : gregorian;
  const currentLocale = activeCalendar === "jalali" ? persian_en : gregorian_en;

  const smartParseDate = (
    dateStr: string,
    targetCal: typeof persian | typeof gregorian,
    targetLoc: any,
  ): DateObject | undefined => {
    if (!dateStr) return undefined;
    try {
      const parts = dateStr.split("/");
      if (parts.length !== 3) return undefined;

      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);

      if (!year || !month || !day) return undefined;

      const isLikelyGregorian = year > 1500;
      const sourceCal = isLikelyGregorian ? gregorian : persian;
      const sourceLoc = isLikelyGregorian ? gregorian_en : persian_en;

      const sourceDateObj = new DateObject({
        year,
        month,
        day,
        calendar: sourceCal,
        locale: sourceLoc,
      });

      if (sourceCal === targetCal) return sourceDateObj;

      return new DateObject({
        date: sourceDateObj,
        calendar: targetCal,
        locale: targetLoc,
      });
    } catch {
      return undefined;
    }
  };

  const handleSelect = (date: any) => {
    if (!date) {
      onChange("");
      return;
    }

    const selectedDate = Array.isArray(date) ? date[0] : date;

    if (selectedDate) {
      let dateObj: DateObject;
      if (typeof selectedDate.format === "function") {
        dateObj = selectedDate;
      } else {
        dateObj = new DateObject({
          date: selectedDate,
          calendar: currentCalendar,
          locale: currentLocale,
        });
      }

      const jalaliDateObj = new DateObject({
        date: dateObj,
        calendar: persian,
        locale: persian_en,
      });

      onChange(jalaliDateObj.format("YYYY/MM/DD"));
    }
  };

  const handleToggleCalendar = () => {
    setActiveCalendar((prev) => (prev === "jalali" ? "gregorian" : "jalali"));
  };

  return (
    <div className={`w-full relative ${className}`}>
      <DatePicker
        calendar={currentCalendar}
        locale={currentLocale}
        value={smartParseDate(value, currentCalendar, currentLocale)}
        onChange={handleSelect}
        minDate={
          minDate
            ? smartParseDate(minDate, currentCalendar, currentLocale)
            : undefined
        }
        maxDate={
          maxDate
            ? smartParseDate(maxDate, currentCalendar, currentLocale)
            : undefined
        }
        placeholder={placeholder}
        disabled={disabled}
        format="YYYY/MM/DD"
        calendarPosition="bottom-right"
        portal
        inputClass={`w-full rounded-lg py-2.5 pl-10 pr-3 text-sm text-left font-sans input-themed transition-colors outline-none cursor-pointer ${
          isDark
            ? "border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            : "border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        containerClassName="w-full"
        style={{ width: "100%" }}
      />

      {!disabled && (
        <button
          type="button"
          onClick={handleToggleCalendar}
          className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
            isDark
              ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-700"
              : "text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
          }`}
          title={
            activeCalendar === "jalali"
              ? "Switch to Gregorian"
              : "Switch to Jalali"
          }
        >
          {activeCalendar === "jalali" ? (
            <span className="text-[10px] font-bold tracking-wider">FA</span>
          ) : (
            <span className="text-[10px] font-bold tracking-wider">EN</span>
          )}
        </button>
      )}
    </div>
  );
}
