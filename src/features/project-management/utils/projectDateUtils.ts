// src/features/project-management/utils/projectDateUtils.ts

/**
 * Converts Jalali date (YYYY/MM/DD) to Gregorian for calculations
 */
function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number,
): [number, number, number] {
  const sal_a = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    72 +
    jd +
    (jm <= 6 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_b = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
  ];
  for (let i = 0; i < 12 && gd > sal_b[i]; i++) gd -= sal_b[i];
  const gm = gd > sal_b[0] ? Math.floor((gd - 1) / 30) + 1 : 1;
  return [gy, gm, gd];
}

/**
 * Converts Jalali date string to JavaScript Date object
 */
export function jalaliDateToDate(jalaliDate: string): Date {
  const parts = jalaliDate.split("/");
  if (parts.length !== 3) return new Date();
  const [jy, jm, jd] = parts.map(Number);
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Compares two Jalali dates
 * @returns Negative if date1 < date2, 0 if equal, positive if date1 > date2
 */
export function compareJalaliDates(date1: string, date2: string): number {
  return date1.localeCompare(date2);
}

/**
 * Calculates the number of days between two Jalali dates
 */
export function getDaysDifference(startDate: string, endDate: string): number {
  const start = jalaliDateToDate(startDate);
  const end = jalaliDateToDate(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Gets today's date in Jalali format (YYYY/MM/DD)
 */
export function getTodayJalali(): string {
  const today = new Date();
  const gy = today.getFullYear();
  const gm = today.getMonth() + 1;
  const gd = today.getDate();

  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
  let days =
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  if (gm > 2 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) days++;
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
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
