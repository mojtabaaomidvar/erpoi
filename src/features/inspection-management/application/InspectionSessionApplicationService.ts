// src/features/inspection-management/application/InspectionSessionApplicationService.ts

import { inspectionSessionRepository } from "../repositories/SupabaseInspectionSessionRepository";
import type {
  InspectionSession,
  CreateSessionCommand,
  DeleteInspectionSessionCommand,
} from "../domain/models/InspectionSession";
import { publishEvent } from "@infra/events";

function generateId(): string {
  return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

export class InspectionSessionApplicationService {
  private repo = inspectionSessionRepository;

  async getSessionsByRequestId(
    requestId: string,
  ): Promise<InspectionSession[]> {
    return this.repo.getByRequestId(requestId);
  }

  async getSessionById(sessionId: string): Promise<InspectionSession | null> {
    return this.repo.getById(sessionId);
  }

  async createSession(
    command: CreateSessionCommand,
  ): Promise<InspectionSession> {
    const sessionNumber = await this.repo.getNextSessionNumber(
      command.tpi_request_id,
    );
    const id = generateId();

    return this.repo.create({
      ...command,
      id,
      session_number: sessionNumber,
    });
  }

  async updateSession(
    sessionId: string,
    data: Partial<
      Pick<
        InspectionSession,
        | "status"
        | "notes"
        | "session_date"
        | "stages"
        | "methods"
        | "equipment_ids"
        | "sub_vendor"
      >
    >,
  ): Promise<InspectionSession> {
    return this.repo.update(sessionId, data);
  }

  async cancelSession(sessionId: string): Promise<void> {
    return this.repo.cancel(sessionId);
  }

  async deleteSession(
    sessionId: string,
    command: DeleteInspectionSessionCommand,
  ): Promise<void> {
    const actorId = command.deleted_by.trim();
    const reason = command.reason.trim();
    if (!actorId) throw new Error("Deleting user is required");
    if (reason.length < 5) {
      throw new Error("Deletion reason must be at least 5 characters");
    }

    const session = await this.repo.getById(sessionId);
    if (!session) throw new Error("Inspection session not found");

    await this.repo.softDelete(sessionId, {
      deleted_by: actorId,
      reason,
    });

    publishEvent(
      "inspection.session.deleted",
      {
        id: sessionId,
        entityId: sessionId,
        requestId: session.tpi_request_id,
        sessionNumber: session.session_number,
        reason,
      },
      {
        userId: actorId,
        source: "InspectionSessionApplicationService",
      },
    );
  }
}

export const inspectionSessionAppService =
  new InspectionSessionApplicationService();
