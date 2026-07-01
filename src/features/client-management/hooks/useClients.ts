// src/features/client-management/hooks/useClients.ts
// 🔐 RBAC + 🏢 Department-aware + 📊 Toast notifications

import { useState, useMemo, useEffect, useRef } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import {
  clients as initialClients,
  contracts as initialContracts,
  contractTariffs as initialContractTariffs,
} from '@data/mockData';
import type { Client, Contract } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

// 🔐 RBAC Imports
import { usePermission } from '@shared/authorization/hooks/usePermission';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getDepartmentName } from '@shared/authorization/departments';

export function useClients() {
  // 🔐 RBAC: گرفتن permission های کاربر
  const { can, canAny } = usePermission();
  
  // 🏢 Department: گرفتن دپارتمان کاربر لاگین شده
  const { user } = useAuth();
  const currentDepartment = getDepartmentName(user?.department || 'general');

  // 🔐 RBAC: محاسبه دسترسی‌ها
  const canViewAllClients = can('client:view_all');
  const canViewOwnClients = can('client:view_own');
  const canViewAllContracts = can('contract:view_all');
  const canViewOwnContracts = can('contract:view_own');

  const [clients, setClients] = usePersistedState<Client[]>('ics_clients', initialClients);
  const [contracts] = usePersistedState<Contract[]>('ics_contracts', initialContracts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'LEGAL' | 'INDIVIDUAL'>('ALL');
  const [contractTab, setContractTab] = useState<'ALL' | 'CONTRACT' | 'WORK_ORDER'>('ALL');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'contracts' | 'value'>('contracts');

  const prevClientsRef = useRef<Client[]>(clients);
  const isFirstRender = useRef(true);

  // 🔐 RBAC: فیلتر مشتری‌ها بر اساس دپارتمان و permission
  const accessibleClients = useMemo(() => {
    if (canViewAllClients) {
      return clients;
    }
    if (canViewOwnClients) {
      return clients.filter(client => {
        const clientDepartments = (client as any).departments || [];
        return clientDepartments.includes(currentDepartment);
      });
    }
    return [];
  }, [clients, canViewAllClients, canViewOwnClients, currentDepartment]);

  // 🔐 RBAC: فیلتر قراردادها بر اساس دپارتمان و permission
  const accessibleContracts = useMemo(() => {
    if (canViewAllContracts) {
      return contracts;
    }
    if (canViewOwnContracts) {
      const accessibleClientIds = accessibleClients.map(c => c.id);
      return contracts.filter(c => accessibleClientIds.includes(c.client_id));
    }
    return [];
  }, [contracts, canViewAllContracts, canViewOwnContracts, accessibleClients]);

  // 🔐 RBAC: فیلتر tariff ها فقط برای قراردادهای قابل دسترسی
  const accessibleContractTariffs = useMemo(() => {
    const accessibleContractIds = accessibleContracts.map(c => c.id);
    return initialContractTariffs.filter(t => 
      t.contract_id && accessibleContractIds.includes(t.contract_id)
    );
  }, [accessibleContracts]);

  // 🔔 Event publishing + Toast notifications
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevClientsRef.current = clients;
      return;
    }

    const prevClients = prevClientsRef.current;

    const newClients = clients.filter(c => !prevClients.find(pc => pc.id === c.id));
    newClients.forEach(client => {
      publishEvent(EVENT_TYPES.CLIENT_CREATED, {
        clientId: client.id,
        clientName: client.name_en,
        clientType: client.type,
        nationalId: client.national_id,
      }, { source: 'client-management' });
      showToast('success', 'Client Created', `${client.name_en} has been added`);
    });

    const deletedClients = prevClients.filter(c => !clients.find(nc => nc.id === c.id));
    deletedClients.forEach(client => {
      publishEvent(EVENT_TYPES.CLIENT_DELETED, {
        clientId: client.id,
        clientName: client.name_en,
      }, { source: 'client-management' });
      showToast('success', 'Client Deleted', `${client.name_en} has been removed`);
    });

    const updatedClients = clients.filter(c => {
      const prev = prevClients.find(pc => pc.id === c.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(c);
    });
    updatedClients.forEach(client => {
      publishEvent(EVENT_TYPES.CLIENT_UPDATED, {
        clientId: client.id,
        clientName: client.name_en,
        clientType: client.type,
      }, { source: 'client-management' });
      showToast('success', 'Client Updated', `${client.name_en} has been updated`);
    });

    prevClientsRef.current = clients;
  }, [clients]);

  useEffect(() => {
    setContractTab('ALL');
  }, [selectedClient]);

  // 🔐 RBAC: clientCounts فقط برای مشتری‌های قابل دسترسی
  const clientCounts = useMemo(() => ({
    total: accessibleClients.length,
    legal: accessibleClients.filter((c) => c.type === 'LEGAL').length,
    individual: accessibleClients.filter((c) => c.type === 'INDIVIDUAL').length,
  }), [accessibleClients]);

  // 🔐 RBAC: filteredClients فقط از مشتری‌های قابل دسترسی
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
    currentDepartment,
  };
}