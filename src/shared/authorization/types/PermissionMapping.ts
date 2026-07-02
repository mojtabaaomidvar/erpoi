// src/shared/authorization/types/PermissionMapping.ts

import type { Permission, EntityType } from '../types';

// 🎯 نوع UI Element
export type UIElementType =
  | 'card'
  | 'progress_bar'
  | 'button'
  | 'modal'
  | 'table_column'
  | 'form_field'
  | 'section'
  | 'badge'
  | 'stat'
  | 'chart'
  | 'list_item';

// 🎯 تعریف یه UI Element
export interface UIElement {
  id: string;
  name: string;
  type: UIElementType;
  entity: EntityType;
  module: string;
  description?: string;
  component?: string;
  priority?: number;
}

// 🎯 Mapping بین Permission و UI Elements
export interface PermissionMapping {
  permission: Permission;
  allowedElements: string[];
  deniedElements?: string[];
}

// 🎯 Registry برای تمام UI Elements
export interface UIElementRegistry {
  elements: Record<string, UIElement>;
  byEntity: Record<string, string[]>;
  byModule: Record<string, string[]>;
  byType: Record<string, string[]>;
}