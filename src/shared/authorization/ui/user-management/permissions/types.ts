// src/shared/authorization/ui/permission-manager/types.ts

import type { DBPermissionMapping, DBUIElement } from "@shared/database/types";

export interface SavePreviewItem {
  permission: string;
  oldAllowed: string[];
  newAllowed: string[];
  added: string[];
  removed: string[];
  isNew: boolean;
}

export interface DeleteErrorInfo {
  permission: string;
  assignedToUsers: string[];
}

export interface PendingElementToggle {
  elementId: string;
  missingDeps: string[];
}

export interface CategoryInfo {
  icon: string;
  label: string;
  children: string[];
}

export interface PermissionData {
  permission: string;
  mapping: DBPermissionMapping;
  isPending: boolean;
  isSaved: boolean;
}

export interface PermissionManagerState {
  uiElements: DBUIElement[];
  mappings: Map<string, DBPermissionMapping>;
  pendingChanges: Map<string, DBPermissionMapping>;
  selectedPermission: string;
  filterEntity: string;
  searchQuery: string;
  filterModule: string;
  filterType: string;
}