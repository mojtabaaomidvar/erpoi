//src/features/inspector-managment/domain/repositories/IInspectorRepository.ts

import type { Inspector } from "../domain/models/Inspector";

export interface IInspectorRepository {
  getAll(): Promise<Inspector[]>;
  getById(id: string): Promise<Inspector | null>;
  create(
    inspector: Omit<Inspector, "id" | "created_at" | "updated_at">,
  ): Promise<Inspector>;
  update(id: string, inspector: Partial<Inspector>): Promise<Inspector>;
  delete(id: string): Promise<void>;
  uploadResume(
    file: File,
    inspectorId: string,
    customName?: string,
  ): Promise<{ url: string; name: string; size: number; uploadedAt: string }>;
  deleteResume(resumeUrl: string): Promise<void>;
  getAvailableUsersForIcsMember(
    currentEditingUserId?: string | null,
  ): Promise<any[]>;
}
