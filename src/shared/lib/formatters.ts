// src/lib/formatters.ts
// توابع فرمت و محاسباتی قرارداد
//  ترکیب توابع اصلی فرمت + re-export از contractCalculations

import { format } from"date-fns";
import * as jalaali from"jalaali-js";

// ============ توابع اصلی فرمت ============

export function formatCurrency(amount: number | string, currency: string ="USD"): string {
  if (currency ==="IRR") {
    return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(
    typeof amount ==="string"? Number(amount)
      : amount
  ) +"ریال";
  }
  const sym = currency ==="USD"?"$":"€";
  return sym + new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    typeof amount ==="string"? Number(amount)
      : amount
  );
}

export function formatDate(d: string): string {
  try {
    return format(new Date(d),"d MMM yyyy");
  } catch {
    return d;
  }
}

export function formatDateShort(d: string): string {
  try {
    return format(new Date(d),"dd MMM");
  } catch {
    return d;
  }
}

export function contractHealth(con: { end_date: string; total_value: number; invoiced: number }) {
  const endDate = new Date(con.end_date);
  const today = new Date("2026-05-28");
  const daysLeft = Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const spent = con.total_value > 0 ? (con.invoiced / con.total_value) * 100 : 0;

  let timeTone:"emerald"|"amber"|"rose"="emerald";
  if (daysLeft < 0) timeTone ="rose";
  else if (daysLeft < 60) timeTone ="amber";

  let budgetTone:"emerald"|"amber"|"rose"="emerald";
  if (spent >= 100) budgetTone ="rose";
  else if (spent >= 80) budgetTone ="amber";

  return { daysLeft, spent, timeTone, budgetTone };
}

// ============ Re-export توابع محاسباتی از contractCalculations ============
// برای backward compatibility - کدهای قدیمی که از formatters import می‌کنن نشکنن

export {
  calculateDaysLeft,
  getDaysUntilStart,
  isContractNotStarted,
  calculateDaysProgress,
  getDaysProgressColor,
} from"@entities/contract/services/contractCalculations";




