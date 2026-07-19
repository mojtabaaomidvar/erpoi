// src/features/inspection-management/repositories/ICertificateRepository.ts

import type { Certificate } from "../domain/types";

export interface ICertificateRepository {
  getAll(): Promise<Certificate[]>;
  getById(id: string): Promise<Certificate | null>;
  getByInspection(inspectionId: string): Promise<Certificate[]>;
  create(data: Omit<Certificate, "id" | "created_at">): Promise<Certificate>;
  update(id: string, data: Partial<Certificate>): Promise<Certificate>;
  delete(id: string): Promise<void>;
}
