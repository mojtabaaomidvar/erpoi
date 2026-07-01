// src/features/contract-management/hooks/useContracts.ts

import { useState, useMemo, useEffect, useRef } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import { 
  contracts as initialContracts,
  clients as initialClients,
} from '@data/mockData';
import type { Contract, Client } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

import { usePermission } from '@shared/authorization/hooks/usePermission';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDepartmentName } from '@shared/authorization/departments';

type ContractStatusFilter = 'ALL' | 'ACTIVE' | 'NOT_STARTED' | 'NEEDS_REVIEW' | 'COMPLETED';

export function useContracts() {
  const { can, canAny } = usePermission();
  
  const { user } = useAuth();
  const currentDepartment = getDepartmentName(user?.department || 'general');

  const canViewAllContracts = can('contract:view_all');
  const canViewOwnContracts = can('contract:view_own');

  const [contracts, setContracts] = usePersistedState<Contract[]>('ics_contracts', initialContracts);
  const [clients] = usePersistedState<Client[]>('ics_clients', initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContractStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status'>('date');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const prevContractsRef = useRef<Contract[]>(contracts);
  const isFirstRender = useRef(true);

  const accessibleContracts = useMemo(() => {
    if (canViewAllContracts) {
      return contracts;
    }
    if (canViewOwnContracts) {
      // فقط قراردادهایی که مشتری‌شون در دپارتمان کاربر هست
      return contracts.filter(contract => {
        const client = clients.find(c => c.id === contract.client_id);
        if (!client) return false;
        const clientDepartments = (client as any).departments || [];
        return clientDepartments.includes(currentDepartment);
      });
    }
    return [];
  }, [contracts, clients, canViewAllContracts, canViewOwnContracts, currentDepartment]);

  // 🔔 Event publishing + Toast notifications
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