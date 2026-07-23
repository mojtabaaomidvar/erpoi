//src/features/auth/domain/repositories/IAuthRepository.ts

import type { LoginCredentials, AuthUser } from "../models/Auth";

export interface IAuthRepository {
  authenticate(credentials: LoginCredentials): Promise<AuthUser>;
  signOut(): Promise<void>;
}