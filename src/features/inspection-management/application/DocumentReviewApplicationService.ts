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

export interface PendingDocumentUpload {
  file: File;
  document_name: string;
  document_type?: string;
  document_number?: string;
  revision?: string;
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

  async getByResidentEngagement(
    engagementId: string,
  ): Promise<DocumentReview[]> {
    return this.repository.getByResidentEngagement(engagementId);
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

  async uploadResidentDocuments(
    engagementId: string,
    files: readonly PendingDocumentUpload[],
  ): Promise<void> {
    const results = await Promise.allSettled(
      files.map(async (item) => {
        const documentName = item.document_name.trim();
        if (!documentName) {
          throw new Error("Document display name is required");
        }

        const fileUrl = await this.repository.uploadResidentFile(
          item.file,
          engagementId,
        );
        try {
          await this.repository.create({
            inspection_request_id: null,
            resident_engagement_id: engagementId,
            session_id: null,
            document_type: item.document_type || "OTHER",
            document_name: documentName,
            document_url: fileUrl,
            document_number: item.document_number || undefined,
            revision: item.revision || undefined,
            review_status: "INITIAL",
          });
        } catch (error) {
          await this.repository.deleteFileFromStorage(fileUrl);
          throw error;
        }
      }),
    );

    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      throw new Error(
        `${failures.length} of ${files.length} Resident document(s) could not be uploaded`,
      );
    }
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
