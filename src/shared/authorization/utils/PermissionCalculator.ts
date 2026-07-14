// src/shared/authorization/utils/PermissionCalculator.ts

import { getBasePermissions } from "../config/RoleBasePermissions";

/**
 * محاسبه Effective Permissions (ترکیب Base + Custom)
 * این تابع همیشه Base Permissions را حفظ می‌کند
 */
export function calculateEffectivePermissions(
  role: string,
  customPermissions: string[] = [],
): string[] {
  const basePermissions = getBasePermissions(role);

  // Admin - دسترسی کامل
  if (role === "admin" || basePermissions.includes("*:*")) {
    return ["*:*"];
  }

  // ترکیب unique از base + custom
  const combined = new Set([...basePermissions, ...customPermissions]);

  return Array.from(combined);
}

/**
 * دریافت Custom Permissions (آن‌هایی که در base نیستند)
 */
export function getCustomPermissions(
  role: string,
  effectivePermissions: string[],
): string[] {
  const basePermissions = getBasePermissions(role);
  return effectivePermissions.filter((p) => !basePermissions.includes(p));
}

/**
 * بررسی آیا یک permission قابل حذف است یا نه
 */
export function isPermissionRemovable(
  role: string,
  permission: string,
): boolean {
  if (role === "admin") return false;
  return !isBasePermission(role, permission);
}

/**
 * فیلتر کردن Custom Permissions از لیست (حذف base ها)
 * این تابع برای ذخیره در دیتابیس استفاده می‌شود
 */
export function filterCustomPermissionsOnly(
  role: string,
  permissions: string[],
): string[] {
  const basePermissions = getBasePermissions(role);
  return permissions.filter((p) => !basePermissions.includes(p));
}

/**
 * بررسی آیا یک permission جزو Base است
 */
export function isBasePermission(role: string, permission: string): boolean {
  const basePermissions = getBasePermissions(role);
  if (basePermissions.includes("*:*")) return true;
  return basePermissions.includes(permission);
}

/**
 * گروه‌بندی permissions بر اساس entity
 */
export function groupPermissionsByEntity(
  permissions: string[],
): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  permissions.forEach((perm) => {
    if (perm === "*:*") {
      if (!groups["*"]) groups["*"] = [];
      groups["*"].push(perm);
    } else {
      const [entity, action] = perm.split(":");
      if (!groups[entity]) groups[entity] = [];
      groups[entity].push(action);
    }
  });

  return groups;
}

/**
 * شمارش permissions بر اساس entity
 */
export function countPermissionsByEntity(
  permissions: string[],
): Record<string, number> {
  const groups = groupPermissionsByEntity(permissions);
  const counts: Record<string, number> = {};

  Object.entries(groups).forEach(([entity, actions]) => {
    counts[entity] = actions.length;
  });

  return counts;
}
