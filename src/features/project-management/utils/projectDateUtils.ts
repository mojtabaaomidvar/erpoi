// src/features/project-management/utils/projectDateUtils.ts

import {
  getTodayJalali,
  jalaliToGregorianDate,
  compareJalaliDates,
} from "@/shared/utils/dateUtils";

/**
 * Calculates the number of days between two Jalali dates
 */
export function getDaysDifference(startDate: string, endDate: string): number {
  const start = jalaliToGregorianDate(startDate);
  const end = jalaliToGregorianDate(endDate);

  if (!start || !end) return 0;

  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the dynamic status of a project based on current date
 */
export function calculateProjectStatus(
  startDate: string,
  endDate: string,
  currentStatus: string,
): string {
  const today = getTodayJalali();

  if (compareJalaliDates(today, startDate) < 0) {
    return "NOT_STARTED";
  }
  if (compareJalaliDates(today, endDate) > 0) {
    return "COMPLETED";
  }

  return currentStatus === "ON_HOLD" || currentStatus === "CANCELLED"
    ? currentStatus
    : "ACTIVE";
}

/**
 * Calculates the time progress percentage of a project
 */
export function calculateTimeProgress(
  startDate: string,
  endDate: string,
): number {
  const today = getTodayJalali();

  if (compareJalaliDates(today, startDate) < 0) return 0;
  if (compareJalaliDates(today, endDate) > 0) return 100;

  const totalDays = getDaysDifference(startDate, endDate);
  const elapsedDays = getDaysDifference(startDate, today);

  if (totalDays <= 0) return 0;

  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
}
