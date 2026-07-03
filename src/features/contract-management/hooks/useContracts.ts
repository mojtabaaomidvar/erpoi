// src/features/contract-management/hooks/useContracts.ts

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Contract, Client } from '@entities/contract/types';

import { usePermission } from '@shared/authorization/hooks/usePermission';
import { useAuth } from '@features/auth/hooks/useAuth';

import { contractService } from '../services/ContractService';
import { clientService } from '@features/client-management/services/ClientService';
import type { DBContract, DBClient } from '@shared/database/types';

type ContractStatusFilter = 'ALL' | 'ACTIVE' | 'NOT_STARTED' | 'NEEDS_REVIEW' | 'COMPLETED';

const dbContractToContract = (dbContract: DBContract): Contract => ({ ...dbContract } as Contract);
const dbClientToClient = (dbClient: DBClient): Client => ({ ...dbClient } as Client);

export function useContracts() {
  const { can } = usePermission();
  const { user } = useAuth();
  
  // 🔧 FIX: استفاده از department ID (نه نام)
  const userDepartmentId = user?.department || '';

  // 🔐 RBAC: اضافه کردن canRead
  const canRead = can('contract:read');
  const canViewAllContracts = can('contract:view_all');
  const canViewOwnContracts = can('contract:view_own');

  const [contracts, setContractsState] = useState<Contract[]>([]);
  const [clients, setClientsState] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status'>('date');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dbContracts, dbClients] = await Promise.all([
        contractService.getAll(),
        clientService.getAll(),
      ]);
      setContractsState(dbContracts.map(dbContractToContract));
      setClientsState(dbClients.map(dbClientToClient));
    } catch (err: any) {
      console.error('[useContracts] Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const setContracts = useCallback(async (
    action: Contract[] | ((prev: Contract[]) => Contract[])
  ) => {
    try {
      const newContracts = typeof action === 'function' ? action(contracts) : action;
      const currentIds = new Set(contracts.map(c => c.id));
      const newIds = new Set(newContracts.map(c => c.id));

      for (const contract of newContracts.filter(c => !currentIds.has(c.id))) {
        await contractService.create(contract as any);
      }
      for (const contract of contracts.filter(c => !newIds.has(c.id))) {
        try { await contractService.delete(contract.id); } catch (err: any) {
          console.error('[useContracts] Failed to delete contract:', err);
        }
      }
      for (const contract of newContracts.filter(c => {
        const prev = contracts.find(pc => pc.id === c.id);
        return prev && JSON.stringify(prev) !== JSON.stringify(c);
      })) {
        await contractService.update(contract.id, contract as any);
      }
      await loadData();
    } catch (err: any) {
      console.error('[useContracts] Failed to update contracts:', err);
      throw err;
    }
  }, [contracts, loadData]);

  // ═══════════════════════════════════════
  // 🔐 RBAC: فیلتر قراردادها
  // ═══════════════════════════════════════

  const accessibleContracts = useMemo(() => {
    // 🔧 FIX: view_all → همه قراردادها
    if (canViewAllContracts) {
      return contracts;
    }
    
    // 🔧 FIX: view_own یا read → فقط قراردادهای دپارتمان خودش
    if (canViewOwnContracts || canRead) {
      if (!userDepartmentId) {
        console.warn('[useContracts] ⚠️ User has no department, showing no contracts');
        return [];
      }
      
      const filtered = contracts.filter(contract => {
        const client = clients.find(c => c.id === contract.client_id);
        if (!client) return false;
        const clientDepartments = (client as any).departments || [];
        // 🔧 FIX: مقایسه با ID (نه نام)
        return clientDepartments.includes(userDepartmentId);
      });
      
      console.log(`[useContracts] 🏢 User department: ${userDepartmentId}, filtered contracts: ${filtered.length}/${contracts.length}`);
      return filtered;
    }
    
    return [];
  }, [contracts, clients, canViewAllContracts, canViewOwnContracts, canRead, userDepartmentId]);

  const baseContracts = accessibleContracts;

  const filterCounts = useMemo(() => ({
    ALL: accessibleContracts.length,
    ACTIVE: accessibleContracts.filter(c => c.status === 'ACTIVE').length,
    NOT_STARTED: accessibleContracts.filter(c => (c.status as string) === 'NOT_STARTED').length,
    NEEDS_REVIEW: accessibleContracts.filter(c => (c.status as string) === 'NEEDS_REVIEW').length,
    COMPLETED: accessibleContracts.filter(c => c.status === 'COMPLETED').length,
  }), [accessibleContracts]);

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
    currentDepartment: userDepartmentId,
  };
}