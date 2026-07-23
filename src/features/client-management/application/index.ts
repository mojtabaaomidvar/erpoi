import { SupabaseClientRepository } from "../repositories";
import { ClientApplicationService } from "./services/ClientApplicationService";

export const clientAppService = new ClientApplicationService(
  new SupabaseClientRepository(),
);

export * from "./services/ClientApplicationService";
