// src/features/client-management/hooks/useClients.ts

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Client, Contract } from '@entities/contract/types';
import { contractTariffs as initialContractTariffs } from '@data/mockData';

import { usePermission } from '@shared/authorization/hooks/usePermission';
import { useAuth } from '@features/auth/hooks/useAuth';
import { clientService } from '../services/ClientService';
import { contractService } from '@features/contract-management/services/ContractService';
import type { DBClient, DBContract } from '@shared/database/types';

const dbClientToClient = (dbClient: DBClient): Client => ({ ...dbClient } as Client);
const dbContractToContract = (dbContract: DBContract): Contract => ({ ...dbContract } as Contract);

export function useClients() {
  const { can } = usePermission();
  const { user } = useAuth();
  
  // 🔧 FIX: گرفتن department ID (نه نام)
  const userDepartmentId = user?.department || '';

  // 🔐 RBAC
  const canViewAllClients = can('client:view_all');
  const canViewOwnClients = can('client:view_own');
  const canRead = can('client:read');
  const canViewAllContracts = can('contract:view_all');
  const canViewOwnContracts = can('contract:view_own');

  const [clients, setClientsState] = useState<Client[]>([]);
  const [contracts, setContractsState] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'LEGAL' | 'INDIVIDUAL'>('ALL');
  const [contractTab, setContractTab] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'contracts' | 'value'>('contracts');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dbClients, dbContracts] = await Promise.all([
        clientService.getAll(),
        contractService.getAll(),
      ]);
      setClientsState(dbClients.map(dbClientToClient));
      setContractsState(dbContracts.map(dbContractToContract));
    } catch (err: any) {
      console.error('[useClients] Failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const setClients = useCallback(async (
    action: Client[] | ((prev: Client[]) => Client[])
  ) => {
    try {
      const newClients = typeof action === 'function' ? action(clients) : action;
      const currentIds = new Set(clients.map(c => c.id));
      const newIds = new Set(newClients.map(c => c.id));

      for (const client of newClients.filter(c => !currentIds.has(c.id))) {
        await clientService.create(client as any);
      }
      for (const client of clients.filter(c => !newIds.has(c.id))) {
        try { await clientService.delete(client.id); } catch (err: any) {
          console.error('[useClients] Failed to delete client:', err);
        }
      }
      for (const client of newClients.filter(c => {
        const prev = clients.find(pc => pc.id === c.id);
        return prev && JSON.stringify(prev) !== JSON.stringify(c);
      })) {
        await clientService.update(client.id, client as any);
      }
      await loadData();
    } catch (err: any) {
      console.error('[useClients] Failed to update clients:', err);
      throw err;
    }
  }, [clients, loadData]);

  // ═══════════════════════════════════════
  // 🔐 RBAC: فیلتر مشتری‌ها بر اساس دپارتمان
  // ═══════════════════════════════════════

  const accessibleClients = useMemo(() => {
    // 🔧 FIX: view_all → همه مشتری‌ها
    if (canViewAllClients) {
      return clients;
    }
    
    // 🔧 FIX: view_own یا read → فقط مشتری‌های دپارتمان خودش
    if (canViewOwnClients || canRead) {
      if (!userDepartmentId) {
        console.warn('[useClients] ⚠️ User has no department, showing no clients');
        return [];
      }
      
      const filtered = clients.filter(client => {
        const clientDepartments = (client as any).departments || [];
        // 🔧 FIX: چک کردن department ID
        return clientDepartments.includes(userDepartmentId);
      });
      
      console.log(`[useClients] 🏢 User department: ${userDepartmentId}, filtered clients: ${filtered.length}/${clients.length}`);
      return filtered;
    }
    
    return [];
  }, [clients, canViewAllClients, canViewOwnClients, canRead, userDepartmentId]);

  // ═══════════════════════════════════════
  // 🔐 RBAC: فیلتر قراردادها
  // ═══════════════════════════════════════

  const accessibleContracts = useMemo(() => {
    if (canViewAllContracts) {
      return contracts;
    }
    if (canViewOwnContracts || canRead) {
      const accessibleClientIds = accessibleClients.map(c => c.id);
      return contracts.filter(c => accessibleClientIds.includes(c.client_id));
    }
    return [];
  }, [contracts, canViewAllContracts, canViewOwnContracts, canRead, accessibleClients]);

  const accessibleContractTariffs = useMemo(() => {
    const accessibleContractIds = accessibleContracts.map(c => c.id);
    return initialContractTariffs.filter(t => 
      t.contract_id && accessibleContractIds.includes(t.contract_id)
    );
  }, [accessibleContracts]);

  useEffect(() => { setContractTab('ALL'); }, [selectedClient]);

  const clientCounts = useMemo(() => ({
    total: accessibleClients.length,
    legal: accessibleClients.filter((c) => c.type === 'LEGAL').length,
    individual: accessibleClients.filter((c) => c.type === 'INDIVIDUAL').length,
  }), [accessibleClients]);

  const filteredClients = useMemo(() => {
    let result = accessibleClients.filter((client) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        client.name_en.toLowerCase().includes(query) ||
        client.name_fa.includes(query) ||
        (client.national_id && client.national_id.includes(query));
      const matchesFilter = filter === 'ALL' || client.type === filter;
      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sortBy === 'contracts') {
        const countA = accessibleContracts.filter(c => c.client_id === a.id).length;
        const countB = accessibleContracts.filter(c => c.client_id === b.id).length;
        if (countB !== countA) return countB - countA;
        return a.name_en.localeCompare(b.name_en);
      }
      if (sortBy === 'name') return a.name_en.localeCompare(b.name_en);
      if (sortBy === 'value') {
        const valA = accessibleContracts.filter((c) => c.client_id === a.id).reduce((sum, c) => sum + c.total_value, 0);
        const valB = accessibleContracts.filter((c) => c.client_id === b.id).reduce((sum, c) => sum + c.total_value, 0);
        if (valB !== valA) return valB - valA;
        return a.name_en.localeCompare(b.name_en);
      }
      return 0;
    });
  }, [searchQuery, filter, accessibleClients, sortBy, accessibleContracts]);

  useEffect(() => {
    if (selectedClient && !filteredClients.find((c) => c.id === selectedClient.id)) {
      setSelectedClient(filteredClients[0] || null);
    }
  }, [filter, filteredClients, selectedClient]);

  const clientContracts = selectedClient
    ? accessibleContracts.filter((c) => c.client_id === selectedClient.id)
    : [];

  const filteredContracts = contractTab === 'ALL'
    ? clientContracts
    : clientContracts.filter((c) => c.type === contractTab);

  return {
    clients: accessibleClients,
    setClients,
    contracts: accessibleContracts,
    loading,
    error,
    refresh: loadData,
    searchQuery,
    setSearchQuery,
    selectedClient,
    setSelectedClient,
    filter,
    setFilter,
    contractTab,
    setContractTab,
    selectedContract,
    setSelectedContract,
    sortBy,
    setSortBy,
    clientCounts,
    filteredClients,
    clientContracts,
    filteredContracts,
    contractTariffs: accessibleContractTariffs,
    currentDepartment: userDepartmentId,
  };
}