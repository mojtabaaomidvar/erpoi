// src/features/tpi-management/repositories/IInspectorAttendanceRepository.ts
import type { InspectorAttendance, MonthlyAttendanceSummary } from "../domain/types";

export interface IInspectorAttendanceRepository {
  getAll(): Promise<InspectorAttendance[]>;
  getById(id: string): Promise<InspectorAttendance | null>;
  getByResidentInspection(residentInspectionId: string): Promise<InspectorAttendance[]>;
  getByMonth(residentInspectionId: string, month: string): Promise<InspectorAttendance[]>;
  create(data: Omit<InspectorAttendance, "id" | "created_at">): Promise<InspectorAttendance>;
  update(id: string, data: Partial<InspectorAttendance>): Promise<InspectorAttendance>;
  delete(id: string): Promise<void>;
  getMonthlySummary(residentInspectionId: string, month: string): Promise<MonthlyAttendanceSummary[]>;
}