// src/features/audit-log/hooks/useAuditLogger.ts
import { subscribeToEvent, EVENT_TYPES } from '@infra/events';
import { useEffect } from 'react';

export function useAuditLogger() {
  useEffect(() => {
    const unsubscribe = subscribeToEvent(EVENT_TYPES.ALL, (event) => {
      // ذخیره در Audit Log
      console.log('📝 Audit:', event.type, event.payload);
    });

    return unsubscribe;
  }, []);
}