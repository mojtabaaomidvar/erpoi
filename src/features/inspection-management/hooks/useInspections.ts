// src/features/inspection-management/hooks/useInspections.ts
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import { inspections as initialInspections } from '@data/mockData';
import type { Inspection } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

export function useInspections() {
  const [inspections, setInspections] = usePersistedState<Inspection[]>('ics_inspections', initialInspections);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');

  const prevInspectionsRef = useRef<Inspection[]>(inspections);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInspectionsRef.current = inspections;
      return;
    }

    const prevInspections = prevInspectionsRef.current;

    const newInspections = inspections.filter(i => !prevInspections.find(pi => pi.id === i.id));
    newInspections.forEach(inspection => {
      publishEvent(EVENT_TYPES.INSPECTION_CREATED, {
        inspectionId: inspection.id,
        inspectionNo: inspection.inspection_no,
      }, { source: 'inspection-management' });
      showToast('success', 'Inspection Created', `Inspection ${inspection.inspection_no || inspection.id} created`);
    });

    const deletedInspections = prevInspections.filter(i => !inspections.find(ni => ni.id === i.id));
    deletedInspections.forEach(inspection => {
      publishEvent(EVENT_TYPES.INSPECTION_DELETED, {
        inspectionId: inspection.id,
        inspectionNo: inspection.inspection_no,
      }, { source: 'inspection-management' });
      showToast('success', 'Inspection Deleted', `Inspection ${inspection.inspection_no || inspection.id} removed`);
    });

    const updatedInspections = inspections.filter(i => {
      const prev = prevInspections.find(pi => pi.id === i.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(i);
    });
    updatedInspections.forEach(inspection => {
      publishEvent(EVENT_TYPES.INSPECTION_UPDATED, {
        inspectionId: inspection.id,
        inspectionNo: inspection.inspection_no,
      }, { source: 'inspection-management' });
      showToast('success', 'Inspection Updated', `Inspection ${inspection.inspection_no || inspection.id} updated`);
    });

    prevInspectionsRef.current = inspections;
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    return inspections.filter((inspection) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        (inspection.inspection_no && inspection.inspection_no.toLowerCase().includes(query)) || 
        (inspection.inspector_name && inspection.inspector_name.toLowerCase().includes(query));
      const matchesFilter = filter === 'ALL' || inspection.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter, inspections]);

  return {
    inspections,
    setInspections,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    filteredInspections,
  };
}