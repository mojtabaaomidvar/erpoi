// src/features/inspection-management/application/dto/ReportCommand.ts

import { z } from "zod";

export const CreateReportSchema = z.object({
  inspection_id: z.string().min(1, "Inspection ID is required"),
  report_type: z.enum(["IR", "IRN", "SRN"]),
  report_url: z.string().min(1, "Report URL is required"),
  issued_by: z.string().min(1, "Issued by is required"),
  issued_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  sent_to_client: z.boolean().default(false),
});

export type CreateReportCommand = z.infer<typeof CreateReportSchema>;
