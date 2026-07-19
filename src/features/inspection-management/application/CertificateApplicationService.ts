// src/features/inspection-management/application/CertificateApplicationService.ts

import { certificateRepository } from "../repositories/SupabaseCertificateRepository";
import type { Certificate } from "../domain/types";
import {
  CreateCertificateSchema,
  type CreateCertificateCommand,
} from "./dto/CertificateCommand";

class CertificateApplicationService {
  private repository = certificateRepository;

  async getAll(): Promise<Certificate[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<Certificate | null> {
    return await this.repository.getById(id);
  }

  async getByInspection(inspectionId: string): Promise<Certificate[]> {
    return await this.repository.getByInspection(inspectionId);
  }

  async create(command: CreateCertificateCommand): Promise<Certificate> {
    const validatedData = CreateCertificateSchema.parse(command);
    return await this.repository.create(validatedData);
  }

  async update(id: string, data: Partial<Certificate>): Promise<Certificate> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async verifyCertificate(
    id: string,
    verifiedBy: string,
  ): Promise<Certificate> {
    return await this.repository.update(id, {
      verified_by_ics: true,
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
    });
  }
}

export const certificateAppService = new CertificateApplicationService();
