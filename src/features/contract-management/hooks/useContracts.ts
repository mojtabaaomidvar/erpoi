// src/features/contract-management/hooks/useContracts.ts
// 🔐 RBAC + 🏢 Department-aware + 💾 Database-backed

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Contract, Client } from '@entities/contract/types';

import { usePermission } from '@shared/authorization/hooks/usePermission';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDepartmentName } from '@shared/authorization/departments';

// 💾 Database Services
import { contractService } from '../services/ContractService';
import { clientService } from '@features/client-management/services/ClientService';
import type { DBContract, DBClient } from '@shared/database/types';

type ContractStatusFilter = 'ALL' | 'ACTIVE' | 'NOT_STARTED' | 'NEEDS_REVIEW' | 'COMPLETED';

// 🔧 Helper: تبدیل DBContract به Contract type
const dbContractToContract = (dbContract: DBContract): Contract => {
  return {
    ...dbContract,
  } as Contract;
};

// 🔧 Helper: تبدیل DBClient به Client type
const dbClientToClient = (dbClient: DBClient): Client => {
  return {
    ...dbClient,
  } as Client;
};

export function useContracts() {
  const { can } = usePermission();
  
  const { user } = useAuth();
  const currentDepartment = getDepartmentName(user?.department || 'general');

  const canViewAllContracts = can('contract:view_all');
  const canViewOwnContracts = can('contract:view_own');

  // 💾 State
  const [contracts, setContractsState] = useState<Contract[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🎯 UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status'>('date');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // ═══════════════════════════════════════
  // 💾 Load Data from Database
  // ═══════════════════════════════════════

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load contracts and clients in parallel
      const [dbContracts, dbClients] = await Promise.all([
        contractService.getAll(),
        clientService.getAll(),
      ]);

      // Convert to app types
      const appContracts = dbContracts.map(dbContractToContract);
      const appClients = dbClients.map(dbClientToClient);

      setContractsState(appContracts);
      setClientsState(appClients);
    } catch (err: any) {
      console.error('[useContracts] Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ═══════════════════════════════════════
  // ✏️ Mutation Methods (Wrapper برای Service)
  // ═══════════════════════════════════════

  const setContracts = useCallback(async (
    action: Contract[] | ((prev: Contract[]) => Contract[])
  ) => {
    try {
      // اگه function باشه، apply کن
      const newContracts = typeof action === 'function' 
        ? action(contracts) 
        : action;

      // Detect changes
      const currentIds = new Set(contracts.map(c => c.id));
      const newIds = new Set(newContracts.map(c => c.id));

      // Find new contracts
      const addedContracts = newContracts.filter(c => !currentIds.has(c.id));
      for (const contract of addedContracts) {
        await contractService.create(contract as any);
      }

      // Find deleted contracts
      const deletedContracts = contracts.filter(c => !newIds.has(c.id));
      for (const contract of deletedContracts) {
        try {
          await contractService.delete(contract.id);
        } catch (err: any) {
          console.error('[useContracts] Failed to delete contract:', err);
        }
      }

      // Find updated contracts
      const updatedContracts = newContracts.filter(c => {
        const prev = contracts.find(pc => pc.id === c.id);
        return prev && JSON.stringify(prev) !== JSON.stringify(c);
      });
      for (const contract of updatedContracts) {
        await contractService.update(contract.id, contract as any);
      }

      // Reload data
      await loadData();
    } catch (err: any) {
      console.error('[useContracts] Failed to update contracts:', err);
      throw err;
    }
  }, [contracts, loadData]);

  // ═══════════════════════════════════════
  // 🔐 RBAC: فیلتر قراردادها بر اساس دپارتمان و permission
  // ═══════════════════════════════════════

  const accessibleContracts = useMemo(() => {
    if (canViewAllContracts) {
      return contracts;
    }
    if (canViewOwnContracts) {
      return contracts.filter(contract => {
        const client = clients.find(c => c.id === contract.client_id);
        if (!client) return false;
        const clientDepartments = (client as any).departments || [];
        return clientDepartments.includes(currentDepartment);
      });
    }
    return [];
  }, [contracts, clients, canViewAllContracts, canViewOwnContracts, currentDepartment]);

  const baseContracts = accessibleContracts;

  // 🔐 RBAC: filterCounts فقط برای قراردادهای قابل دسترسی
  const filterCounts = useMemo(() => ({
    ALL: accessibleContracts.length,
    ACTIVE: accessibleContracts.filter(c => c.status === 'ACTIVE').length,
    NOT_STARTED: accessibleContracts.filter(c => (c.status as string) === 'NOT_STARTED').length,
    NEEDS_REVIEW: accessibleContracts.filter(c => (c.status as string) === 'NEEDS_REVIEW').length,
    COMPLETED: accessibleContracts.filter(c => c.status === 'COMPLETED').length,
  }), [accessibleContracts]);

  // 🔐 RBAC: filteredContracts فقط از قراردادهای قابل دسترسی
  const filteredContracts = useMemo(() => {
    let result = accessibleContracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contract => 
        (contract.contract_no && contract.contract_no.toLowerCase().includes(query)) ||
        (contract.contract_title && contract.contract_title.toLowerCase().includes(query)) ||
        (contract.client_name && contract.client_name.toLowerCase().includes(query))
      );
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(c => c.type === typeFilter);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(c => (c.status as string) === statusFilter);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.start_date || 0).getTime() - new Date(a.start_date || 0).getTime();
      }
      if (sortBy === 'value') {
        return (b.total_value || 0) - (a.total_value || 0);
      }
      if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      return 0;
    });

    return result;
  }, [accessibleContracts, searchQuery, typeFilter, statusFilter, sortBy]);

  return {
    contracts: accessibleContracts,
    setContracts,
    clients,
    loading,
    error,
    refresh: loadData,
    searchQuery,
    setSearchQuery,
    selectedContract,
    setSelectedContract,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    isDetailsOpen,
    setIsDetailsOpen,
    baseContracts,
    filterCounts,
    filteredContracts,
    currentDepartment,
  };
}