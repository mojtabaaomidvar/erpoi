// src/features/invoice-managment/hooks/useInvoices.ts
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePersistedState } from "@shared/hooks/usePersistedState";
import { invoices as initialInvoices } from '@data/mockData';
import type { Invoice } from '@entities/contract/types';
import { publishEvent, EVENT_TYPES } from '@infra/events';
import { showToast } from '@shared/ui/ToastContainer';

export function useInvoices() {
  const [invoices, setInvoices] = usePersistedState<Invoice[]>('ics_invoices', initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'>('ALL');

  const prevInvoicesRef = useRef<Invoice[]>(invoices);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevInvoicesRef.current = invoices;
      return;
    }

    const prevInvoices = prevInvoicesRef.current;

    const newInvoices = invoices.filter(i => !prevInvoices.find(pi => pi.id === i.id));
    newInvoices.forEach(invoice => {
      publishEvent(EVENT_TYPES.INVOICE_CREATED, {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoice_no,
        amount: invoice.total_amount,
        status: invoice.status,
      }, { source: 'invoice-management' });
      showToast('success', 'Invoice Created', `Invoice ${invoice.invoice_no || invoice.id} created`);
    });

    const deletedInvoices = prevInvoices.filter(i => !invoices.find(ni => ni.id === i.id));
    deletedInvoices.forEach(invoice => {
      publishEvent(EVENT_TYPES.INVOICE_DELETED, {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoice_no,
      }, { source: 'invoice-management' });
      showToast('success', 'Invoice Deleted', `Invoice ${invoice.invoice_no || invoice.id} removed`);
    });

    const updatedInvoices = invoices.filter(i => {
      const prev = prevInvoices.find(pi => pi.id === i.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(i);
    });
    updatedInvoices.forEach(invoice => {
      publishEvent(EVENT_TYPES.INVOICE_UPDATED, {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoice_no,
      }, { source: 'invoice-management' });
      showToast('success', 'Invoice Updated', `Invoice ${invoice.invoice_no || invoice.id} updated`);
    });

    prevInvoicesRef.current = invoices;
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || 
        (invoice.invoice_no && invoice.invoice_no.toLowerCase().includes(query)) || 
        (invoice.client_name && invoice.client_name.toLowerCase().includes(query));
      const matchesFilter = filter === 'ALL' || invoice.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter, invoices]);

  return {
    invoices,
    setInvoices,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    filteredInvoices,
  };
}