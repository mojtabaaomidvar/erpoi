//src/features/contract-management/application/services/ContractApplicationService.ts

import type { Contract, IContractRepository } from "../../domain";

export class ContractApplicationService {
  constructor(private contractRepository: IContractRepository) {}

  async getAll(): Promise<Contract[]> {
    return await this.contractRepository.getAll();
  }

  async getById(id: string): Promise<Contract | null> {
    return await this.contractRepository.getById(id);
  }

  async getByClientId(clientId: string): Promise<Contract[]> {
    return await this.contractRepository.getByClientId(clientId);
  }

  async create(contract: Partial<Contract>): Promise<Contract> {
    return await this.contractRepository.create(contract);
  }

  async update(id: string, contract: Partial<Contract>): Promise<Contract> {
    return await this.contractRepository.update(id, contract);
  }

  async delete(id: string): Promise<void> {
    return await this.contractRepository.delete(id);
  }

  // منطق Sync (مشابه Client)
  async syncContracts(currentContracts: Contract[], newContracts: Contract[]): Promise<void> {
    const currentIds = new Set(currentContracts.map((c) => c.id));
    const newIds = new Set(newContracts.map((c) => c.id));

    for (const contract of newContracts.filter((c) => !currentIds.has(c.id))) {
      await this.create(contract);
    }
    for (const contract of currentContracts.filter((c) => !newIds.has(c.id))) {
      try { await this.delete(contract.id); } catch (err) { console.error("Delete failed:", err); }
    }
    for (const contract of newContracts.filter((c) => {
      const prev = currentContracts.find((pc) => pc.id === c.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(c);
    })) {
      await this.update(contract.id, contract);
    }
  }
}