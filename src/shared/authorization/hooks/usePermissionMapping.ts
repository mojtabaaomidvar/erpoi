// src/shared/authorization/hooks/usePermissionMapping.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@shared/database/supabase';
import { uiElementRegistry } from '../uiElements/registry';
import '@shared/authorization/uiElements';
import type { Permission, EntityType } from '../types';
import type { DBPermissionMapping, DBUIElement } from '@shared/database/types';
import { useAuth } from '@features/auth/hooks/useAuth';
import { checkDependenciesChain } from '../uiElements/dependencies';

export function usePermissionMapping() {
  const { user } = useAuth();
  const customPermissions = (user as any)?.customPermissions || [];
  const isAdmin = (user as any)?.role === 'admin';

  const [mappings, setMappings] = useState<Map<string, DBPermissionMapping>>(new Map());
  const [loading, setLoading] = useState(true);

  // 🔧 Load mappings از Supabase
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('permission_mappings')
          .select('*');

        if (error) {
          console.error('[usePermissionMapping] Failed to load:', error);
          return;
        }

        const map = new Map<string, DBPermissionMapping>(
          (data || []).map((m: any) => [m.permission, {
            permission: m.permission,
            allowedElements: m.allowed_elements || [],
            deniedElements: m.denied_elements || [],
            updatedAt: m.updated_at,
          }])
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

  // 🔧 UI Elements Registry
  const uiElements = useMemo((): DBUIElement[] => {
    return uiElementRegistry.getAllElements().map(el => ({
      ...el,
      module: el.module || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as DBUIElement[];
  }, []);

  // ═══════════════════════════════════════
  // 🔐 ENTITY-LEVEL ACCESS
  // ═══════════════════════════════════════

  const canAccess = useCallback((entity: string): boolean => {
    if (isAdmin) return true;
    return customPermissions.some((perm: string) => {
      const permEntity = perm.split(':')[0];
      return permEntity === entity;
    });
  }, [isAdmin, customPermissions]);

  const canAccessAny = useCallback((entities: string[]): boolean => {
    return entities.some(entity => canAccess(entity));
  }, [canAccess]);

  // ═══════════════════════════════════════
  // 🔐 ELEMENT-LEVEL ACCESS
  // ═══════════════════════════════════════

  const allowedElements = useMemo((): Set<string> => {
    if (isAdmin) {
      return new Set(uiElements.map(el => el.id));
    }

    const allowed = new Set<string>();
    
    customPermissions.forEach((permission: string) => {
      const mapping = mappings.get(permission);
      if (mapping) {
        mapping.allowedElements.forEach(el => allowed.add(el));
      }
    });

    const allowedArray = Array.from(allowed);
    const filtered = allowedArray.filter(elementId => {
      const { satisfied } = checkDependenciesChain(elementId, allowedArray);
      return satisfied;
    });

    return new Set(filtered);
  }, [isAdmin, customPermissions, mappings, uiElements]);

  const canAccessElement = useCallback((elementId: string): boolean => {
    if (isAdmin) return true;
    return allowedElements.has(elementId);
  }, [isAdmin, allowedElements]);

  const canAccessAnyElement = useCallback((elementIds: string[]): boolean => {
    return elementIds.some(id => canAccessElement(id));
  }, [canAccessElement]);

  const canAccessAllElements = useCallback((elementIds: string[]): boolean => {
    return elementIds.every(id => canAccessElement(id));
  }, [canAccessElement]);

  // ═══════════════════════════════════════
  // 🔧 HELPER FUNCTIONS
  // ═══════════════════════════════════════

  const getAllowedElementsByEntity = useCallback((entity: EntityType): DBUIElement[] => {
    return uiElements.filter(el => el.entity === entity && canAccessElement(el.id));
  }, [uiElements, canAccessElement]);

  const getAllowedElementsByModule = useCallback((module: string): DBUIElement[] => {
    return uiElements.filter(el => el.module === module && canAccessElement(el.id));
  }, [uiElements, canAccessElement]);

  const getAllowedElementsByType = useCallback((type: string): DBUIElement[] => {
    return uiElements.filter(el => el.type === type && canAccessElement(el.id));
  }, [uiElements, canAccessElement]);

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
    customPermissions,
    mappings,
    uiElements,
  };
}