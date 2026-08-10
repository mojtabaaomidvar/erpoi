// src/features/inspection-management/application/DocumentReviewApplicationService.ts

import { documentReviewRepository } from "../repositories/SupabaseDocumentReviewRepository";
import type { DocumentReview, ReviewStatus } from "../domain/types";
import {
  CreateDocumentReviewSchema,
  type CreateDocumentReviewCommand,
} from "./dto/DocumentReviewCommand";
import { inspectionSessionAppService } from "./InspectionSessionApplicationService";

export interface SessionDocumentReviewDTO extends DocumentReview {
  source_session_number?: number;
  is_legacy_unassigned: boolean;
}

class DocumentReviewApplicationService {
  private repository = documentReviewRepository;

  async getAll(): Promise<DocumentReview[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<DocumentReview | null> {
    return await this.repository.getById(id);
  }

  async getByInspectionRequest(requestId: string): Promise<DocumentReview[]> {
    return await this.repository.getByInspectionRequest(requestId);
  }

  async getVisibleForSession(
    requestId: string,
    sessionId?: string,
  ): Promise<SessionDocumentReviewDTO[]> {
    const documents = await this.repository.getByInspectionRequest(requestId);
    if (!sessionId) {
      return documents.map((document) => ({
        ...document,
        is_legacy_unassigned: !document.session_id,
      }));
    }

    const sessions =
      await inspectionSessionAppService.getSessionsByRequestId(requestId);
    const activeSession = sessions.find((session) => session.id === sessionId);
    if (!activeSession) return [];

    const visibleSessions = new Map(
      sessions
        .filter(
          (session) => session.session_number <= activeSession.session_number,
        )
        .map((session) => [session.id, session.session_number]),
    );

    return documents
      .filter(
        (document) =>
          !document.session_id || visibleSessions.has(document.session_id),
      )
      .map((document) => ({
        ...document,
        source_session_number: document.session_id
          ? visibleSessions.get(document.session_id)
          : undefined,
        is_legacy_unassigned: !document.session_id,
      }));
  }

  async create(command: CreateDocumentReviewCommand): Promise<DocumentReview> {
    const validatedData = CreateDocumentReviewSchema.parse(command);
    return await this.repository.create({
      ...validatedData,
      review_status: "INITIAL",
    });
  }

  async update(
    id: string,
    data: Partial<DocumentReview>,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async approveDocument(
    id: string,
    reviewedBy: string,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, {
      review_status: "APPROVED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    });
  }

  async rejectDocument(
    id: string,
    reviewedBy: string,
    comments: string,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, {
      review_status: "REJECTED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      comments,
    });
  }

  async commentDocument(
    id: string,
    reviewedBy: string,
    comments: string,
  ): Promise<DocumentReview> {
    return await this.repository.update(id, {
      review_status: "COMMENTED",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      comments,
    });
  }

  async uploadDocument(data: {
    inspection_request_id: string;
    session_id?: string;
    document_type: string;
    document_name: string;
    document_url: string;
    document_number?: string;
    revision?: string;
    review_status?: ReviewStatus;
  }): Promise<DocumentReview> {
    return await this.repository.create({
      ...data,
      review_status: data.review_status || "INITIAL",
      reviewed_by: undefined,
      reviewed_at: undefined,
    });
  }

  async verifyDocument(
    id: string,
    verifiedBy: string,
    letterNumber: string,
    verificationDate: string,
  ): Promise<DocumentReview> {
    return await this.repository.verifyDocument(
      id,
      verifiedBy,
      letterNumber,
      verificationDate,
    );
  }

  async unverifyDocument(id: string): Promise<DocumentReview> {
    return await this.repository.unverifyDocument(id);
  }

  async uploadDocuments(
    requestId: string,
    sessionId: string | undefined,
    files: any[],
    userId: string,
  ) {
    await Promise.all(
      files.map(async (f) => {
        const fileUrl = await this.repository.uploadFile(f.file, requestId);
        await this.repository.create({
          inspection_request_id: requestId,
          session_id: sessionId,
          document_type: f.document_type,
          document_name: f.document_name,
          document_url: fileUrl,
          document_number: f.document_number || undefined,
          revision: f.revision || undefined,
          review_status: "INITIAL",
        });
      }),
    );
  }

  async deleteDocument(id: string, fileUrl: string) {
    await this.repository.deleteFileFromStorage(fileUrl);
    await this.repository.delete(id);
  }

  async bulkDeleteDocuments(docs: { id: string; fileUrl: string }[]) {
    for (const doc of docs) {
      await this.deleteDocument(doc.id, doc.fileUrl);
    }
  }
}

export const documentReviewAppService = new DocumentReviewApplicationService();
