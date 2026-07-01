// src/features/inspector-managment/hooks/useInspectors.ts
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import { inspectors as initialInspectors } from '@data/mockData';
import type { Inspector } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

export function useInspectors() {
  const [inspectors, setInspectors] = usePersistedState<Inspector[]>('ics_inspectors', initialInspectors);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'BUSY' | 'ON_LEAVE'>('ALL');

  const prevInspectorsRef = useRef<Inspector[]>(inspectors);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInspectorsRef.current = inspectors;
      return;
    }

    const prevInspectors = prevInspectorsRef.current;

    const newInspectors = inspectors.filter(i => !prevInspectors.find(pi => pi.id === i.id));
    newInspectors.forEach(inspector => {
      publishEvent(EVENT_TYPES.INSPECTOR_CREATED, {
        inspectorId: inspector.id,
        inspectorName: inspector.name_en,
      }, { source: 'inspector-management' });
      showToast('success', 'Inspector Added', `${inspector.name_en || inspector.id} has been added`);
    });

    const deletedInspectors = prevInspectors.filter(i => !inspectors.find(ni => ni.id === i.id));
    deletedInspectors.forEach(inspector => {
      publishEvent(EVENT_TYPES.INSPECTOR_DELETED, {
        inspectorId: inspector.id,
        inspectorName: inspector.name_en,
      }, { source: 'inspector-management' });
      showToast('success', 'Inspector Deleted', `${inspector.name_en || inspector.id} has been removed`);
    });

    const updatedInspectors = inspectors.filter(i => {
      const prev = prevInspectors.find(pi => pi.id === i.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(i);
    });
    updatedInspectors.forEach(inspector => {
      publishEvent(EVENT_TYPES.INSPECTOR_UPDATED, {
        inspectorId: inspector.id,
        inspectorName: inspector.name_en,
      }, { source: 'inspector-management' });
      showToast('success', 'Inspector Updated', `${inspector.name_en || inspector.id} has been updated`);
    });

    prevInspectorsRef.current = inspectors;
  }, [inspectors]);

  const filteredInspectors = useMemo(() => {
    return inspectors.filter((inspector) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        (inspector.name_en && inspector.name_en.toLowerCase().includes(query)) || 
        (inspector.name_fa && inspector.name_fa.includes(query));
      const matchesFilter = filter === 'ALL' || inspector.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter, inspectors]);

  return {
    inspectors,
    setInspectors,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    filteredInspectors,
  };
}