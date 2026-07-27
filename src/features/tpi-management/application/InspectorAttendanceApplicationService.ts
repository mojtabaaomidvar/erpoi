// src/features/tpi-management/application/InspectorAttendanceApplicationService.ts

import { inspectorAttendanceRepository } from "../repositories/SupabaseInspectorAttendanceRepository";
import type {
  InspectorAttendance,
  MonthlyAttendanceSummary,
} from "../domain/types";

class InspectorAttendanceApplicationService {
  private repository = inspectorAttendanceRepository;

  async getAll(): Promise<InspectorAttendance[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<InspectorAttendance | null> {
    return await this.repository.getById(id);
  }

  async getByResidentInspection(
    residentInspectionId: string,
  ): Promise<InspectorAttendance[]> {
    return await this.repository.getByResidentInspection(residentInspectionId);
  }

  async getByMonth(
    residentInspectionId: string,
    month: string,
  ): Promise<InspectorAttendance[]> {
    return await this.repository.getByMonth(residentInspectionId, month);
  }

  async create(
    data: Omit<InspectorAttendance, "id" | "created_at">,
  ): Promise<InspectorAttendance> {
    return await this.repository.create(data);
  }

  async update(
    id: string,
    data: Partial<InspectorAttendance>,
  ): Promise<InspectorAttendance> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getMonthlySummary(
    residentInspectionId: string,
    month: string,
  ): Promise<MonthlyAttendanceSummary[]> {
    return await this.repository.getMonthlySummary(residentInspectionId, month);
  }
}

export const inspectorAttendanceAppService =
  new InspectorAttendanceApplicationService();
