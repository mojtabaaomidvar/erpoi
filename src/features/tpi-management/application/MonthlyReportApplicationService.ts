// src/features/tpi-management/application/MonthlyReportApplicationService.ts

import { monthlyReportRepository } from "../repositories/SupabaseMonthlyReportRepository";
import type { MonthlyReport } from "../domain/types";

class MonthlyReportApplicationService {
  private repository = monthlyReportRepository;

  async getAll(): Promise<MonthlyReport[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<MonthlyReport | null> {
    return await this.repository.getById(id);
  }

  async getByResidentInspection(
    residentInspectionId: string,
  ): Promise<MonthlyReport[]> {
    return await this.repository.getByResidentInspection(residentInspectionId);
  }

  async getByMonth(
    residentInspectionId: string,
    month: string,
  ): Promise<MonthlyReport | null> {
    return await this.repository.getByMonth(residentInspectionId, month);
  }

  async create(
    data: Omit<MonthlyReport, "id" | "created_at" | "updated_at">,
  ): Promise<MonthlyReport> {
    return await this.repository.create(data);
  }

  async update(
    id: string,
    data: Partial<MonthlyReport>,
  ): Promise<MonthlyReport> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async approve(id: string, approvedBy: string): Promise<MonthlyReport> {
    return await this.repository.update(id, {
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    });
  }
}

export const monthlyReportAppService = new MonthlyReportApplicationService();
