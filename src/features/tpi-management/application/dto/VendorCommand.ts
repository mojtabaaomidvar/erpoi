// src/features/inspection-management/application/dto/VendorCommand.ts

import { z } from "zod";

export const CreateVendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  address: z.string().optional(),
});

export type CreateVendorCommand = z.infer<typeof CreateVendorSchema>;
