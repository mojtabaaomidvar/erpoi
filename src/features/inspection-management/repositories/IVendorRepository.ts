// src/features/inspection-management/repositories/IVendorRepository.ts

import type { Vendor } from "../domain/types";

export interface IVendorRepository {
  getAll(): Promise<Vendor[]>;
  getById(id: string): Promise<Vendor | null>;
  search(query: string): Promise<Vendor[]>;
  create(
    data: Omit<Vendor, "id" | "created_at" | "updated_at">,
  ): Promise<Vendor>;
  update(id: string, data: Partial<Vendor>): Promise<Vendor>;
  delete(id: string): Promise<void>;
}
