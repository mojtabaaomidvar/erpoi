//src/shared/authorization/domain/repositories/IPermissionMappingRepository.ts

import type { PermissionMapping } from "../models/PermissionMapping";

export interface IPermissionMappingRepository {
  getAll(): Promise<PermissionMapping[]>;
  getByPermission(permission: string): Promise<PermissionMapping | null>;
  setMapping(permission: string, allowed: string[], denied: string[]): Promise<void>;
  deleteMapping(permission: string): Promise<void>;
}