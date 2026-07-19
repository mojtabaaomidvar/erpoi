// src/features/inspection-management/application/dto/CertificateCommand.ts

import { z } from "zod";

export const CreateCertificateSchema = z.object({
  inspection_id: z.string().min(1, "Inspection ID is required"),
  certificate_type: z.string().min(1, "Certificate type is required"),
  certificate_url: z.string().min(1, "Certificate URL is required"),
  certificate_number: z.string().optional(),
  issued_by_vendor: z.string().optional(),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional(),
  verified_by_ics: z.boolean().default(false),
});

export type CreateCertificateCommand = z.infer<typeof CreateCertificateSchema>;
