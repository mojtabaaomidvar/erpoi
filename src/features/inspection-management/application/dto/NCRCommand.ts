// src/features/inspection-management/application/dto/NCRCommand.ts

import { z } from "zod";

export const CreateNCRSchema = z.object({
  inspection_id: z.string().min(1, "Inspection ID is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL"]),
  location_found: z.string().optional(),
  photos: z.array(z.string()).optional(),
  reported_by: z.string().optional(),
});

export type CreateNCRCommand = z.infer<typeof CreateNCRSchema>;
