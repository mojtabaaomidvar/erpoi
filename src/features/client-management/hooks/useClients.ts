// src/views/clients/hooks/useClients.ts
import { useState, useMemo, useEffect } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import {
  clients as initialClients,
  contracts as initialContracts,
  contractTariffs,
} from '@data/mockData';
import type { Client, Contract } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';

export function useClients() {
  const [clients, setClients] = usePersistedState<Client[]>('ics_clients', initialClients);
  const [contracts] = usePersistedState<Contract[]>('ics_contracts', initialContracts);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'LEGAL' | 'INDIVIDUAL'>('ALL');
  const [contractTab, setContractTab] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'contracts' | 'value'>('contracts');

  const createClient = (client: Client) => {
    // ... ذخیره در storage
    
    // انتشار رویداد
    publishEvent(EVENT_TYPES.CLIENT_CREATED, {
      clientId: client.id,
      clientName: client.name_en,
    }, { source: 'client-management' });
  };
  
  // Reset contract tab when client changes
  useEffect(() => {
    setContractTab('ALL');
  }, [selectedClient]);

  // Client counts
  const clientCounts = useMemo(() => ({
    total: clients.length,
    legal: clients.filter((c) => c.type === 'LEGAL').length,
    individual: clients.filter((c) => c.type === 'INDIVIDUAL').length,
  }), [clients]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    let result = clients.filter((client) => {
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
        const countA = contracts.filter(c => c.client_id === a.id).length;
        const countB = contracts.filter(c => c.client_id === b.id).length;
        if (countB !== countA) return countB - countA;
        return a.name_en.localeCompare(b.name_en);
      }
      if (sortBy === 'name') return a.name_en.localeCompare(b.name_en);
      if (sortBy === 'value') {
        const valA = contracts.filter((c) => c.client_id === a.id).reduce((sum, c) => sum + c.total_value, 0);
        const valB = contracts.filter((c) => c.client_id === b.id).reduce((sum, c) => sum + c.total_value, 0);
        if (valB !== valA) return valB - valA;
        return a.name_en.localeCompare(b.name_en);
      }
      return 0;
    });
  }, [searchQuery, filter, clients, sortBy, contracts]);

  // Reset selected client if filtered out
  useEffect(() => {
    if (selectedClient && !filteredClients.find((c) => c.id === selectedClient.id)) {
      setSelectedClient(filteredClients[0] || null);
    }
  }, [filter, filteredClients, selectedClient]);

  // Client contracts
  const clientContracts = selectedClient 
    ? contracts.filter((c) => c.client_id === selectedClient.id) 
    : [];
  
  const filteredContracts = contractTab === 'ALL' 
    ? clientContracts 
    : clientContracts.filter((c) => c.type === contractTab);

  return {
    clients,
    setClients,
    contracts,
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
    contractTariffs,
  };
}




