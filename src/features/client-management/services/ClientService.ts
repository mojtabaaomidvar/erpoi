// src/features/client-management/services/ClientService.ts

import { getDB } from '@shared/database';
import type { DBClient, DBContactPerson } from '@shared/database/types';
import { eventBus } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

export interface ClientFormData {
  type: 'LEGAL' | 'INDIVIDUAL';
  name_en: string;
  name_fa: string;
  national_id: string;
  email?: string;
  phone?: string;
  category: string;
  logoColor: string;
  abbreviated_name?: string;
  company_type?: string;
  registration_no?: string;
  economic_code?: string;
  address_en: string;
  address_fa: string;
  departments: string[];
  contactPersons?: DBContactPerson[];
}

class ClientService {
  private static instance: ClientService;

  private constructor() {}

  static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService();
    }
    return ClientService.instance;
  }

  // ═══════════════════════════════════════
  // 🔍 Query Methods
  // ═══════════════════════════════════════

  async getAll(): Promise<DBClient[]> {
    const db = await getDB();
    return await db.getAllClients();
  }

  async getById(id: string): Promise<DBClient | null> {
    const db = await getDB();
    return await db.getClient(id);
  }

  async getByDepartment(department: string): Promise<DBClient[]> {
    const clients = await this.getAll();
    return clients.filter(c => c.departments.includes(department));
  }

  async search(query: string): Promise<DBClient[]> {
    const clients = await this.getAll();
    const q = query.toLowerCase();
    return clients.filter(c => 
      c.name_en.toLowerCase().includes(q) ||
      c.name_fa.includes(q) ||
      c.national_id.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }

  // ═══════════════════════════════════════
  // ✏️ Mutation Methods
  // ═══════════════════════════════════════

  async create(formData: ClientFormData): Promise<DBClient> {
    const db = await getDB();

    // Check for duplicates
    const allClients = await db.getAllClients();
    const duplicate = allClients.find(c => 
      c.national_id === formData.national_id ||
      (formData.email && c.email === formData.email)
    );

    if (duplicate) {
      throw new Error(`Client with national ID or email already exists: ${duplicate.name_en}`);
    }

    const newClient = await db.createClient({
      ...formData,
      contacts: formData.contactPersons?.length || 0,
      contracts: 0,
      contactPersons: formData.contactPersons || [],
    });

    // Publish Event
    eventBus.publish({
      type: 'client.created' as any,
      payload: {
        clientId: newClient.id,
        clientName: newClient.name_en,
        clientType: newClient.type,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'client-management',
    });

    showToast('success', 'Client Created', `${newClient.name_en} has been added`);

    return newClient;
  }

  async update(id: string, formData: Partial<ClientFormData>): Promise<DBClient> {
    const db = await getDB();

    const existing = await db.getClient(id);
    if (!existing) {
      throw new Error(`Client ${id} not found`);
    }

    const updated = await db.updateClient(id, {
      ...formData,
      contacts: formData.contactPersons?.length ?? existing.contacts,
    });

    eventBus.publish({
      type: 'client.updated' as any,
      payload: {
        clientId: id,
        clientName: updated.name_en,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'client-management',
    });

    showToast('success', 'Client Updated', `${updated.name_en} has been updated`);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();

    const client = await db.getClient(id);
    if (!client) {
      throw new Error(`Client ${id} not found`);
    }

    // Check if client has contracts
    const contracts = await db.getContractsByClient(id);
    if (contracts.length > 0) {
      throw new Error(`Cannot delete client with ${contracts.length} active contracts`);
    }

    await db.deleteClient(id);

    eventBus.publish({
      type: 'client.deleted' as any,
      payload: {
        clientId: id,
        clientName: client.name_en,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'client-management',
    });

    showToast('success', 'Client Deleted', `${client.name_en} has been removed`);
  }

  // ═══════════════════════════════════════
  // 📊 Stats
  // ═══════════════════════════════════════

  async getStats() {
    const clients = await this.getAll();
    return {
      total: clients.length,
      legal: clients.filter(c => c.type === 'LEGAL').length,
      individual: clients.filter(c => c.type === 'INDIVIDUAL').length,
      byCategory: clients.reduce((acc, client) => {
        acc[client.category] = (acc[client.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ═══════════════════════════════════════
  // 🔄 Bulk Operations
  // ═══════════════════════════════════════

  async resetToDefaults(): Promise<void> {
    const db = await getDB();
    await db.reset();
    showToast('info', 'Data Reset', 'All clients have been reset to defaults');
  }
}

export const clientService = ClientService.getInstance();