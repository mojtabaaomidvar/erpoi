// src/shared/authorization/hooks/usePermission.ts

import { useCallback, useMemo } from "react";
import { Permission } from "../types";
import { useAuth } from "@features/auth/hooks/useAuth";
import {
  getBasePermissions,
  isBasePermission,
} from "../config/RoleBasePermissions";

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

// 🔧 NEW: استخراج entity از permission
function extractEntity(permission: string): string | null {
  if (permission.includes(":")) {
    return permission.split(":")[0];
  }
  if (permission.includes("_")) {
    return permission.split("_")[0];
  }
  return null;
}

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const isAdmin = role === "admin";

  const basePermissions = useMemo((): string[] => {
    return getBasePermissions(role);
  }, [role]);

  const customPermissions = useMemo((): string[] => {
    return (user as any)?.customPermissions || [];
  }, [user]);

  const allPermissions = useMemo((): string[] => {
    if (isAdmin) return ["*:*"];

    const combined = new Set<string>();
    basePermissions.forEach((p) => combined.add(p));
    customPermissions.forEach((p) => combined.add(p));

    return Array.from(combined);
  }, [basePermissions, customPermissions, isAdmin]);

  // 🔧 NEW: Entity های موجود در permissions
  const accessibleEntities = useMemo((): Set<string> => {
    const entities = new Set<string>();
    allPermissions.forEach((perm: string) => {
      const entity = extractEntity(perm);
      if (entity) entities.add(entity);
    });
    return entities;
  }, [allPermissions]);

  const can = useCallback(
    (permission: Permission | string): boolean => {
      if (isAdmin) return true;

      const perm = permission as string;
      const permVariants = normalizePermission(perm);

      // 🔧 NEW: چک entity-level permissions (مثل contract:read)
      for (const variant of permVariants) {
        // چک مستقیم
        if (allPermissions.includes(variant)) return true;

        // 🔧 NEW: اگر permission به صورت entity:action باشد
        if (variant.includes(":")) {
          const [entity, action] = variant.split(":");

          // 🔧 NEW: چک entity:read, entity:view_all, entity:view_own
          if (["read", "view_all", "view_own", "list"].includes(action)) {
            // اگر کاربر به هر المانی از این entity دسترسی دارد، مجاز است
            if (accessibleEntities.has(entity)) return true;
          }

          // چک wildcard
          if (allPermissions.includes(`${entity}:*`)) return true;
        }

        // چک wildcard کامل
        if (allPermissions.includes("*:*")) return true;

        // چک entity فقط
        if (!variant.includes(":") && !variant.includes("_")) {
          if (allPermissions.some((p) => p.startsWith(`${variant}:`)))
            return true;
          if (allPermissions.some((p) => p.startsWith(`${variant}_`)))
            return true;
        }
      }

      return false;
    },
    [allPermissions, isAdmin, accessibleEntities],
  );

  const canAny = useCallback(
    (permissions: (Permission | string)[]): boolean => {
      return permissions.some((p) => can(p));
    },
    [can],
  );

  const canAll = useCallback(
    (permissions: (Permission | string)[]): boolean => {
      return permissions.every((p) => can(p));
    },
    [can],
  );

  const cannot = useCallback(
    (permission: Permission | string): boolean => {
      return !can(permission);
    },
    [can],
  );

  const canAccessEntity = useCallback(
    (entity: string): boolean => {
      if (isAdmin) return true;
      return accessibleEntities.has(entity);
    },
    [isAdmin, accessibleEntities],
  );

  const isBasePermissionFn = useCallback(
    (permission: string): boolean => {
      return isBasePermission(role, permission);
    },
    [role],
  );

  return {
    role,
    isAdmin,
    can,
    canAny,
    canAll,
    cannot,
    canAccessEntity,
    basePermissions,
    customPermissions,
    allPermissions,
    accessibleEntities,
    isBasePermission: isBasePermissionFn,
  };
}
