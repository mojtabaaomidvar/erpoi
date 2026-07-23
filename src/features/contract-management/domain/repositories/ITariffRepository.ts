//src/features/contract-management/domain/repositories/ITariffRepository.ts

import type { TariffLine } from "../models/TariffLine";

export interface ITariffRepository {
  getAll(): Promise<TariffLine[]>;
  getById(id: string): Promise<TariffLine | null>;
  getByContractId(contractId: string): Promise<TariffLine[]>;
  create(
    tariff: Omit<TariffLine, "id" | "created_at" | "updated_at">,
  ): Promise<TariffLine>;
  update(id: string, tariff: Partial<TariffLine>): Promise<TariffLine>;
  delete(id: string): Promise<void>;
}
