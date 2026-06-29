// src/features/audit-log/hooks/useAuditLogger.ts
import { useEffect } from'react';
import { eventBus } from'@infra/events';
import { auditLogService } from'../services/AuditLogService';

/**
 * Hook برای گوش دادن به تمام رویدادها و ثبت در Audit Log
 */
export function useAuditLogger(): void {
  useEffect(() => {
    console.log('🎧 [AuditLogger] Starting to listen to all events...');
    
    // گوش دادن به همه رویدادها با wildcard
    const unsubscribe = eventBus.subscribe('*', (event) => {
      console.log('📝 [AuditLogger] Logging event:', event.type, event.payload);
      auditLogService.log(event);
    });

    return () => {
      console.log('🔇 [AuditLogger] Stopped listening');
      unsubscribe();
    };
  }, []);
}