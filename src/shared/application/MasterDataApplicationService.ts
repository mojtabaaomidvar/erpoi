//src/shared/application/MasterDataApplicationService.ts

import { masterDataRepository } from "../repositories/MasterDataRepository";
import type { SystemListItem } from "../repositories/MasterDataRepository";

export class MasterDataApplicationService {
  async getSystemList(category: string): Promise<SystemListItem[]> {
    return await masterDataRepository.getSystemListByCategory(category);
  }

  async getTPIDisciplines(): Promise<SystemListItem[]> {
    return await this.getSystemList("TPI_DISCIPLINE");
  }

  async getTPIInspectionStages(): Promise<SystemListItem[]> {
    return await this.getSystemList("TPI_INSPECTION_STAGE");
  }

  async getTPIInspectionMethods(): Promise<SystemListItem[]> {
    return await this.getSystemList("TPI_INSPECTION_METHOD");
  }
}

export const masterDataAppService = new MasterDataApplicationService();
