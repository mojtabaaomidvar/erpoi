// src/features/audit-log/hooks/useAuditLogger.ts

import { useEffect } from "react";
import { subscribeToEvent, type DomainEvent } from "@/infrastructure/events";
import { auditLogService } from "../services/AuditLogService";
import { AuditActorType } from "../domain/types";

export function useAuditLogger() {
  useEffect(
    () =>
      subscribeToEvent("*", (event: DomainEvent<any>) => {
        const auditData = {
          user_id: event.userId || "system",
          action: event.type,
          entity_type: event.type.split(".")[0],
          entity_id:
            (event.payload as any)?.entityId ||
            (event.payload as any)?.requestId ||
            (event.payload as any)?.projectId ||
            (event.payload as any)?.id ||
            "unknown",
          new_value: event.payload,
          reason: (event.payload as any)?.reason,
          level: "info" as const,
          title: event.type.replace(".", " ").toUpperCase(),
          description: `Action ${event.type} performed`,
          timestamp: event.timestamp.toISOString(),
          actorType: event.userId ? "user" : "system",
          userName: event.userId || "System",
        };

        auditLogService
          .log({
            ...auditData,
            actorType: (event.userId ? "user" : "system") as AuditActorType,
          })
          .catch(console.error);
      }),
    [],
  );
}
