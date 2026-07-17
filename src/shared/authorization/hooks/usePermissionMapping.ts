﻿// src/shared/authorization/hooks/usePermissionMapping.ts

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@shared/database/supabase";
import { uiElementRegistry } from "../ui/ui-elements/registry";
import "@shared/authorization/ui/ui-elements";
import type { Permission, EntityType } from "../types";
import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";
import { useAuth } from "@features/auth/hooks/useAuth";
import { checkDependenciesChain } from "../ui/ui-elements/dependencies";
import { getBasePermissions } from "../config/RoleBasePermissions";

// نرمال‌سازی فرمت permission
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
  const isAdmin = role === "admin";

  // 🔧 FIX: Base Permissions
  const basePermissions = useMemo((): string[] => {
    return getBasePermissions(role);
  }, [role]);

  // ترکیب Base + Custom
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

  useEffect(() => {
    const loadFromDB = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("permission_mappings")
          .select("*");

        if (error) {
          console.error("[usePermissionMapping] Failed to load:", error);
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

  const uiElements = useMemo((): DBUIElement[] => {
    return uiElementRegistry.getAllElements().map((el) => ({
      ...el,
      module: el.module || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBUIElement[];
  }, []);

  // ═══════════════════════════════════════
  // 🔐 ENTITY-LEVEL ACCESS
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

  // ═══════════════════════════════════════
  // 🔐 ELEMENT-LEVEL ACCESS
  // ═══════════════════════════════════════

  // 🔧 FIX: منطق ساده‌تر و درست‌تر
  const allowedElements = useMemo((): Set<string> => {
    if (isAdmin) {
      return new Set(uiElements.map((el) => el.id));
    }

    const allowed = new Set<string>();

    // 🔧 تعریف متغیر allRegisteredIds برای جستجوی سریع (O(1))
    const allRegisteredIds = new Set(uiElements.map((el) => el.id));

    // ۱. پردازش دسترسی‌های پایه (Base)
    basePermissions.forEach((permission: string) => {
      const variants = normalizePermission(permission);
      variants.forEach((variant: string) => {
        if (allRegisteredIds.has(variant)) {
          allowed.add(variant);
        }
      });
    });

    // ۲. پردازش دسترسی‌های دستی و بچ (Custom)
    customPermissions.forEach((permission: string) => {
      const variants = normalizePermission(permission);

      variants.forEach((variant: string) => {
        // 🔧 لاگ دیباگ برای ردیابی عدم تطابق حروف بزرگ/کوچک
        const isRegistered = allRegisteredIds.has(variant);
        if (!isRegistered) {
          console.warn(
            `⚠️ [Mismatch] Custom perm "${variant}" NOT FOUND in registry!`,
          );
          console.log(
            "Registry sample (first 5):",
            Array.from(allRegisteredIds).slice(0, 5),
          );
        }

        // الف) بررسی دسترسی دستی (Manual)
        if (isRegistered) {
          allowed.add(variant);
        }

        // ب) بررسی دسترسی بچ (Batch)
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

    // ۳. بررسی وابستگی‌ها (Dependencies) - فیلتر نهایی
    const allowedArray = Array.from(allowed);
    const filtered = allowedArray.filter((elementId: string) => {
      const { satisfied } = checkDependenciesChain(elementId, allowedArray);
      return satisfied;
    });

    return new Set(filtered);
  }, [isAdmin, basePermissions, customPermissions, mappings, uiElements]);

  const canAccessElement = useCallback(
    (elementId: string): boolean => {
      if (isAdmin) return true;

      // چک مستقیم
      if (allowedElements.has(elementId)) return true;

      // چک فرمت‌های مختلف
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

  // ═══════════════════════════════════════
  // 🔧 HELPER FUNCTIONS
  // ═══════════════════════════════════════

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

  useEffect(() => {
    console.group(
      `🔐 [Permission Debug] User: ${user?.username || "Guest"} (${user?.role})`,
    );
    console.log("Base Permissions:", basePermissions);
    console.log("Custom Permissions (from DB):", customPermissions);
    console.log("Total Allowed Elements Count:", allowedElements.size);

    // تست یک المان خاص (مثلاً دکمه افزودن قرارداد)
    const testElement = "contract_btn_add";
    console.log(
      `Can access "${testElement}"? :`,
      canAccessElement(testElement),
    );

    // اگر false است، ببینیم چرا
    if (!canAccessElement(testElement)) {
      console.warn(`⚠️ "${testElement}" is NOT in allowedElements Set.`);
      console.log(
        "First 20 allowed elements:",
        Array.from(allowedElements).slice(0, 20),
      );
    }
    console.groupEnd();
  }, [
    user,
    allowedElements,
    canAccessElement,
    basePermissions,
    customPermissions,
  ]);

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
