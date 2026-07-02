// src/shared/authorization/hooks/usePermissionMapping.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getDB } from '@shared/database';
import { uiElementRegistry } from '../uiElements/registry';
import '@shared/authorization/uiElements';
import type { Permission, EntityType, Role } from '../types';
import type { DBPermissionMapping, DBUIElement } from '@shared/database/types';

import { ROLES, hasPermission } from '../roles';
import { useAuth } from '@features/auth/hooks/useAuth';

export function usePermissionMapping() {
  const { user } = useAuth();
  const role = (user?.role || 'viewer') as Role;
  
  // 🔧 FIX: customPermissions رو مستقیم از user object بگیر
  const customPermissions = (user as any)?.customPermissions || [];

  const can = useCallback((permission: Permission): boolean => {
    if (customPermissions.includes(permission)) return true;
    return hasPermission(role, permission);
  }, [role, customPermissions]);

  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFromDB = async () => {
      try {
        setLoading(true);
        const db = await getDB();

        const allMappings = await db.getAllPermissionMappings();
        const map = new Map<string, DBPermissionMapping>(
          allMappings.map((m: DBPermissionMapping) => [m.permission, m])
        );
        setMappings(map);
      } catch (error) {
        console.error('[usePermissionMapping] Failed to load:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFromDB();
  }, []);

  const uiElements = useMemo((): DBUIElement[] => {
    return uiElementRegistry.getAllElements().map(el => ({
      ...el,
      module: el.module || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBUIElement[];
  }, []);

  const activePermissions = useMemo((): Permission[] => {
    const permissions = new Set<string>();

    // 1. از mappings واقعی (که کاربر ساخته)
    mappings.forEach((_, permission) => {
      permissions.add(permission);
    });

    // 2. 🔧 FIX: از custom permissions کاربر با type annotation
    customPermissions.forEach((p: string) => permissions.add(p));

    return Array.from(permissions).sort() as Permission[];
  }, [mappings, customPermissions]);

  const accessProfile = useMemo(() => {
    const allowedElements = new Set<string>();
    const deniedElements = new Set<string>();

    activePermissions.forEach((permission: Permission) => {
      const mapping = mappings.get(permission);
      if (mapping) {
        mapping.allowedElements.forEach(el => allowedElements.add(el));
        mapping.deniedElements?.forEach(el => deniedElements.add(el));
      }
    });

    deniedElements.forEach(el => allowedElements.delete(el));

    const profileId = activePermissions.sort().join('_') || 'empty';

    return {
      id: `profile_${profileId}`,
      name: 'Dynamic Profile',
      description: `Profile with ${activePermissions.length} permissions`,
      permissions: activePermissions,
      allowedElements: Array.from(allowedElements),
      deniedElements: Array.from(deniedElements),
    };
  }, [activePermissions, mappings]);

  const canAccessElement = useCallback((elementId: string): boolean => {
    return accessProfile.allowedElements.includes(elementId) &&
           !accessProfile.deniedElements.includes(elementId);
  }, [accessProfile]);

  const getAllowedElementsByEntity = useCallback((entity: EntityType): DBUIElement[] => {
    return uiElements.filter(el => el.entity === entity && canAccessElement(el.id));
  }, [uiElements, canAccessElement]);

  const getAllowedElementsByModule = useCallback((module: string): DBUIElement[] => {
    return uiElements.filter(el => el.module === module && canAccessElement(el.id));
  }, [uiElements, canAccessElement]);

  const getAllowedElementsByType = useCallback((type: string): DBUIElement[] => {
    return uiElements.filter(el => el.type === type && canAccessElement(el.id));
  }, [uiElements, canAccessElement]);

  const registry = useMemo(() => {
    const elements: Record<string, DBUIElement> = {};
    const byEntity: Record<string, string[]> = {};
    const byModule: Record<string, string[]> = {};
    const byType: Record<string, string[]> = {};

    uiElements.forEach(el => {
      elements[el.id] = el;

      if (!byEntity[el.entity]) byEntity[el.entity] = [];
      byEntity[el.entity].push(el.id);

      if (!byModule[el.module]) byModule[el.module] = [];
      byModule[el.module].push(el.id);

      if (!byType[el.type]) byType[el.type] = [];
      byType[el.type].push(el.id);
    });

    return { elements, byEntity, byModule, byType };
  }, [uiElements]);

  return {
    role,
    loading,
    activePermissions,
    accessProfile,
    canAccessElement,
    getAllowedElementsByEntity,
    getAllowedElementsByModule,
    getAllowedElementsByType,
    registry,
    mappings,
    uiElements,
  };
}