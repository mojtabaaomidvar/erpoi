//src/features/client-management/application/services/ClientApplicationService.ts

import type { Client, IClientRepository } from "../../domain";

export class ClientApplicationService {
  constructor(private clientRepository: IClientRepository) {}

  async getAll(): Promise<Client[]> {
    return await this.clientRepository.getAll();
  }

  async getById(id: string): Promise<Client | null> {
    return await this.clientRepository.getById(id);
  }

  async create(client: Partial<Client>): Promise<Client> {
    return await this.clientRepository.create(client);
  }

  async update(id: string, client: Partial<Client>): Promise<Client> {
    return await this.clientRepository.update(id, client);
  }

  async delete(id: string): Promise<void> {
    return await this.clientRepository.delete(id);
  }

  async syncClients(
    currentClients: Client[],
    newClients: Client[],
  ): Promise<void> {
    const currentIds = new Set(currentClients.map((c) => c.id));
    const newIds = new Set(newClients.map((c) => c.id));

    for (const client of newClients.filter((c) => !currentIds.has(c.id))) {
      await this.create(client);
    }

    for (const client of currentClients.filter((c) => !newIds.has(c.id))) {
      try {
        await this.delete(client.id);
      } catch (err) {
        console.error("Delete failed during sync:", err);
      }
    }

    for (const client of newClients.filter((c) => {
      const prev = currentClients.find((pc) => pc.id === c.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(c);
    })) {
      await this.update(client.id, client);
    }
  }

  async checkDuplicate(
    nationalId: string,
    excludeId?: string,
  ): Promise<any | null> {
    return await this.clientRepository.checkDuplicate(nationalId, excludeId);
  }
}
