// src/features/inspection-management/application/dto/DocumentReviewCommand.ts

import { z } from "zod";

export const CreateDocumentReviewSchema = z.object({
  inspection_request_id: z.string().min(1, "Inspection request ID is required"),
  document_type: z.enum([
    "ITP",
    "PROCEDURE",
    "CERTIFICATE",
    "DRAWING",
    "Others",
  ]),
  document_name: z.string().min(1, "Document name is required"),
  document_url: z.string().min(1, "Document URL is required"),
  document_number: z.string().optional(),
  revision: z.string().optional(),
});

export type CreateDocumentReviewCommand = z.infer<
  typeof CreateDocumentReviewSchema
>;
