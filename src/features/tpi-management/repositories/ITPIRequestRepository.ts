//src/features/tpi-management/repositories/ITPIRequestRepository.ts

import type { TPIRequest } from "../domain/types";

export interface ITPIRequestRepository {
  getAll(): Promise<TPIRequest[]>;
  getById(id: string): Promise<TPIRequest | null>;
  create(data: any): Promise<TPIRequest>;
  update(id: string, data: any): Promise<TPIRequest>;
  delete(id: string): Promise<void>;

  uploadFile(file: File, requestId: string): Promise<string>;
  createInspectionItems(requestId: string, items: any[]): Promise<void>;
  createSourceFiles(requestId: string, files: any[]): Promise<void>;
  getInspectionItems(requestId: string): Promise<any[]>;
  getSourceFiles(requestId: string): Promise<any[]>;
}
