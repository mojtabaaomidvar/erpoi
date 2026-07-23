//src/features/contract-management/domain/repositories/IAmendmentRepository.ts

import type { ContractAmendment, CreateAmendmentData } from "../models/Contract";

export interface IAmendmentRepository {
  getByContractId(contractId: string): Promise<ContractAmendment[]>;
  getById(amendmentId: string): Promise<ContractAmendment | null>;
  create(amendmentData: CreateAmendmentData): Promise<ContractAmendment>;
  updateAttachments(amendmentId: string, urls: string[], names: string[]): Promise<void>;
  updateStatus(amendmentId: string, status: "APPROVED" | "REJECTED", userId: string, reason?: string): Promise<void>;
  getPending(): Promise<ContractAmendment[]>;
  getLatestByContractId(contractId: string): Promise<ContractAmendment | null>;
  hasAmendments(contractId: string): Promise<boolean>;
  delete(amendmentId: string): Promise<void>;
}