//src/shared/application/MasterDataApplicationService.ts

import { masterDataRepository } from "../repositories/MasterDataRepository";
import type { SystemListItem } from "../repositories/MasterDataRepository";

export class MasterDataApplicationService {
  async getTPIDisciplines(): Promise<SystemListItem[]> {
    return await masterDataRepository.getSystemListByCategory("TPI_DISCIPLINE");
  }

  async getTPIInspectionStages(): Promise<SystemListItem[]> {
    return await masterDataRepository.getSystemListByCategory(
      "TPI_INSPECTION_STAGE",
    );
  }

  async getTPIInspectionMethods(): Promise<SystemListItem[]> {
    return await masterDataRepository.getSystemListByCategory(
      "TPI_INSPECTION_METHOD",
    );
  }
}

export const masterDataAppService = new MasterDataApplicationService();
