// src/features/audit-log/hooks/useAuditLogs.ts

import { useState, useEffect } from "react";
import { auditLogService } from "../services/AuditLogService";
import type { AuditLogEntry, AuditLogFilter } from "../domain/types";

export function useAuditLogs(filter?: AuditLogFilter) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async (newFilter?: AuditLogFilter) => {
    setLoading(true);
    try {
      const currentFilter = newFilter || filter;
      const data = currentFilter
        ? await auditLogService.getFiltered(currentFilter)
        : await auditLogService.getAll();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const exportLogs = async () => {
    const json = await auditLogService.exportAll();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { logs, isLoading: loading, loadLogs, exportLogs }; // ✅ تغییر loading به isLoading
}
