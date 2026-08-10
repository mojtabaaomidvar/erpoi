// src/features/profile/domain/repositories/IProfileRepository.ts
export interface IProfileRepository {
  getProfile(token: string): Promise<any>;
  updateProfile(token: string, payload: any): Promise<any>;
}
