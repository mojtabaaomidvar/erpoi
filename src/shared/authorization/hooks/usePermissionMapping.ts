﻿// src/shared/authorization/hooks/usePermissionMapping.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@shared/database/supabase";
import type { EntityType } from "../domain/models";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { useAuth } from "@features/auth/hooks/useAuth";
import { getBasePermissions } from "../config/RoleBasePermissions";

import {
  checkDependenciesChain,
  getAllElements,
} from "@shared/authorization/ui";

// نرمال‌سازی فرمت permission برای پشتیبانی همزمان از فرمت‌های "entity:action" و "entity_action"
function normalizePermission(permission: string): string[] {
  const variants = new Set<string>();
  variants.add(permission);

  if (permission.includes(":")) {
    variants.add(permission.replace(":", "_"));
  }

  if (permission.includes("_") && !permission.includes(":")) {
    const parts = permission.split("_");
    if (parts.length >= 2) {
      const entity = parts[0];
      const action = parts.slice(1).join("_");
      variants.add(`${entity}:${action}`);
    }
  }

  return Array.from(variants);
}

export function usePermissionMapping() {
  const { user } = useAuth();
  const role = (user as any)?.role || "viewer";
  const customPermissions: string[] = (user as any)?.customPermissions || [];
  const isAdmin = role === "admin" || role === "super_admin";

  // ۱. دریافت دسترسی‌های پایه بر اساس نقش سراسری
  const basePermissions = useMemo((): string[] => {
    return getBasePermissions(role);
  }, [role]);

  // ۲. ترکیب دسترسی‌های پایه و سفارشی (جلوگیری از تکرار با Set)
  const allPermissions = useMemo((): string[] => {
    if (isAdmin) return ["*:*"];

    const combined = new Set<string>();
    basePermissions.forEach((p: string) => combined.add(p));
    customPermissions.forEach((p: string) => combined.add(p));
    return Array.from(combined);
  }, [basePermissions, customPermissions, isAdmin]);

  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  // ۳. بارگذاری تنظیمات دقیق (Granular) از دیتابیس
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .schema("core")
          .from("permission_mappings")
          .select("permission, allowed_elements, denied_elements, updated_at");

        if (error) {
          console.error(
            "[usePermissionMapping] Failed to load mappings:",
            error,
          );
          return;
        }

        const map = new Map<string, DBPermissionMapping>(
          (data || []).map((m: any) => [
            m.permission,
            {
              permission: m.permission,
              allowedElements: m.allowed_elements || [],
              deniedElements: m.denied_elements || [],
              updatedAt: m.updated_at,
            },
          ]),
        );
        setMappings(map);
      } catch (error) {
        console.error("[usePermissionMapping] Failed to load:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFromDB();
  }, []);

  // ۴. دریافت لیست تمام المان‌های ثبت‌شده در سیستم از رجیستری جدید
  const uiElements = useMemo((): DBUIElement[] => {
    return getAllElements().map((el: any) => ({
      ...el,
      // حفظ سازگاری با تایپ DBUIElement برای فیلدهایی که در تایپ جدید UIElement ممکن است صریح نباشند
      module: (el as any).module || "unknown",
      entity: (el as any).entity || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBUIElement[];
  }, []);

  // ═══════════════════════════════════════
  // 🔐 CORE LOGIC: محاسبه نهایی المان‌های مجاز
  // ═══════════════════════════════════════
  function normalizeElementId(id: string): string[] {
    const variants = new Set<string>();
    const lowerId = id.toLowerCase();
    variants.add(lowerId);

    // تبدیل فرمت "Component.key" به "entity_key"
    if (lowerId.includes(".")) {
      const [component, key] = lowerId.split(".");
      const entity = component.replace(
        /(list|details|form|editmodal|modal|createmodal)$/i,
        "",
      );
      variants.add(`${entity}_${key}`);
    }

    // تبدیل فرمت "entity:key" به "entity_key"
    if (lowerId.includes(":")) {
      variants.add(lowerId.replace(":", "_"));
    }

    return Array.from(variants);
  }

  const allowedElements = useMemo((): Set<string> => {
    if (isAdmin) {
      return new Set(uiElements.map((el) => el.id));
    }

    const allowed = new Set<string>();
    const allRegisteredIds = new Set(uiElements.map((el) => el.id));

    // مرحله الف: اضافه کردن دسترسی‌های مستقیم (Base + Custom)
    allPermissions.forEach((permission: string) => {
      const variants = normalizePermission(permission);
      variants.forEach((variant: string) => {
        if (allRegisteredIds.has(variant)) {
          allowed.add(variant);
        }
      });
    });

    // مرحله ب: اعمال تنظیمات دیتابیس (DB Mappings)
    allPermissions.forEach((permission: string) => {
      const variants = normalizePermission(permission);
      variants.forEach((variant: string) => {
        const mapping = mappings.get(variant);
        if (mapping) {
          mapping.allowedElements.forEach((el: string) => {
            if (allRegisteredIds.has(el)) {
              allowed.add(el);
            }
          });
        }
      });
    });

    // مرحله ج: فیلتر نهایی بر اساس زنجیره وابستگی‌ها (Dependencies)
    const allowedArray = Array.from(allowed);
    const finalAllowed = allowedArray.filter((elementId: string) => {
      const { satisfied, missing } = checkDependenciesChain(
        elementId,
        allowedArray,
      );

      // 🔍 دیباگ: اگر المان پروژه رد شد، دلیلش را چاپ کن
      if (!satisfied && elementId.startsWith("project_")) {
        console.warn(
          `❌ [Permission] Project element REJECTED: ${elementId} | Missing dependencies:`,
          missing,
        );
      }

      return satisfied;
    });

    return new Set(finalAllowed);
  }, [isAdmin, allPermissions, mappings, uiElements]);

  // ═══════════════════════════════════════
  // 🔐 HELPER FUNCTIONS
  // ═══════════════════════════════════════

  const canAccess = useCallback(
    (entityOrAction: string): boolean => {
      if (isAdmin) return true;

      // حذف 's' انتهای کلمات برای سازگاری (مثلاً "projects" -> "project")
      const requested = entityOrAction.toLowerCase().replace(/s$/, "");

      return allPermissions.some((perm: string) => {
        const variants = normalizePermission(perm);
        return variants.some((v: string) => {
          const permEntity = v.includes(":")
            ? v.split(":")[0]
            : v.split("_")[0];

          if (requested.includes(":") || requested.includes("_")) {
            // درخواست یک اکشن خاص است (مثلاً "client:create")
            // بررسی می‌کنیم آیا این اکشن دقیقاً وجود دارد یا خیر
            return (
              v === requested ||
              v === requested.replace(":", "_") ||
              v === "*:*"
            );
          } else {
            // درخواست یک ماژول کلی است (مثلاً "project")
            // بررسی می‌کنیم آیا کاربر هیچ دسترسی‌ای به این ماژول دارد یا خیر
            return permEntity === requested;
          }
        });
      });
    },
    [isAdmin, allPermissions],
  );

  const canAccessAny = useCallback(
    (entities: string[]): boolean => {
      return entities.some((entity) => canAccess(entity));
    },
    [canAccess],
  );

  const canAccessElement = useCallback(
    (elementId: string): boolean => {
      if (isAdmin) return true;

      const variants = normalizeElementId(elementId);
      const hasAccess = variants.some((v) => allowedElements.has(v));

      // لاگ دقیق برای عیب‌یابی نهایی
      if (!hasAccess) {
        console.warn(
          `⚠️ [canAccessElement] DENIED: UI requested "${elementId}"`,
        );
        console.warn(`   Checked variants:`, variants);
        console.warn(
          `   Tip: Make sure you are using the exact ID from ProjectElements.ts (e.g., "project_list_item_view")`,
        );
      }

      return hasAccess;
    },
    [isAdmin, allowedElements],
  );

  const canAccessAnyElement = useCallback(
    (elementIds: string[]): boolean => {
      return elementIds.some((id) => canAccessElement(id));
    },
    [canAccessElement],
  );

  const canAccessAllElements = useCallback(
    (elementIds: string[]): boolean => {
      return elementIds.every((id) => canAccessElement(id));
    },
    [canAccessElement],
  );

  const getAllowedElementsByEntity = useCallback(
    (entity: EntityType): DBUIElement[] => {
      return uiElements.filter(
        (el) => (el as any).entity === entity && canAccessElement(el.id),
      );
    },
    [uiElements, canAccessElement],
  );

  const getAllowedElementsByModule = useCallback(
    (module: string): DBUIElement[] => {
      return uiElements.filter(
        (el) => (el as any).module === module && canAccessElement(el.id),
      );
    },
    [uiElements, canAccessElement],
  );

  const getAllowedElementsByType = useCallback(
    (type: string): DBUIElement[] => {
      return uiElements.filter(
        (el) => el.type === type && canAccessElement(el.id),
      );
    },
    [uiElements, canAccessElement],
  );

  return {
    canAccess,
    canAccessAny,
    canAccessElement,
    canAccessAnyElement,
    canAccessAllElements,
    allowedElements,
    getAllowedElementsByEntity,
    getAllowedElementsByModule,
    getAllowedElementsByType,
    isAdmin,
    loading,
    basePermissions,
    customPermissions,
    allPermissions,
    mappings,
    uiElements,
  };
}
