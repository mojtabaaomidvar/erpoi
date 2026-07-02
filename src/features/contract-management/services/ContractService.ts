// src/features/contract-management/services/ContractService.ts

import { getDB } from '@shared/database';
import type { DBContract, DBTariffLine } from '@shared/database/types';
import { eventBus } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

export interface ContractFormData {
  contract_no: string;
  external_contract_no?: string;
  client_id: string;
  client_name: string;
  contract_title: string;
  start_date: string;
  end_date: string;
  total_value: number;
  invoiced?: number;
  currency: string;
  status: 'ACTIVE' | 'COMPLETED' | 'NOT_STARTED' | 'NEEDS_REVIEW';
  type: 'CONTRACT' | 'WORK_ORDER';
  tariffs: number;
  department: string;
  description?: string;
  contract_count?: number;
  tariffLines?: Omit<DBTariffLine, 'id' | 'createdAt' | 'updatedAt'>[];
  financial_terms?: any;
  service_description?: string;
  source_type?: string;
  source_ref?: string;
  source_file?: string;
  source_letter_date?: string;
  source_letter_image?: string;
  source_email_from?: string;
  source_email_date?: string;
}

class ContractService {
  private static instance: ContractService;

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  // ═══════════════════════════════════════
  // 🔍 Query Methods
  // ═══════════════════════════════════════

  async getAll(): Promise<DBContract[]> {
    const db = await getDB();
    return await db.getAllContracts();
  }

  async getById(id: string): Promise<DBContract | null> {
    const db = await getDB();
    return await db.getContract(id);
  }

  async getByClient(clientId: string): Promise<DBContract[]> {
    const db = await getDB();
    return await db.getContractsByClient(clientId);
  }

  async getByDepartment(department: string): Promise<DBContract[]> {
    const contracts = await this.getAll();
    return contracts.filter(c => c.department === department);
  }

  async getByStatus(status: string): Promise<DBContract[]> {
    const contracts = await this.getAll();
    return contracts.filter(c => c.status === status);
  }

  async search(query: string): Promise<DBContract[]> {
    const contracts = await this.getAll();
    const q = query.toLowerCase();
    return contracts.filter(c => 
      c.contract_no.toLowerCase().includes(q) ||
      c.contract_title.toLowerCase().includes(q) ||
      c.client_name.toLowerCase().includes(q)
    );
  }

  // ═══════════════════════════════════════
  // ✏️ Mutation Methods
  // ═══════════════════════════════════════

  async create(formData: ContractFormData): Promise<DBContract> {
    const db = await getDB();

    // Check for duplicate contract_no
    const allContracts = await db.getAllContracts();
    const duplicate = allContracts.find(c => c.contract_no === formData.contract_no);
    if (duplicate) {
      throw new Error(`Contract with number ${formData.contract_no} already exists`);
    }

    // 🔧 FIX: حذف tariffLines از formData
    const { tariffLines, ...contractData } = formData;

    const newContract = await db.createContract({
      ...contractData,
      invoiced: contractData.invoiced || 0,
    });

    // 🔧 FIX: ساخت tariff lines جداگانه
    if (tariffLines && tariffLines.length > 0) {
      for (const tariff of tariffLines) {
        await db.createTariffLine({
          ...tariff,
          contract_id: newContract.id,
        });
      }
    }

    // Update client contract count
    const client = await db.getClient(formData.client_id);
    if (client) {
      await db.updateClient(formData.client_id, {
        contracts: client.contracts + 1,
      });
    }

    eventBus.publish({
      type: 'contract.created' as any,
      payload: {
        contractId: newContract.id,
        contractNo: newContract.contract_no,
        contractTitle: newContract.contract_title,
        totalValue: newContract.total_value,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'contract-management',
    });

    showToast('success', 'Contract Created', `Contract ${newContract.contract_no} has been created`);

    return newContract;
  }

  async update(id: string, formData: Partial<ContractFormData>): Promise<DBContract> {
    const db = await getDB();

    const existing = await db.getContract(id);
    if (!existing) {
      throw new Error(`Contract ${id} not found`);
    }

    // 🔧 FIX: حذف tariffLines از formData
    const { tariffLines, ...contractData } = formData;

    const updated = await db.updateContract(id, contractData);

    // 🔧 FIX: Update tariff lines اگه وجود داشته باشن
    if (tariffLines && tariffLines.length > 0) {
      // حذف tariff lines قبلی
      const existingTariffs = await db.getTariffLinesByContract(id);
      for (const tariff of existingTariffs) {
        await db.deleteTariffLine(tariff.id);
      }

      // ساخت tariff lines جدید
      for (const tariff of tariffLines) {
        await db.createTariffLine({
          ...tariff,
          contract_id: id,
        });
      }
    }

    eventBus.publish({
      type: 'contract.updated' as any,
      payload: {
        contractId: id,
        contractNo: updated.contract_no,
        contractTitle: updated.contract_title,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'contract-management',
    });

    showToast('success', 'Contract Updated', `Contract ${updated.contract_no} has been updated`);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();

    const contract = await db.getContract(id);
    if (!contract) {
      throw new Error(`Contract ${id} not found`);
    }

    // Delete tariff lines
    const tariffs = await db.getTariffLinesByContract(id);
    for (const tariff of tariffs) {
      await db.deleteTariffLine(tariff.id);
    }

    // Update client contract count
    const client = await db.getClient(contract.client_id);
    if (client) {
      await db.updateClient(contract.client_id, {
        contracts: Math.max(0, client.contracts - 1),
      });
    }

    await db.deleteContract(id);

    eventBus.publish({
      type: 'contract.deleted' as any,
      payload: {
        contractId: id,
        contractNo: contract.contract_no,
      },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'contract-management',
    });

    showToast('success', 'Contract Deleted', `Contract ${contract.contract_no} has been removed`);
  }

  // ═══════════════════════════════════════
  // 💰 Tariff Lines
  // ═══════════════════════════════════════

  async getTariffLines(contractId: string): Promise<DBTariffLine[]> {
    const db = await getDB();
    return await db.getTariffLinesByContract(contractId);
  }

  async updateTariffLine(id: string, data: Partial<DBTariffLine>): Promise<DBTariffLine> {
    const db = await getDB();
    return await db.updateTariffLine(id, data);
  }

  async createTariffLine(data: Omit<DBTariffLine, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBTariffLine> {
    const db = await getDB();
    return await db.createTariffLine(data);
  }

  async deleteTariffLine(id: string): Promise<void> {
    const db = await getDB();
    await db.deleteTariffLine(id);
  }

  // ═══════════════════════════════════════
  // 📊 Stats
  // ═══════════════════════════════════════

  async getStats() {
    const contracts = await this.getAll();
    return {
      total: contracts.length,
      active: contracts.filter(c => c.status === 'ACTIVE').length,
      completed: contracts.filter(c => c.status === 'COMPLETED').length,
      notStarted: contracts.filter(c => c.status === 'NOT_STARTED').length,
      needsReview: contracts.filter(c => c.status === 'NEEDS_REVIEW').length,
      totalValue: contracts.reduce((sum, c) => sum + c.total_value, 0),
      totalInvoiced: contracts.reduce((sum, c) => sum + c.invoiced, 0),
      byType: contracts.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
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
    showToast('info', 'Data Reset', 'All contracts have been reset to defaults');
  }
}

export const contractService = ContractService.getInstance();