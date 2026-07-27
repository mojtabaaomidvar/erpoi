// src/shared/utils/dateUtils.ts
import * as jalaali from "jalaali-js";

/**
 * دریافت تاریخ امروز به فرمت جلالی (YYYY/MM/DD)
 */
export const getTodayJalali = (): string => {
  const today = new Date();
  const j = jalaali.toJalaali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
};

export const jalaliToGregorianDate = (jalaliDate: string): Date | null => {
  if (!jalaliDate) return null;
  try {
    const parts = jalaliDate.split(/[\/\-]/).map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;

    const [jy, jm, jd] = parts;
    const g = jalaali.toGregorian(jy, jm, jd);
    return new Date(g.gy, g.gm - 1, g.gd);
  } catch {
    return null;
  }
};

export const compareJalaliDates = (date1: string, date2: string): number => {
  if (!date1 || !date2) return 0;

  const normalize = (d: string) => d.trim().replace(/-/g, "/");
  const num1 = parseInt(normalize(date1).replace(/\//g, ""), 10);
  const num2 = parseInt(normalize(date2).replace(/\//g, ""), 10);

  if (isNaN(num1) || isNaN(num2)) return 0;
  return num1 - num2;
};

export const parseDateFlexible = (
  dateStr: string | null | undefined,
): Date | null => {
  if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "")
    return null;

  const jalaaliDate = jalaliToGregorianDate(dateStr);
  if (jalaaliDate) return jalaaliDate;

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
  } catch {
    return null;
  }
  return null;
};
