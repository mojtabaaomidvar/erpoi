// src/features/inspection-management/repositories/IInspectionRepository.ts

import type { InspectorAssignment } from "./SupabaseInspectionRepository";

export interface IInspectionRepository {
  assignInspector(
    requestId: string,
    category: "TPI" | "MWS",
    inspectorId: string,
    assignedBy: string,
    executionDate?: string,
    location?: string,
    vendorSite?: string,
  ): Promise<InspectorAssignment>;

  getAssignmentsByRequest(
    requestId: string,
    category?: "TPI" | "MWS",
  ): Promise<InspectorAssignment[]>;

  updateAssignment(
    assignmentId: string,
    category: "TPI" | "MWS",
    updateData: Partial<InspectorAssignment>,
  ): Promise<InspectorAssignment>;

  cancelAssignment(
    assignmentId: string,
    category: "TPI" | "MWS",
    cancelledBy: string,
    reason?: string,
    cancellationNotes?: string,
  ): Promise<InspectorAssignment>;

  getAssignmentsByInspectorAndDate(
    inspectorId: string,
    executionDate: string,
    category?: "TPI" | "MWS",
  ): Promise<InspectorAssignment[]>;

  getAll(category?: "TPI" | "MWS"): Promise<any[]>;
  getById(id: string, category?: "TPI" | "MWS"): Promise<any | null>;
  getByInspectionRequest(
    requestId: string,
    category?: "TPI" | "MWS",
  ): Promise<any[]>;
  create(data: any, category?: "TPI" | "MWS"): Promise<any>;
  update(id: string, data: any, category?: "TPI" | "MWS"): Promise<any>;
  delete(id: string, category?: "TPI" | "MWS"): Promise<void>;
  updateExecution(
    requestId: string,
    category: "TPI" | "MWS",
    updateData: any,
  ): Promise<any>;
  cancelInspection(
    requestId: string,
    category: "TPI" | "MWS",
    cancelledBy: string,
    reason?: string,
    relatedInspectionId?: string,
    newScheduledDate?: string,
    dateIsUnknown?: boolean,
    newScopes?: string[],
    cancellationNotes?: string,
  ): Promise<any>;
  getInspectionWithDetails(
    requestId: string,
    category: "TPI" | "MWS",
  ): Promise<any>;
  getAllAssignments(category?: "TPI" | "MWS"): Promise<InspectorAssignment[]>;
}
