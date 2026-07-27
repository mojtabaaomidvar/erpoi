// src/features/tpi-management/repositories/IMonthlyReportRepository.ts

import type { MonthlyReport } from "../domain/types";

export interface IMonthlyReportRepository {
  getAll(): Promise<MonthlyReport[]>;
  getById(id: string): Promise<MonthlyReport | null>;
  getByResidentInspection(
    residentInspectionId: string,
  ): Promise<MonthlyReport[]>;
  getByMonth(
    residentInspectionId: string,
    month: string,
  ): Promise<MonthlyReport | null>;
  create(
    data: Omit<MonthlyReport, "id" | "created_at" | "updated_at">,
  ): Promise<MonthlyReport>;
  update(id: string, data: Partial<MonthlyReport>): Promise<MonthlyReport>;
  delete(id: string): Promise<void>;
}
