// src/shared/authorization/hooks/usePermissionMapping.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getDB } from '@shared/database';
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

  // 🔧 Load mappings از دیتابیس
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
  // 🔐 ENTITY-LEVEL ACCESS (برای Sidebar و صفحات)
  // ═══════════════════════════════════════

  /**
   * چک کردن دسترسی به یک entity
   * مثال: canAccess('client') → true اگر کاربر هر دسترسی client:* داشته باشه
   */
  const canAccess = useCallback((entity: string): boolean => {
    if (isAdmin) return true;
    return customPermissions.some((perm: string) => {
      const permEntity = perm.split(':')[0];
      return permEntity === entity;
    });
  }, [isAdmin, customPermissions]);

  /**
   * چک کردن دسترسی به چند entity (حداقل یکی true باشه)
   */
  const canAccessAny = useCallback((entities: string[]): boolean => {
    return entities.some(entity => canAccess(entity));
  }, [canAccess]);

  // ═══════════════════════════════════════
  // 🔐 ELEMENT-LEVEL ACCESS (برای دکمه‌ها و المان‌های خاص)
  // ═══════════════════════════════════════

  /**
   * محاسبه لیست element های مجاز بر اساس permission های کاربر
   */
  const allowedElements = useMemo((): Set<string> => {
    if (isAdmin) {
      // Admin همه element ها رو داره
      return new Set(uiElements.map(el => el.id));
    }

    const allowed = new Set<string>();
    
    customPermissions.forEach((permission: string) => {
      const mapping = mappings.get(permission);
      if (mapping) {
        mapping.allowedElements.forEach(el => allowed.add(el));
      }
    });

    // 🔧 فیلتر dependencies
    const allowedArray = Array.from(allowed);
    const filtered = allowedArray.filter(elementId => {
      const { satisfied } = checkDependenciesChain(elementId, allowedArray);
      return satisfied;
    });

    return new Set(filtered);
  }, [isAdmin, customPermissions, mappings, uiElements]);

  /**
   * چک کردن دسترسی به یک element خاص
   * مثال: canAccessElement('client_btn_edit') → true اگر کاربر این element رو داشته باشه
   */
  const canAccessElement = useCallback((elementId: string): boolean => {
    if (isAdmin) return true;
    return allowedElements.has(elementId);
  }, [isAdmin, allowedElements]);

  /**
   * چک کردن دسترسی به چند element (حداقل یکی true باشه)
   */
  const canAccessAnyElement = useCallback((elementIds: string[]): boolean => {
    return elementIds.some(id => canAccessElement(id));
  }, [canAccessElement]);

  /**
   * چک کردن دسترسی به چند element (همه true باشن)
   */
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

  // ═══════════════════════════════════════
  // 📤 EXPORT
  // ═══════════════════════════════════════

  return {
    // Entity-level
    canAccess,
    canAccessAny,
    
    // Element-level
    canAccessElement,
    canAccessAnyElement,
    canAccessAllElements,
    allowedElements,
    
    // Helper functions
    getAllowedElementsByEntity,
    getAllowedElementsByModule,
    getAllowedElementsByType,
    
    // State
    isAdmin,
    loading,
    customPermissions,
    mappings,
    uiElements,
  };
}