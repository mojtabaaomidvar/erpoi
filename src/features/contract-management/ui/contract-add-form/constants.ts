// src/features/contract-management/ui/contract-add-form/constants.ts

import type { DocType } from "./types";

// ═══════════════════════════════════════
// 🔧 Service Types (Multi-select)
// ═══════════════════════════════════════

export const SERVICE_TYPES = [
  { value: "TPI", label: "TPI - Third Party Inspection", icon: "🔍" },
  { value: "MWS", label: "MWS - Marine Warranty Survey", icon: "🔧" },
  { value: "TPER", label: "TPER - Third Party Engineering Review", icon: "📊" },
  { value: "OTHER", label: "Other", icon: "📋" },
] as const;

// ═══════════════════════════════════════
// 🪜 Wizard Steps (برای Progress Bar)
// ═══════════════════════════════════════

export const STEPS: Record<DocType, string[]> = {
  CONTRACT: [
    "Basic Info",
    "Financials",
    "Legal Terms",
    "Attachments",
    "Preview",
  ],
  WORK_ORDER: ["Basic Info", "Financials", "Preview"],
};

// ═══════════════════════════════════════
// 💰 Currencies
// ═══════════════════════════════════════

export const CURRENCIES = [
  { value: "IRR", label: "IRR - Iranian Rial", symbol: "IRR" },
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
] as const;

// ═══════════════════════════════════════
// 🏦 Guarantee Types
// ═══════════════════════════════════════

export const GUARANTEE_TYPES = [
  { value: "BANK_GUARANTEE", label: "Bank Guarantee", icon: "🏦" },
  { value: "CHECK", label: "Check", icon: "📝" },
  { value: "PROMISSORY_NOTE", label: "Promissory Note", icon: "📄" },
  { value: "CASH_BLOCK", label: "Cash Block", icon: "💰" },
] as const;

// ═══════════════════════════════════════
// 📦 Work Order Source Types
// ═══════════════════════════════════════

export const SOURCE_TYPES = [
  { value: "LETTER", label: "Letter", icon: "📄", color: "emerald" },
  { value: "EMAIL", label: "Email", icon: "📧", color: "blue" },
] as const;

// ═══════════════════════════════════════
// 📧 Email Input Methods
// ═══════════════════════════════════════

export const EMAIL_INPUT_METHODS = [
  { value: "MANUAL", label: "Manual Entry", icon: "✍️", comingSoon: false },
  { value: "UPLOAD", label: "Upload File", icon: "📁", comingSoon: false },
  { value: "OUTLOOK", label: "Outlook", icon: "🔗", comingSoon: true },
] as const;

// ═══════════════════════════════════════
// 📊 Adjustment Modes
// ═══════════════════════════════════════

export const ADJUSTMENT_MODES = [
  { value: "FIXED", label: "Fixed", icon: "✅" },
  { value: "TBD", label: "TBD", icon: "⏳" },
] as const;

// ═══════════════════════════════════════
// 📈 Default Values
// ═══════════════════════════════════════

export const DEFAULT_VALUES = {
  GOOD_PERFORMANCE_PERCENTAGE: 10,
  INSURANCE_DEDUCTION_PERCENTAGE: 5,
  DEFAULT_CURRENCY: "IRR",
  DEFAULT_UNIT: "MAN_DAY",
} as const;
