// src/shared/authorization/hooks/usePermissionMapping.ts

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

    // 🔧 FIX: اضافه کردن المان‌های Base - چک مستقیم
    basePermissions.forEach((permission: string) => {
      const variants = normalizePermission(permission);

      // چک هر فرمت
      variants.forEach((variant: string) => {
        // اگر permission دقیقاً یک element ID باشد
        if (uiElements.some((el: DBUIElement) => el.id === variant)) {
          allowed.add(variant);
        }

        // اگر permission به صورت entity:action باشد، المان‌های منطبق را پیدا کن
        const parts = variant.includes(":")
          ? variant.split(":")
          : variant.split("_");
        if (parts.length >= 2) {
          const entity = parts[0];
          const action = parts.slice(1).join("_");

          uiElements.forEach((el: DBUIElement) => {
            // چک تطابق entity
            if (el.entity === entity) {
              // چک تطابق action در ID
              if (
                el.id === `${entity}_${action}` ||
                el.id === `${entity}:${action}` ||
                el.id.endsWith(`_${action}`) ||
                el.id.endsWith(`:${action}`)
              ) {
                allowed.add(el.id);
              }
            }
          });
        }
      });
    });

    // اضافه کردن المان‌های Custom از mappings
    customPermissions.forEach((permission: string) => {
      // چک permission اصلی
      const mapping = mappings.get(permission);
      if (mapping) {
        mapping.allowedElements.forEach((el: string) => allowed.add(el));
      }

      // چک فرمت‌های مختلف
      const variants = normalizePermission(permission);
      variants.forEach((v: string) => {
        const m = mappings.get(v);
        if (m) {
          m.allowedElements.forEach((el: string) => allowed.add(el));
        }
      });
    });

    // چک dependencies
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
