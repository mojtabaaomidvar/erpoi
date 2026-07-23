// src/lib/contractCalculations.ts
// توابع محاسباتی مشترک بین Contracts و Clients

import * as jalaali from "jalaali-js";
import { contractTariffs } from "@data/mockData";

const formatCurrencyLocal = (
  amount: number,
  currency: string = "IRR",
): string => {
  if (currency === "IRR") {
    return (
      new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
        amount,
      ) + " IRR"
    );
  }
  const sym = currency === "USD" ? "$" : "€";
  return (
    sym +
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)
  );
};

// ═══════════════════════════════════════
// 🔑 Helper: Parse Jalaali Date (با try-catch)
// ═══════════════════════════════════════

/**
 * Parse تاریخ شمسی با فرمت YYYY/MM/DD
 * اگر نامعتبر باشد، null برمی‌گرداند
 */
export const parseJalaaliDate = (
  dateStr: string | null | undefined,
): { jy: number; jm: number; jd: number } | null => {
  if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "") {
    return null;
  }

  try {
    // 🔧 FIX: قبول هر دو فرمت / و -
    const parts = dateStr.split(/[\/\-]/).map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return null;
    }

    const [jy, jm, jd] = parts;

    // اعتبارسنجی محدوده
    if (jy < -61 || jy > 3177 || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
      return null;
    }

    return { jy, jm, jd };
  } catch (error) {
    return null;
  }
};

/**
 * تبدیل تاریخ شمسی به Gregorian Date
 * اگر نامعتبر باشد، null برمی‌گرداند
 */
export const jalaaliToGregorianDate = (
  dateStr: string | null | undefined,
): Date | null => {
  const parsed = parseJalaaliDate(dateStr);
  if (!parsed) return null;

  try {
    const gDate = jalaali.toGregorian(parsed.jy, parsed.jm, parsed.jd);
    return new Date(gDate.gy, gDate.gm - 1, gDate.gd);
  } catch (error) {
    return null;
  }
};

/**
 * 🔧 NEW: Parse تاریخ با پشتیبانی از فرمت‌های مختلف
 * - Jalaali: 1403/01/01 یا 1403-01-01
 * - Gregorian: 2024-03-20
 */
export const parseDateFlexible = (
  dateStr: string | null | undefined,
): Date | null => {
  if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "") {
    return null;
  }

  // اول تلاش برای parse به عنوان Jalaali
  const jalaaliDate = jalaaliToGregorianDate(dateStr);
  if (jalaaliDate) return jalaaliDate;

  // اگر Jalaali نبود، تلاش برای parse به عنوان Gregorian
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {}

  return null;
};

// ═══════════════════════════════════════
// 🔑 توابع فرمت اعداد
// ═══════════════════════════════════════

// src/entities/contract/services/contractCalculations.ts

export const formatNumberInput = (
  value: string | number | undefined | null,
  allowDecimals: boolean = false,
): string => {
  // 1. هندل کردن مقادیر خالی
  if (value === undefined || value === null) return "";

  // 2. تبدیل به رشته و حذف کاراکترهای غیرعددی (به جز نقطه و منفی)
  let strValue = typeof value === "number" ? value.toString() : String(value);
  let cleaned = strValue.replace(/[^\d.-]/g, "");

  // 3. مدیریت علامت منفی
  const isNegative = cleaned.startsWith("-");
  if (isNegative) cleaned = cleaned.substring(1);

  if (!cleaned) return "";

  // 4. جداسازی بخش صحیح و اعشاری
  const parts = cleaned.split(".");
  let intPart = parts[0];
  let decPart = parts.length > 1 ? parts[1] : undefined;

  // 5. اگر اعشار مجاز نیست، بخش اعشاری را دور بریز
  if (!allowDecimals) {
    decPart = undefined;
  } else {
    // اگر اعشار مجاز است، فقط دو رقم اول را نگه دار
    if (decPart && decPart.length > 2) {
      decPart = decPart.substring(0, 2);
    }
  }

  // 6. فرمت کردن بخش صحیح با کاما (هزارگان)
  const formattedInt = intPart ? Number(intPart).toLocaleString("en-US") : "";

  // 7. ساخت خروجی نهایی
  let result = formattedInt;
  if (decPart !== undefined) {
    result += "." + decPart;
  }

  return (isNegative ? "-" : "") + result;
};

export const parseNumberInput = (
  value: string | number | undefined | null,
): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  // حذف کاماها قبل از تبدیل به عدد
  const num = parseFloat(String(value).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
};

// ═══════════════════════════════════════
// 🔑 توابع Progress Color
// ═══════════════════════════════════════

export const getProgressColor = (
  progress: number,
  isDark: boolean = false,
): string => {
  if (isDark) {
    if (progress >= 100) return "bg-emerald-400";
    if (progress >= 75) return "bg-emerald-300";
    if (progress >= 50) return "bg-amber-400";
    if (progress >= 25) return "bg-orange-400";
    return "bg-rose-400";
  }
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 75) return "bg-emerald-400";
  if (progress >= 50) return "bg-amber-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-rose-500";
};

export const getProgressTextClass = (
  progress: number,
  isDark: boolean = false,
): string => {
  if (isDark) {
    if (progress >= 100) return "text-emerald-400";
    if (progress >= 80) return "text-amber-400";
    if (progress >= 50) return "text-yellow-400";
    if (progress >= 25) return "text-orange-400";
    return "text-rose-400";
  }
  if (progress >= 100) return "text-emerald-600";
  if (progress >= 80) return "text-amber-600";
  if (progress >= 50) return "text-yellow-600";
  if (progress >= 25) return "text-orange-600";
  return "text-rose-600";
};

export const getProgressTextColor = (
  progress: number,
  isDark: boolean = false,
): string => {
  if (isDark) {
    if (progress >= 100) return "text-emerald-400";
    if (progress >= 75) return "text-emerald-300";
    if (progress >= 50) return "text-amber-400";
    if (progress >= 25) return "text-orange-400";
    return "text-rose-400";
  }
  if (progress >= 100) return "text-emerald-600";
  if (progress >= 75) return "text-emerald-500";
  if (progress >= 50) return "text-amber-600";
  if (progress >= 25) return "text-orange-600";
  return "text-rose-600";
};

export const getProgressTone = (
  progress: number,
  isDark: boolean = false,
): string => {
  if (progress >= 100) return "emerald";
  if (progress >= 80) return "amber";
  if (progress >= 50) return "yellow";
  if (progress >= 25) return "orange";
  return "rose";
};

export const getProgressBgClass = (
  progress: number,
  isDark: boolean = false,
): string => {
  if (isDark) {
    if (progress >= 100) return "bg-emerald-400";
    if (progress >= 80) return "bg-amber-400";
    if (progress >= 50) return "bg-yellow-400";
    if (progress >= 25) return "bg-orange-400";
    return "bg-rose-400";
  }
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 80) return "bg-amber-500";
  if (progress >= 50) return "bg-yellow-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-rose-500";
};

export const getDaysProgressColor = (
  progress: number,
  isDark: boolean = false,
): string => {
  if (isDark) {
    if (progress >= 90) return "bg-rose-400";
    if (progress >= 70) return "bg-amber-400";
    if (progress >= 50) return "bg-yellow-400";
    return "bg-emerald-400";
  }
  if (progress >= 90) return "bg-rose-500";
  if (progress >= 70) return "bg-amber-500";
  if (progress >= 50) return "bg-yellow-500";
  return "bg-emerald-500";
};

// ═══════════════════════════════════════
// 🔑 توابع محاسباتی قرارداد
// ═══════════════════════════════════════

interface TariffLike {
  rate: string | number;
  consumed_quantity?: number;
  total_quantity?: number;
  invoiced?: number;
  contract_id?: string;
}

interface ContractLike {
  id: string;
  total_value: number;
  start_date: string;
  end_date: string;
  invoiced: number;
  status: string;
  currency?: string;
  tariffLines?: TariffLike[];
  financial_terms?: {
    adjustment?: {
      enabled?: boolean;
      effective_date?: string;
      mode?: "FIXED" | "TBD";
      percentage?: number;
    };
  };
}

// 🔧 FIX: Helper برای گرفتن tariffs از contract یا mockData
const getTariffsForContract = (contract: ContractLike): TariffLike[] => {
  // اولویت با tariffLines از خود contract (Supabase)
  if (contract.tariffLines && contract.tariffLines.length > 0) {
    return contract.tariffLines;
  }
  // Fallback به mockData
  return contractTariffs.filter((t) => t.contract_id === contract.id);
};

export const calculateProgressFromTariffs = (
  contract: ContractLike,
): number => {
  try {
    const tariffs = getTariffsForContract(contract);
    if (tariffs.length === 0) return 0;
    if (contract.total_value <= 0) return 0;

    const totalPerformed = tariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string" ? parseNumberInput(t.rate) : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);

    return (totalPerformed / contract.total_value) * 100;
  } catch (error) {
    return 0;
  }
};

export const calculateInvoiceProgress = (contract: ContractLike): number => {
  try {
    const tariffs = getTariffsForContract(contract);
    if (tariffs.length === 0) return 0;

    const totalInvoiced = tariffs.reduce(
      (sum, t) => sum + (t.invoiced || 0),
      0,
    );
    const performedWork = tariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string" ? parseNumberInput(t.rate) : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);

    if (performedWork <= 0) return 0;
    return (totalInvoiced / performedWork) * 100;
  } catch (error) {
    return 0;
  }
};

export const calculateDaysProgress = (
  contract: ContractLike,
): number | null => {
  try {
    if (!contract.start_date || !contract.end_date) {
      return null;
    }

    // 🔧 FIX: استفاده از parseDateFlexible
    const startDate = parseDateFlexible(contract.start_date);
    const endDate = parseDateFlexible(contract.end_date);

    if (!startDate || !endDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysPassed =
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (totalDays <= 0) {
      return null;
    }
    if (daysPassed < 0) return 0; // قرارداد هنوز شروع نشده
    if (daysPassed >= totalDays) return 100;

    return (daysPassed / totalDays) * 100;
  } catch (error) {
    return null;
  }
};

export const calculateDaysLeft = (endDate: string): number => {
  try {
    if (!endDate) return 0;

    const endGregorian = parseDateFlexible(endDate);
    if (!endGregorian) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = endGregorian.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

export const getDaysUntilStart = (startDate: string): number => {
  try {
    if (!startDate) return 0;

    const startGregorian = parseDateFlexible(startDate);
    if (!startGregorian) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = startGregorian.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

export const isContractNotStarted = (startDate: string): boolean => {
  try {
    if (!startDate) return false;

    const startGregorian = parseDateFlexible(startDate);
    if (!startGregorian) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return startGregorian.getTime() > today.getTime();
  } catch (error) {
    return false;
  }
};

export const calculateBudgetSpent = (
  totalValue: number,
  invoiced: number,
): number => {
  if (totalValue <= 0) return 0;
  return (invoiced / totalValue) * 100;
};

// ═══════════════════════════════════════
// 🔑 توابع محاسباتی مشتریان (برای Clients.tsx)
// ═══════════════════════════════════════

export const calculatePerformedWorkValue = (tariffs: TariffLike[]): number => {
  return tariffs.reduce((sum, t) => {
    const rate =
      typeof t.rate === "string" ? parseNumberInput(t.rate) : t.rate || 0;
    const consumed = t.consumed_quantity || 0;
    return sum + rate * consumed;
  }, 0);
};

export const calculateTotalInvoicedFromTariffs = (
  tariffs: TariffLike[],
): number => {
  return tariffs.reduce((sum, t) => sum + (t.invoiced || 0), 0);
};

export const calculateUninvoicedWork = (tariffs: TariffLike[]): number => {
  const performed = calculatePerformedWorkValue(tariffs);
  const invoiced = calculateTotalInvoicedFromTariffs(tariffs);
  return Math.max(0, performed - invoiced);
};

// ═══════════════════════════════════════
// 🔑 توابع Contracts-specific
// ═══════════════════════════════════════

export const getNextJalaaliYearStart = (startDate: string): string => {
  const parsed = parseJalaaliDate(startDate);
  if (!parsed) return "";
  const nextYear = parsed.jy + 1;
  return `${nextYear}/01/01`;
};

export const getCurrentJalaaliYear = (): number => {
  try {
    const now = new Date();
    const j = jalaali.toJalaali(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
    );
    return j.jy;
  } catch (error) {
    return new Date().getFullYear();
  }
};

export const generateContractNo = (
  type: "CONTRACT" | "WORK_ORDER",
  contracts: ContractLike[],
  department: string = "Unit A",
): string => {
  const year = getCurrentJalaaliYear();
  const prefix = type === "CONTRACT" ? "CTR" : "WO";
  const deptCode = department === "Unit A" ? "UNA" : "DEPT";
  const count = contracts.filter((c) => c.status !== "COMPLETED").length + 1;
  return `${prefix}-${deptCode}-${year}-${String(count).padStart(4, "0")}`;
};

export const getContractFinancialStatus = (
  contract: ContractLike,
): "completed" | "needs_review" | "active" | "not_started" => {
  try {
    const daysLeft = calculateDaysLeft(contract.end_date);
    const daysUntilStart = getDaysUntilStart(contract.start_date);
    const notStarted = daysUntilStart > 0;
    const isExpired = daysLeft < 0;

    const tariffs = getTariffsForContract(contract);
    const performedWork = tariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string" ? parseNumberInput(t.rate) : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);
    const reachedCeiling = performedWork >= contract.total_value;

    const isFullyInvoiced = contract.invoiced >= contract.total_value;

    if (contract.status === "COMPLETED") return "completed";
    if (notStarted) return "not_started";

    if ((isExpired || reachedCeiling) && isFullyInvoiced) return "completed";
    if (isExpired || reachedCeiling) return "needs_review";

    return "active";
  } catch (error) {
    console.warn("[getContractFinancialStatus] Error:", error);
    return "active";
  }
};

export const getAdjustmentReminder = (
  contract: ContractLike,
): {
  show: boolean;
  daysUntil: number;
  mode: "FIXED" | "TBD";
  percentage: number;
  effectiveDate: string;
} => {
  try {
    if (!contract.financial_terms?.adjustment?.enabled) {
      return {
        show: false,
        daysUntil: 0,
        mode: "FIXED",
        percentage: 0,
        effectiveDate: "",
      };
    }

    const adjustment = contract.financial_terms.adjustment;
    if (!adjustment.effective_date) {
      return {
        show: false,
        daysUntil: 0,
        mode: adjustment.mode || "FIXED",
        percentage: adjustment.percentage || 0,
        effectiveDate: "",
      };
    }

    const daysUntil = getDaysUntilStart(adjustment.effective_date);
    const shouldShow = daysUntil > 0 && daysUntil <= 30;

    return {
      show: shouldShow,
      daysUntil,
      mode: adjustment.mode || "FIXED",
      percentage: adjustment.percentage || 0,
      effectiveDate: adjustment.effective_date,
    };
  } catch (error) {
    return {
      show: false,
      daysUntil: 0,
      mode: "FIXED",
      percentage: 0,
      effectiveDate: "",
    };
  }
};

export const isExpiringSoon = (
  contract: ContractLike,
): { expiring: boolean; daysLeft: number } => {
  try {
    if (contract.status !== "ACTIVE") return { expiring: false, daysLeft: 0 };

    const daysLeft = calculateDaysLeft(contract.end_date);
    const daysUntilStart = getDaysUntilStart(contract.start_date);

    const tariffs = getTariffsForContract(contract);
    const performedWork = tariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string" ? parseNumberInput(t.rate) : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);
    const reachedCeiling = performedWork >= contract.total_value;

    if (daysUntilStart > 0 || daysLeft <= 0)
      return { expiring: false, daysLeft };

    return { expiring: daysLeft <= 132 || reachedCeiling, daysLeft };
  } catch (error) {
    return { expiring: false, daysLeft: 0 };
  }
};

export const getNeedsReviewType = (
  contract: ContractLike,
): {
  type: "value_review" | "invoice_review" | "time_review" | "none";
  message: string;
  details: string;
} => {
  try {
    const daysLeft = calculateDaysLeft(contract.end_date);
    const isExpired = daysLeft < 0;

    const tariffs = getTariffsForContract(contract);
    const performedWork = tariffs.reduce((sum, t) => {
      const rate =
        typeof t.rate === "string" ? parseNumberInput(t.rate) : t.rate || 0;
      const consumed = t.consumed_quantity || 0;
      return sum + rate * consumed;
    }, 0);

    const totalInvoiced = tariffs.reduce(
      (sum, t) => sum + (t.invoiced || 0),
      0,
    );
    const invoicePercentage =
      performedWork > 0 ? (totalInvoiced / performedWork) * 100 : 0;

    if (performedWork > contract.total_value && !isExpired) {
      const overAmount = performedWork - contract.total_value;
      return {
        type: "value_review",
        message: "Total Agreement Value Review",
        details: `Performed work (${formatCurrencyLocal(performedWork, contract.currency || "IRR")}) exceeds total contract value (${formatCurrencyLocal(contract.total_value, contract.currency || "IRR")}) by ${formatCurrencyLocal(overAmount, contract.currency || "IRR")}`,
      };
    }

    if (invoicePercentage > 110) {
      return {
        type: "invoice_review",
        message: "Invoice Review Required",
        details: `Invoiced amount (${formatCurrencyLocal(totalInvoiced, contract.currency || "IRR")}) is ${invoicePercentage.toFixed(1)}% of performed work (${formatCurrencyLocal(performedWork, contract.currency || "IRR")}). This exceeds the 110% threshold.`,
      };
    }

    if (
      isExpired &&
      contract.invoiced <= contract.total_value &&
      invoicePercentage <= 110
    ) {
      const daysOverdue = Math.abs(daysLeft);
      return {
        type: "time_review",
        message: "Time Review Required",
        details: `Contract expired ${daysOverdue} days ago. Please review and decide whether to extend or complete the contract.`,
      };
    }

    return { type: "none", message: "", details: "" };
  } catch (error) {
    return { type: "none", message: "", details: "" };
  }
};

export const getInvoicedPercentage = (contract: ContractLike): number => {
  try {
    if (contract.total_value <= 0) return 0;
    return (contract.invoiced / contract.total_value) * 100;
  } catch (error) {
    return 0;
  }
};
