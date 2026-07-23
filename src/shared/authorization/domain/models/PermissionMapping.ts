//src/shared/authorization/domain/models/PermissionMapping.ts

export interface PermissionMapping {
  permission: string;
  allowedElements: string[];
  deniedElements: string[];
  updatedAt: string;
}