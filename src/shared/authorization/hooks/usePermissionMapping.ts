﻿// src/shared/authorization/hooks/usePermissionMapping.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@shared/database/supabase";
import { uiElementRegistry } from "../ui/ui-elements/registry";
import "@shared/authorization/ui/ui-elements"; // برای اجرای side-effect ثبت المان‌ها
import type { EntityType } from "../types";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { useAuth } from "@features/auth/hooks/useAuth";
import { checkDependenciesChain } from "../ui/ui-elements/dependencies";
import { getBasePermissions } from "../config/RoleBasePermissions";

// نرمال‌سازی فرمت permission برای پشتیبانی همزمان از formatهای "entity:action" و "entity_action"
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

    // فقط یک بار در شروع کار لود می‌شود (مگر اینکه نیاز به Real-time داشته باشید)
    loadFromDB();
  }, []);

  // ۴. دریافت لیست تمام المان‌های ثبت‌شده در سیستم
  const uiElements = useMemo((): DBUIElement[] => {
    return uiElementRegistry.getAllElements().map((el) => ({
      ...el,
      module: el.module || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBUIElement[];
  }, []);

  // ═══════════════════════════════════════
  // 🔐 CORE LOGIC: محاسبه نهایی المان‌های مجاز
  // ═══════════════════════════════════════
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
    // 🔧 FIX: حالا روی allPermissions چک می‌شود، نه فقط customPermissions
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
    // اگر المانی مجاز باشد اما پیش‌نیازش مجاز نباشد، حذف می‌شود
    const allowedArray = Array.from(allowed);
    const finalAllowed = allowedArray.filter((elementId: string) => {
      const { satisfied } = checkDependenciesChain(elementId, allowedArray);
      return satisfied;
    });

    return new Set(finalAllowed);
  }, [isAdmin, allPermissions, mappings, uiElements]);

  // ═══════════════════════════════════════
  // 🔐 HELPER FUNCTIONS
  // ═══════════════════════════════════════

  const canAccess = useCallback(
    (entity: string): boolean => {
      if (isAdmin) return true;
      return allPermissions.some((perm: string) => {
        const variants = normalizePermission(perm);
        return variants.some((v: string) => {
          const permEntity = v.includes(":")
            ? v.split(":")[0]
            : v.split("_")[0];
          return permEntity === entity;
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
      if (allowedElements.has(elementId)) return true;

      // چک کردن فرمت‌های مختلف (مثلاً اگر با : پاس داده شد ولی در registry با _ ثبت شده)
      const variants = normalizePermission(elementId);
      return variants.some((v: string) => allowedElements.has(v));
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
        (el) => el.entity === entity && canAccessElement(el.id),
      );
    },
    [uiElements, canAccessElement],
  );

  const getAllowedElementsByModule = useCallback(
    (module: string): DBUIElement[] => {
      return uiElements.filter(
        (el) => el.module === module && canAccessElement(el.id),
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
