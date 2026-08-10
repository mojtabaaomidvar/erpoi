import type {
  InspectionSession,
  CreateSessionCommand,
  DeleteInspectionSessionCommand,
} from "../domain/models/InspectionSession";

export interface IInspectionSessionRepository {
  getByRequestId(requestId: string): Promise<InspectionSession[]>;
  getById(sessionId: string): Promise<InspectionSession | null>;
  getNextSessionNumber(requestId: string): Promise<number>;
  create(
    command: CreateSessionCommand & { id: string; session_number: number },
  ): Promise<InspectionSession>;
  update(
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
      >
    >,
  ): Promise<InspectionSession>;
  cancel(sessionId: string): Promise<void>;
  /** Soft-delete while preserving all session-scoped inspection evidence. */
  softDelete(
    sessionId: string,
    command: DeleteInspectionSessionCommand,
  ): Promise<void>;
}
