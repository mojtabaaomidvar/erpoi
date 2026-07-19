// src/features/inspection-management/application/VendorApplicationService.ts

import { vendorRepository } from "../repositories/SupabaseVendorRepository";
import type { Vendor } from "../domain/types";
import {
  CreateVendorSchema,
  type CreateVendorCommand,
} from "./dto/VendorCommand";

class VendorApplicationService {
  private repository = vendorRepository;

  async getAll(): Promise<Vendor[]> {
    return await this.repository.getAll();
  }

  async getById(id: string): Promise<Vendor | null> {
    return await this.repository.getById(id);
  }

  async search(query: string): Promise<Vendor[]> {
    return await this.repository.search(query);
  }

  async create(command: CreateVendorCommand): Promise<Vendor> {
    const validatedData = CreateVendorSchema.parse(command);

    // Check for duplicate by name (case-insensitive)
    const existing = await this.repository.getAll();
    const duplicate = existing.find(
      (v) => v.name.toLowerCase() === validatedData.name.toLowerCase(),
    );

    if (duplicate) {
      return duplicate; // Return existing vendor instead of creating duplicate
    }

    return await this.repository.create(validatedData);
  }

  async update(id: string, data: Partial<Vendor>): Promise<Vendor> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getOrCreate(vendorName: string): Promise<Vendor> {
    const existing = await this.repository.search(vendorName);
    const exactMatch = existing.find(
      (v) => v.name.toLowerCase() === vendorName.toLowerCase(),
    );

    if (exactMatch) return exactMatch;

    return await this.repository.create({ name: vendorName });
  }
}

export const vendorAppService = new VendorApplicationService();
