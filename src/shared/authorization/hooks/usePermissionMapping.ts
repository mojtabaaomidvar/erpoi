// src/shared/authorization/hooks/usePermissionMapping.ts

import { useMemo } from 'react';
import { usePermission } from './usePermission';
import { permissionMappingService } from '../services/PermissionMappingService';
import type { Permission, EntityType } from '../types';
import type { UIElement, UIElementType } from '../types/PermissionMapping';

export function usePermissionMapping() {
  const { can, role } = usePermission();

  // 🎯 گرفتن تمام permission های فعال کاربر
  const activePermissions = useMemo(() => {
    const allPermissions: Permission[] = [];
    const entities: EntityType[] = ['client', 'contract', 'invoice', 'inspection', 'inspector', 'report', 'audit_log', 'setting', 'user', 'notification'];
    const actions = ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'reject', 'assign', 'manage', 'view_all', 'view_own'];
    
    entities.forEach(entity => {
      actions.forEach(action => {
        const permission = `${entity}:${action}` as Permission;
        if (can(permission)) {
          allPermissions.push(permission);
        }
      });
    });
    
    return allPermissions;
  }, [can]);

  // 🎯 محاسبه access profile - 🔧 FIX: حذف Date.now()
  const accessProfile = useMemo(() => {
    const allowedElements = new Set<string>();
    const deniedElements = new Set<string>();

    activePermissions.forEach(permission => {
      const mapping = permissionMappingService.getMapping(permission);
      if (mapping) {
        mapping.allowedElements.forEach(el => allowedElements.add(el));
        mapping.deniedElements?.forEach(el => deniedElements.add(el));
      }
    });

    // Remove denied from allowed
    deniedElements.forEach(el => allowedElements.delete(el));

    // 🔧 FIX: استفاده از ID ثابت به جای Date.now()
    const profileId = activePermissions.sort().join('_') || 'empty';

    return {
      id: `profile_${profileId}`,
      name: 'Dynamic Profile',
      description: `Profile with ${activePermissions.length} permissions`,
      permissions: activePermissions,
      allowedElements: Array.from(allowedElements),
      deniedElements: Array.from(deniedElements),
    };
  }, [activePermissions]);

  // 🎯 چک کردن دسترسی به یه UI Element
  const canAccessElement = useMemo(() => {
    return (elementId: string): boolean => {
      return accessProfile.allowedElements.includes(elementId) &&
             !accessProfile.deniedElements.includes(elementId);
    };
  }, [accessProfile]);

  // 🎯 گرفتن UI Elements مجاز بر اساس entity
  const getAllowedElementsByEntity = useMemo(() => {
    return (entity: EntityType): UIElement[] => {
      const elements = permissionMappingService.getElementsByEntity(entity);
      return elements.filter(el => canAccessElement(el.id));
    };
  }, [canAccessElement]);

  // 🎯 گرفتن UI Elements مجاز بر اساس module
  const getAllowedElementsByModule = useMemo(() => {
    return (module: string): UIElement[] => {
      const elements = permissionMappingService.getElementsByModule(module);
      return elements.filter(el => canAccessElement(el.id));
    };
  }, [canAccessElement]);

  // 🎯 گرفتن UI Elements مجاز بر اساس type
  const getAllowedElementsByType = useMemo(() => {
    return (type: UIElementType): UIElement[] => {
      const elements = permissionMappingService.getElementsByType(type);
      return elements.filter(el => canAccessElement(el.id));
    };
  }, [canAccessElement]);

  return {
    role,
    activePermissions,
    accessProfile,
    canAccessElement,
    getAllowedElementsByEntity,
    getAllowedElementsByModule,
    getAllowedElementsByType,
    registry: permissionMappingService.getRegistry(),
  };
}