// src/features/project-management/application/dto/CreateProjectCommand.ts

import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),

  // ✅ تغییر از .uuid() به .min(1) برای پشتیبانی از IDهای سفارشی (مثل client_123)
  client_id: z.string().min(1, "Client ID is required"),
  contract_id: z.string().min(1, "Contract ID is required"),

  service_types: z
    .array(z.enum(["TPI", "MWS"]))
    .min(1, "At least one service type is required"),
  description: z.string().optional(),

  // ✅ تغییر regex سخت‌گیرانه به بررسی ساده‌تر وجود داشتن تاریخ
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),

  // ✅ تغییر از .uuid() به .min(1) برای user_id
  created_by: z.string().min(1, "User ID is required"),
});

export type CreateProjectCommand = z.infer<typeof CreateProjectSchema>;
