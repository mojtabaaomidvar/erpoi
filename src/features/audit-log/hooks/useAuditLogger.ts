// src/features/audit-log/hooks/useAuditLogger.ts

import { useEvent } from "@infra/events/hooks/useEvent";
import { auditLogService } from "../services/AuditLogService";
import type { DomainEvent } from "@infra/events/types";
import { AuditActorType } from "../domain/types";

export function useAuditLogger() {
  useEvent("*", (event: DomainEvent<any>) => {
    const auditData = {
      user_id: event.userId || "system",
      action: event.type,
      entity_type: event.type.split(".")[0],
      entity_id:
        (event.payload as any)?.projectId ||
        (event.payload as any)?.id ||
        "unknown",
      new_value: event.payload,
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
  });
}
