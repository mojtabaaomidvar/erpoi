// src/features/contract-management/hooks/useContracts.ts
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import { useClients } from '@features/client-management/hooks/useClients';
import { contracts as initialContracts } from '@data/mockData';
import type { Contract } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

type ContractStatusFilter = 'ALL' | 'ACTIVE' | 'NOT_STARTED' | 'NEEDS_REVIEW' | 'COMPLETED';

export function useContracts() {
  const { clients, setClients } = useClients();
  
  const [contracts, setContracts] = usePersistedState<Contract[]>('ics_contracts', initialContracts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status'>('date');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const prevContractsRef = useRef<Contract[]>(contracts);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevContractsRef.current = contracts;
      return;
    }

    const prevContracts = prevContractsRef.current;

    const newContracts = contracts.filter(c => !prevContracts.find(pc => pc.id === c.id));
    newContracts.forEach(contract => {
      publishEvent(EVENT_TYPES.CONTRACT_CREATED, {
        contractId: contract.id,
        contractNo: contract.contract_no,
        contractTitle: contract.contract_title,
        totalValue: contract.total_value,
      }, { source: 'contract-management' });
      showToast('success', 'Contract Created', `Contract ${contract.contract_no || contract.id} has been added`);
    });

    const deletedContracts = prevContracts.filter(c => !contracts.find(nc => nc.id === c.id));
    deletedContracts.forEach(contract => {
      publishEvent(EVENT_TYPES.CONTRACT_DELETED, {
        contractId: contract.id,
        contractNo: contract.contract_no,
      }, { source: 'contract-management' });
      showToast('success', 'Contract Deleted', `Contract ${contract.contract_no || contract.id} has been removed`);
    });

    const updatedContracts = contracts.filter(c => {
      const prev = prevContracts.find(pc => pc.id === c.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(c);
    });
    updatedContracts.forEach(contract => {
      publishEvent(EVENT_TYPES.CONTRACT_UPDATED, {
        contractId: contract.id,
        contractNo: contract.contract_no,
        contractTitle: contract.contract_title,
      }, { source: 'contract-management' });
      showToast('success', 'Contract Updated', `Contract ${contract.contract_no || contract.id} has been updated`);
    });

    prevContractsRef.current = contracts;
  }, [contracts]);

  const baseContracts = contracts;

  // ✅ استفاده از type assertion برای جلوگیری از خطای type
  const filterCounts = useMemo(() => ({
    ALL: contracts.length,
    ACTIVE: contracts.filter(c => c.status === 'ACTIVE').length,
    NOT_STARTED: contracts.filter(c => (c.status as string) === 'NOT_STARTED').length,
    NEEDS_REVIEW: contracts.filter(c => (c.status as string) === 'NEEDS_REVIEW').length,
    COMPLETED: contracts.filter(c => c.status === 'COMPLETED').length,
  }), [contracts]);

  const filteredContracts = useMemo(() => {
    let result = contracts;

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
  }, [contracts, searchQuery, typeFilter, statusFilter, sortBy]);

  return {
    contracts,
    setContracts,
    clients,
    setClients,
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
  };
}