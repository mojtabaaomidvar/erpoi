// src/features/contract-management/utils/contractPriority.ts

import type { Contract, ContractAmendment } from "@/types/contract";
import { jalaaliToGregorianDate } from "@entities/contract/services/contractCalculations";

export type ActionPriority = {
  level: number; // 0 = no action, 1 = highest priority
  type:
    | "pending_approval"
    | "rejected"
    | "expired"
    | "expiring"
    | "not_started"
    | "needs_review"
    | "none";
  label: string;
  color: "amber" | "rose" | "indigo" | "emerald" | "slate";
  icon: string;
  count?: number;
};

/**
 * محاسبه اولویت اکشن برای یک قرارداد
 */
export function getContractActionPriority(
  contract: Contract,
  amendments: ContractAmendment[] = [],
  userRole: string = "user",
): ActionPriority {
  // 🔧 FIX: اگر قرارداد کامل شده است، هیچ اکشنی نیاز نیست
  if (contract.status === "COMPLETED") {
    return {
      level: 0,
      type: "none",
      label: "",
      color: "slate",
      icon: "",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isManager = userRole === "admin" || userRole === "unit_manager";

  // 🔹 سطح ۱: الحاقیه در انتظار تأیید (فقط برای مدیر)
  if (isManager) {
    const pendingAmendments = amendments.filter(
      (a) => a.approval_status === "PENDING",
    );
    if (pendingAmendments.length > 0) {
      return {
        level: 1,
        type: "pending_approval",
        label: `${pendingAmendments.length} Pending`,
        color: "amber",
        icon: "⏳",
        count: pendingAmendments.length,
      };
    }
  }

  // 🔹 سطح 2: قرارداد منقضی شده
  if (contract.end_date) {
    const endDate = jalaaliToGregorianDate(contract.end_date);
    if (endDate && endDate < today) {
      const daysOverdue = Math.floor(
        (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        level: 3,
        type: "expired",
        label: `Expired ${daysOverdue}d`,
        color: "rose",
        icon: "⚠️",
      };
    }
  }

  // 🔹 سطح 3: قرارداد در حال انقضا (کمتر از 30 روز)
  if (contract.end_date) {
    const endDate = jalaaliToGregorianDate(contract.end_date);
    if (endDate) {
      const daysLeft = Math.floor(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft >= 0 && daysLeft <= 30) {
        return {
          level: 4,
          type: "expiring",
          label: `${daysLeft}d left`,
          color: "amber",
          icon: "⏰",
        };
      }
    }
  }

  // 🔹 سطح 4: قرارداد شروع نشده
  if (contract.start_date) {
    const startDate = jalaaliToGregorianDate(contract.start_date);
    if (startDate && startDate > today) {
      return {
        level: 5,
        type: "not_started",
        label: "Not Started",
        color: "indigo",
        icon: "⏳",
      };
    }
  }

  // 🔹 سطح ۰: بدون اکشن
  return {
    level: 0,
    type: "none",
    label: "",
    color: "slate",
    icon: "",
  };
}

/**
 * مرتب‌سازی قراردادها بر اساس اولویت اکشن
 */
export function sortContractsByPriority(
  contracts: Contract[],
  amendmentsMap: Map<string, ContractAmendment[]>,
  userRole: string = "user",
): Contract[] {
  return [...contracts].sort((a, b) => {
    const priorityA = getContractActionPriority(
      a,
      amendmentsMap.get(a.id) || [],
      userRole,
    );
    const priorityB = getContractActionPriority(
      b,
      amendmentsMap.get(b.id) || [],
      userRole,
    );

    // اولویت بالاتر (عدد کمتر) اول می‌آید
    if (priorityA.level !== priorityB.level) {
      return priorityA.level - priorityB.level;
    }

    // اگر اولویت یکسان، بر اساس تاریخ
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}
