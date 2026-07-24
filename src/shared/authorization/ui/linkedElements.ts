//src/shared/authorization/ui/linkedElements.ts

import { getAllDependenciesChain } from "./helpers";

/**
 * 🔗 گروه‌هایی از element ها که معادل هم هستن
 */
export const linkedElementGroups: Record<string, string[]> = {
  client_stat_agreements: ["client_total_agreement_badge"],

  client_stat_value_agreements: ["client_total_agreement_value_badge"],

  client_agreement_value: ["client_total_agreement_value_badge"],

  client_contract_value: ["client_total_agreement_value_badge"],

  client_contract_progress_work: ["client_agreement_progress_work"],

  client_contract_progress_invoice: ["client_agreement_progress_invoice"],

  client_time_remaining: ["client_contract_dates"],
};

/**
 * 🔍 پیدا کردن گروه لینک شده یه element
 */
export function getLinkedGroup(elementId: string): string[] | null {
  for (const [groupName, elements] of Object.entries(linkedElementGroups)) {
    if (elements.includes(elementId)) {
      return elements;
    }
  }
  return null;
}

export function isLinkedElement(elementId: string): boolean {
  return getLinkedGroup(elementId) !== null;
}

/**
 * 🎯 محاسبه "عمق" یه element (تعداد dependencies زنجیره‌ای)
 * هرچی عمق بیشتر = درونی‌تر = نیازمند دسترسی‌های بیشتر
 */
export function getElementDepth(elementId: string): number {
  return getAllDependenciesChain(elementId).length;
}

/**
 * 🎯 پیدا کردن **Master** یه گروه linked
 * Master = اون element که عمق بیشتری داره (درونی‌تر)
 */
export function getLinkedGroupMaster(elementId: string): string {
  const group = getLinkedGroup(elementId);
  if (!group || group.length === 0) return elementId;
  if (group.length === 1) return group[0];

  // محاسبه عمق هر element
  const withDepths = group.map((id) => ({
    id,
    depth: getElementDepth(id),
  }));

  // مرتب‌سازی بر اساس عمق (نزولی)
  withDepths.sort((a, b) => b.depth - a.depth);

  // اگه عمق‌ها مساوی بود، بر اساس حروف الفبا
  if (withDepths[0].depth === withDepths[1].depth) {
    withDepths.sort((a, b) => a.id.localeCompare(b.id));
  }

  return withDepths[0].id;
}

/**
 * 🎯 آیا این element Master گروه خودش هست؟
 */
export function isMasterElement(elementId: string): boolean {
  const group = getLinkedGroup(elementId);
  if (!group) return true; // اگه linked نیست، خودش master هست
  return getLinkedGroupMaster(elementId) === elementId;
}

/**
 * 🎯 گرفتن همه اعضای گروه به جز master
 */
export function getLinkedSlaves(elementId: string): string[] {
  const group = getLinkedGroup(elementId);
  if (!group) return [];
  const master = getLinkedGroupMaster(elementId);
  return group.filter((id) => id !== master);
}
