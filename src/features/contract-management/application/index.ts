//src/features/contract-management/application/index.ts

import { SupabaseContractRepository } from "../repositories/SupabaseContractRepository";
import { SupabaseTariffRepository } from "../repositories/SupabaseTariffRepository";
import { SupabaseAmendmentRepository } from "../repositories/SupabaseAmendmentRepository";
import { ContractApplicationService } from "./services/ContractApplicationService";
import { TariffApplicationService } from "./services/TariffApplicationService";
import { AmendmentApplicationService } from "./services/AmendmentApplicationService";

const contractRepo = new SupabaseContractRepository();
const tariffRepo = new SupabaseTariffRepository();
const amendmentRepo = new SupabaseAmendmentRepository();

export const contractAppService = new ContractApplicationService(contractRepo);
export const tariffAppService = new TariffApplicationService(tariffRepo);
export const amendmentAppService = new AmendmentApplicationService(
  amendmentRepo,
  contractRepo,
  tariffRepo,
);

export * from "./services/ContractApplicationService";
export * from "./services/TariffApplicationService";
export * from "./services/AmendmentApplicationService";
