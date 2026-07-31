// src/features/inspection-management/application/InspectionApplicationService.ts

import type { IInspectionRepository } from "../repositories/IInspectionRepository";
import { inspectionRepository } from "../repositories/SupabaseInspectionRepository";
import type { TPICancellationReason } from "@/features/tpi-management";

export class InspectionApplicationService {
  constructor(private repository: IInspectionRepository) {}

  async getById(id: string, category: "TPI" | "MWS" = "TPI") {
    return await this.repository.getById(id, category);
  }

  async getByInspectionRequest(
    requestId: string,
    category: "TPI" | "MWS" = "TPI",
  ) {
    return await this.repository.getByInspectionRequest(requestId, category);
  }

  async create(data: any, category: "TPI" | "MWS" = "TPI") {
    return await this.repository.create(data, category);
  }

  async update(id: string, data: any, category: "TPI" | "MWS" = "TPI") {
    return await this.repository.update(id, data, category);
  }

  async delete(id: string, category: "TPI" | "MWS" = "TPI") {
    return await this.repository.delete(id, category);
  }

  async getAll(category: "TPI" | "MWS" = "TPI") {
    return await this.repository.getAll(category);
  }

  async assignInspector(
    requestId: string,
    category: "TPI" | "MWS",
    inspectorId: string,
    assignedBy: string,
    executionDate?: string,
    location?: string,
    vendorSite?: string,
  ) {
    return await this.repository.assignInspector(
      requestId,
      category,
      inspectorId,
      assignedBy,
      executionDate,
      location,
      vendorSite,
    );
  }

  async getAssignmentsByRequest(
    requestId: string,
    category: "TPI" | "MWS" = "TPI",
  ) {
    return await this.repository.getAssignmentsByRequest(requestId, category);
  }

  async cancelAssignment(
    assignmentId: string,
    category: "TPI" | "MWS",
    cancelledBy: string,
    reason?: string,
    cancellationNotes?: string,
  ) {
    return await this.repository.cancelAssignment(
      assignmentId,
      category,
      cancelledBy,
      reason,
      cancellationNotes,
    );
  }

  async updateExecution(
    requestId: string,
    category: "TPI" | "MWS",
    updateData: any,
  ) {
    return await this.repository.updateExecution(
      requestId,
      category,
      updateData,
    );
  }

  async cancelInspection(
    requestId: string,
    category: "TPI" | "MWS",
    cancelledBy: string,
    reason?: TPICancellationReason,
    relatedInspectionId?: string,
    newScheduledDate?: string,
    dateIsUnknown?: boolean,
    newScopes?: string[],
    cancellationNotes?: string,
  ) {
    return await this.repository.cancelInspection(
      requestId,
      category,
      cancelledBy,
      reason,
      relatedInspectionId,
      newScheduledDate,
      dateIsUnknown,
      newScopes,
      cancellationNotes,
    );
  }

  async getInspectionWithDetails(id: string, category: "TPI" | "MWS" = "TPI") {
    return await this.repository.getInspectionWithDetails(id, category);
  }

  async getAssignmentsByInspectorAndDate(
    inspectorId: string,
    executionDate: string,
    category: "TPI" | "MWS" = "TPI",
  ) {
    return await this.repository.getAssignmentsByInspectorAndDate(
      inspectorId,
      executionDate,
      category,
    );
  }

  async getAllAssignments(category: "TPI" | "MWS" = "TPI") {
    return await this.repository.getAllAssignments(category);
  }
}

export const inspectionAppService = new InspectionApplicationService(
  inspectionRepository,
);
