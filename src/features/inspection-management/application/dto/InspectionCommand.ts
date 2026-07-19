// src/features/inspection-management/application/dto/InspectionCommand.ts

import { z } from "zod";

export const CreateInspectionSchema = z.object({
  inspection_request_id: z.string().min(1, "Inspection request ID is required"),
  inspector_id: z.string().min(1, "Inspector ID is required"),
  assigned_by: z.string().min(1, "Assigned by is required"),
  execution_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  location: z.string().optional(),
  vendor_site: z.string().optional(),
});

export type CreateInspectionCommand = z.infer<typeof CreateInspectionSchema>;
