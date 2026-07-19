// src/features/inspection-management/application/dto/ChecklistCommand.ts

import { z } from "zod";

export const ChecklistItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  category: z.enum([
    "VISUAL",
    "DIMENSIONAL",
    "MATERIAL",
    "WELDING",
    "NDT",
    "COATING",
    "PACKAGING",
    "DOCUMENTATION",
    "OTHER",
  ]),
});

export const CreateChecklistSchema = z.object({
  inspection_id: z.string().min(1, "Inspection ID is required"),
  category: z.enum([
    "VISUAL",
    "DIMENSIONAL",
    "MATERIAL",
    "WELDING",
    "NDT",
    "COATING",
    "PACKAGING",
    "DOCUMENTATION",
    "OTHER",
  ]),
  checklist_name: z.string().min(1, "Checklist name is required"),
  items: z.array(ChecklistItemSchema).min(1, "At least one item is required"),
});

export type CreateChecklistCommand = z.infer<typeof CreateChecklistSchema>;
