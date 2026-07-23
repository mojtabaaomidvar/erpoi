// src/features/client-management/domain/repositories/IClientRepository.ts

import type { Client } from "../models/Client";

export interface IClientRepository {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(client: Partial<Client>): Promise<Client>;
  update(id: string, client: Partial<Client>): Promise<Client>;
  delete(id: string): Promise<void>;
  checkDuplicate(nationalId: string, excludeId?: string): Promise<any | null>;
}
