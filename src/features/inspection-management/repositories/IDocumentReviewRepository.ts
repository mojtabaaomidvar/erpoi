// src/features/inspection-management/repositories/IDocumentReviewRepository.ts

import type { DocumentReview } from "../domain/types";

export interface IDocumentReviewRepository {
  getAll(): Promise<DocumentReview[]>;
  getById(id: string): Promise<DocumentReview | null>;
  getByInspectionRequest(requestId: string): Promise<DocumentReview[]>;
  getByResidentEngagement(engagementId: string): Promise<DocumentReview[]>;
  create(
    data: Omit<DocumentReview, "id" | "created_at" | "updated_at">,
  ): Promise<DocumentReview>;
  update(id: string, data: Partial<DocumentReview>): Promise<DocumentReview>;
  delete(id: string): Promise<void>;

  verifyDocument(
    id: string,
    verifiedBy: string,
    letterNumber: string,
    verificationDate: string,
  ): Promise<DocumentReview>;

  unverifyDocument(id: string): Promise<DocumentReview>;

  uploadFile(file: File, ownerId: string): Promise<string>;
  uploadResidentFile(file: File, engagementId: string): Promise<string>;
  deleteFileFromStorage(fileUrl: string): Promise<void>;
}
