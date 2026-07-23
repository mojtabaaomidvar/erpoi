//src/shared/authorization/application/services/PermissionMappingApplicationService.ts

import type { PermissionMapping } from "../../domain/models/PermissionMapping";
import type { IPermissionMappingRepository } from "../../domain/repositories/IPermissionMappingRepository";

export class PermissionMappingApplicationService {
  constructor(private repository: IPermissionMappingRepository) {}

  async getAll(): Promise<PermissionMapping[]> {
    return await this.repository.getAll();
  }

  async getByPermission(permission: string): Promise<PermissionMapping | null> {
    return await this.repository.getByPermission(permission);
  }

  async setMapping(permission: string, allowed: string[], denied: string[] = []): Promise<void> {
    return await this.repository.setMapping(permission, allowed, denied);
  }

  async deleteMapping(permission: string): Promise<void> {
    return await this.repository.deleteMapping(permission);
  }
}