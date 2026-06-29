// src/views/contracts/hooks/useContracts.ts

import { subscribeToEvent, EVENT_TYPES } from'@infra/events';
import { useState, useMemo, useEffect } from'react';
import { usePersistedState } from'@shared/hooks/usePersistedState';
import {
  contracts as initialContracts,
  clients as initialClients,
  contractTariffs,
} from'@data/mockData';
import type { Contract, Client } from'@entities/contract/types';
import {
  calculateProgressFromTariffs,
  calculateDaysProgress,
  calculateDaysLeft,
  getDaysUntilStart,
  getContractFinancialStatus,
  isExpiringSoon,
} from'@entities/contract/services/contractCalculations';

export function useContracts() {
  const [contracts, setContracts] = usePersistedState<Contract[]>('ics_contracts', initialContracts);
  const [clients, setClients] = usePersistedState<Client[]>('ics_clients', initialClients);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL'|'CONTRACT'|'WORK_ORDER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL'|'ACTIVE'|'NOT_STARTED'|'NEEDS_REVIEW'|'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'date'|'value'|'status'>('date');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    setStatusFilter('ALL');
  }, [typeFilter]);

  useEffect(() => {
    const unsubscribe = subscribeToEvent<{ contractId: string; daysLeft: number }>(
      EVENT_TYPES.CONTRACT_EXPIRING,
      (event) => {
        console.log(`قرارداد ${event.payload.contractId} تا ${event.payload.daysLeft} روز دیگر منقضی می‌شود`);
        // نمایش نوتیفیکیشن
      }
    );

    return unsubscribe; // Cleanup هنگام unmount
  }, []);
  
  // Base filtered contracts
  const baseContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const query = searchQuery.toLowerCase();
      return (
        !query ||
        contract.contract_no.toLowerCase().includes(query) ||
        (contract.external_contract_no && contract.external_contract_no.toLowerCase().includes(query)) ||
        contract.client_name.toLowerCase().includes(query) ||
        contract.contract_title.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, contracts]);

  // Cross-filtered counts
  const filterCounts = useMemo(() => {
    return {
      type: {
        ALL: baseContracts.filter(c => statusFilter ==='ALL'|| c.status === statusFilter).length,
        CONTRACT: baseContracts.filter(c => c.type ==='CONTRACT'&& (statusFilter ==='ALL'|| c.status === statusFilter)).length,
        WORK_ORDER: baseContracts.filter(c => c.type ==='WORK_ORDER'&& (statusFilter ==='ALL'|| c.status === statusFilter)).length,
      },
      status: {
        ALL: baseContracts.filter(c => typeFilter ==='ALL'|| c.type === typeFilter).length,
        ACTIVE: baseContracts.filter(c => c.status ==='ACTIVE'&& (typeFilter ==='ALL'|| c.type === typeFilter)).length,
        COMPLETED: baseContracts.filter(c => c.status ==='COMPLETED'&& (typeFilter ==='ALL'|| c.type === typeFilter)).length,
      },
      total: baseContracts.length,
      totalValue: baseContracts.reduce((sum, c) => sum + c.total_value, 0),
      totalInvoiced: baseContracts.reduce((sum, c) => sum + c.invoiced, 0),
    };
  }, [baseContracts, typeFilter, statusFilter]);

  // Final filtered contracts
  const filteredContracts = useMemo(() => {
    let result = baseContracts.filter((contract) => {
      const matchesType = typeFilter ==='ALL'|| contract.type === typeFilter;
      const financialStatus = getContractFinancialStatus(contract);
      let matchesStatus = true;
      
      if (statusFilter ==='ACTIVE') matchesStatus = financialStatus ==='active';
      else if (statusFilter ==='NOT_STARTED') matchesStatus = financialStatus ==='not_started';
      else if (statusFilter ==='NEEDS_REVIEW') matchesStatus = financialStatus ==='needs_review';
      else if (statusFilter ==='COMPLETED') matchesStatus = financialStatus ==='completed';

      return matchesType && matchesStatus;
    });

    return result.sort((a, b) => {
      const aExpiring = isExpiringSoon(a);
      const bExpiring = isExpiringSoon(b);
      
      if (aExpiring.expiring && !bExpiring.expiring) return -1;
      if (!aExpiring.expiring && bExpiring.expiring) return 1;
      if (aExpiring.expiring && bExpiring.expiring) {
        return aExpiring.daysLeft - bExpiring.daysLeft;
      }

      if (sortBy ==='date') return b.start_date.localeCompare(a.start_date);
      if (sortBy ==='value') return b.total_value - a.total_value;
      if (sortBy ==='status') {
        const order: Record<string, number> = { ACTIVE: 1, COMPLETED: 2 };
        return (order[a.status] || 99) - (order[b.status] || 99);
      }
      return 0;
    });
  }, [baseContracts, typeFilter, statusFilter, sortBy]);

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




