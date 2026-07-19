// src/features/inspection-management/application/dto/CreateInspectionRequestCommand.ts

import { z } from "zod";

export const CreateInspectionRequestSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  client_id: z.string().uuid("Invalid client ID"),
  contract_id: z.string().uuid("Invalid contract ID"),
  vendor_id: z.string().uuid("Invalid vendor ID").optional(),
  category: z.enum(["TPI", "MWS"]),
  service_domain: z.string().min(1, "Service domain is required"),
  inspection_mode: z.enum(["SPOT", "RESIDENT"]).optional(),
  inspection_scope: z.string().min(10, "Scope must be at least 10 characters"),
  inspection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  notes: z.string().optional(),
  related_inspection_id: z.string().uuid().optional(),
  site_representative_id: z.string().uuid().optional(),
});

export type CreateInspectionRequestCommand = z.infer<typeof CreateInspectionRequestSchema>;