// src/shared/authorization/hooks/usePermission.ts

import { useCallback, useMemo, useState, useEffect } from "react";
import { Permission } from "../types";
import { useAuth } from "@features/auth/hooks/useAuth";
import { supabase } from "@shared/database/supabase";

export function usePermission() {
  const { user } = useAuth();
  const role = user?.role || "viewer";
  const isAdmin = role === "admin";

  // 🔐 customPermissions کاربر (از session)
  const customPermissions = useMemo((): string[] => {
    return (user as any)?.customPermissions || [];
  }, [user]);

  // 🔧 FIX: rolePermissions از Supabase
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  useEffect(() => {
    const loadRolePermissions = async () => {
      if (isAdmin) {
        setRolePermissions(["*:*"]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("roles")
          .select("permissions")
          .eq("name", role)
          .single();

        if (error) {
          console.warn("[usePermission] Role not found:", role);
          setRolePermissions([]);
          return;
        }

        setRolePermissions(data?.permissions || []);
      } catch (error) {
        console.error(
          "[usePermission] Failed to load role permissions:",
          error,
        );
        setRolePermissions([]);
      }
    };

    loadRolePermissions();
  }, [role, isAdmin]);

  // 🔐 ترکیب همه permission ها
  const allPermissions = useMemo((): string[] => {
    if (isAdmin) return ["*:*"];
    return [...new Set([...customPermissions, ...rolePermissions])];
  }, [customPermissions, rolePermissions, isAdmin]);

  // 🔐 تابع چک کردن permission
  const can = useCallback(
    (permission: Permission | string): boolean => {
      if (isAdmin) return true;

      const perm = permission as string;

      if (allPermissions.includes(perm)) return true;

      const entity = perm.split(":")[0];
      if (allPermissions.includes(`${entity}:*`)) return true;
      if (allPermissions.includes("*:*")) return true;

      if (!perm.includes(":")) {
        return allPermissions.some((p) => p.startsWith(`${perm}:`));
      }

      return false;
    },
    [allPermissions, isAdmin],
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

  // 🔐 تابع چک کردن دسترسی به entity
  const canAccessEntity = useCallback(
    (entity: string): boolean => {
      if (isAdmin) return true;

      return allPermissions.some((perm: string) => {
        const permEntity = perm.split(":")[0];
        return permEntity === entity;
      });
    },
    [isAdmin, allPermissions],
  );

  return {
    role,
    isAdmin,
    can,
    canAny,
    canAll,
    cannot,
    canAccessEntity,
    customPermissions,
    rolePermissions,
    allPermissions,
  };
}
