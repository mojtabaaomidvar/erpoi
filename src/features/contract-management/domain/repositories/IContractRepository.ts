//src/features/contract-management/domain/repositories/IContractRepository.ts

import type { Contract } from "../models/Contract";

export interface IContractRepository {
  getAll(): Promise<Contract[]>;
  getById(id: string): Promise<Contract | null>;
  getByClientId(clientId: string): Promise<Contract[]>;
  create(contract: Partial<Contract>): Promise<Contract>;
  update(id: string, contract: Partial<Contract>): Promise<Contract>;
  delete(id: string): Promise<void>;
}