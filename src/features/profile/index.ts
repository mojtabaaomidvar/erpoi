// src/features/profile/index.ts
import { RemoteProfileRepository } from "./repositories/RemoteProfileRepository";

export const profileRepository = new RemoteProfileRepository();

export * from "./domain/repositories/IProfileRepository";
