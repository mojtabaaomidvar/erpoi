//src/features/auth/index.ts

import { SupabaseAuthRepository } from "./repositories/SupabaseAuthRepository";
import { AuthApplicationService } from "./application/services/AuthApplicationService";

export const authAppService = new AuthApplicationService(new SupabaseAuthRepository());

export * from "./domain/models/Auth";
export * from "./domain/repositories/IAuthRepository";
export * from "./application/services/AuthApplicationService";