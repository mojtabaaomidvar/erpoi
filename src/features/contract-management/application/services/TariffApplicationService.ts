//src/features/contract-management/application/services/TariffApplicationService.ts

import type { TariffLine, ITariffRepository } from "../../domain";

export class TariffApplicationService {
  constructor(private tariffRepository: ITariffRepository) {}

  async getAll(): Promise<TariffLine[]> {
    return await this.tariffRepository.getAll();
  }

  async getByContractId(contractId: string): Promise<TariffLine[]> {
    return await this.tariffRepository.getByContractId(contractId);
  }

  async create(tariff: Omit<TariffLine, "id" | "created_at" | "updated_at">): Promise<TariffLine> {
    return await this.tariffRepository.create(tariff);
  }

  async update(id: string, tariff: Partial<TariffLine>): Promise<TariffLine> {
    return await this.tariffRepository.update(id, tariff);
  }

  async delete(id: string): Promise<void> {
    return await this.tariffRepository.delete(id);
  }
}