//src/features/inspector-managment/application/services/InspectorApplicationService.ts

import type { Inspector, IInspectorRepository } from "./../domain";

export class InspectorApplicationService {
  constructor(private inspectorRepository: IInspectorRepository) {}

  async getAll(): Promise<Inspector[]> {
    return await this.inspectorRepository.getAll();
  }
  async getById(id: string): Promise<Inspector | null> {
    return await this.inspectorRepository.getById(id);
  }
  async create(
    inspector: Omit<Inspector, "id" | "created_at" | "updated_at">,
  ): Promise<Inspector> {
    return await this.inspectorRepository.create(inspector);
  }
  async update(id: string, inspector: Partial<Inspector>): Promise<Inspector> {
    return await this.inspectorRepository.update(id, inspector);
  }
  async delete(id: string): Promise<void> {
    return await this.inspectorRepository.delete(id);
  }
  async uploadResume(
    file: File,
    inspectorId: string,
    customName?: string,
  ): Promise<{ url: string; name: string; size: number; uploadedAt: string }> {
    return await this.inspectorRepository.uploadResume(
      file,
      inspectorId,
      customName,
    );
  }
  async deleteResume(resumeUrl: string): Promise<void> {
    return await this.inspectorRepository.deleteResume(resumeUrl);
  }
  async getAvailableUsersForIcsMember(
    currentEditingUserId?: string | null,
  ): Promise<any[]> {
    return await this.inspectorRepository.getAvailableUsersForIcsMember(
      currentEditingUserId,
    );
  }

  async syncInspectors(
    currentInspectors: Inspector[],
    newInspectors: Inspector[],
  ): Promise<void> {
    const currentIds = new Set(currentInspectors.map((c) => c.id));
    const newIds = new Set(newInspectors.map((c) => c.id));
    for (const inspector of newInspectors.filter((c) => !currentIds.has(c.id)))
      await this.create(inspector);
    for (const inspector of currentInspectors.filter(
      (c) => !newIds.has(c.id),
    )) {
      try {
        await this.delete(inspector.id);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
    for (const inspector of newInspectors.filter((c) => {
      const prev = currentInspectors.find((pc) => pc.id === c.id);
      return prev && JSON.stringify(prev) !== JSON.stringify(c);
    })) {
      await this.update(inspector.id, inspector);
    }
  }
}
