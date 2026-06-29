// src/features/audit-log/hooks/useAuditLogs.ts
import { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry, AuditLogFilter } from '../types';
import { auditLogService } from '../services/AuditLogService';
import { eventBus } from '@infra/events';

export function useAuditLogs(filter?: AuditLogFilter) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(true);
    try {
      const filteredLogs = filter
        ? auditLogService.getFiltered(filter)
        : auditLogService.getAll();
      setLogs(filteredLogs);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const exportLogs = useCallback(() => {
    const json = auditLogService.exportAll(); // ✅ Export all including archived
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-all-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    refresh();

    const unsubscribe = eventBus.subscribe('*', () => {
      refresh();
    });

    return unsubscribe;
  }, [refresh]);

  return {
    logs,
    isLoading,
    refresh,
    exportLogs,
  };
}