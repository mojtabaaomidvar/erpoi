// src/features/profile/repositories/RemoteProfileRepository.ts
import { IProfileRepository } from "@features/profile/domain/repositories/IProfileRepository";

export class RemoteProfileRepository implements IProfileRepository {
  private base = "https://api.bluesminds.com";

  async getProfile(token: string) {
    const res = await fetch(`${this.base}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
    return res.json();
  }

  async updateProfile(token: string, payload: any) {
    const res = await fetch(`${this.base}/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to update profile: ${res.status}`);
    return res.json();
  }
}
