//src/features/contract-management/application/services/AmendmentApplicationService.ts

import type {
  ContractAmendment,
  CreateAmendmentData,
  IAmendmentRepository,
  IContractRepository,
  ITariffRepository,
} from "../../domain";
import { publishEvent, EVENT_TYPES } from "@infra/events";
import { notificationService } from "@features/notifications/services/NotificationService";

export class AmendmentApplicationService {
  constructor(
    private amendmentRepo: IAmendmentRepository,
    private contractRepo: IContractRepository,
    private tariffRepo: ITariffRepository,
  ) {}

  async generateAmendmentNo(contractId: string): Promise<string> {
    const contract = await this.contractRepo.getById(contractId);
    if (!contract) throw new Error("Contract not found");
    const amendments = await this.amendmentRepo.getByContractId(contractId);
    const sequence = amendments.length + 1;
    return `AMD-${contract.contract_no}-${String(sequence).padStart(2, "0")}`;
  }

  async create(amendmentData: CreateAmendmentData): Promise<ContractAmendment> {
    let amendment_no = amendmentData.amendment_no;
    if (!amendment_no) {
      amendment_no = await this.generateAmendmentNo(amendmentData.contract_id);
    }

    const amendment = await this.amendmentRepo.create({
      ...amendmentData,
      amendment_no,
    });

    publishEvent(
      EVENT_TYPES.AMENDMENT_CREATED,
      {
        amendmentId: amendment.id,
        contractId: amendment.contract_id,
        amendmentNo: amendment.amendment_no || "",
        types: amendment.amendment_types,
        createdBy: amendment.created_by || "",
      },
      { source: "AmendmentApplicationService", userId: amendment.created_by },
    );

    // TODO: منطق ارسال Notification به مدیران را اینجا اضافه کنید (با استفاده از notificationService)

    return amendment;
  }

  async approve(amendmentId: string, approvedBy: string): Promise<void> {
    const amendment = await this.amendmentRepo.getById(amendmentId);
    if (!amendment) throw new Error("Amendment not found");
    if (amendment.approval_status === "APPROVED")
      throw new Error("Already approved");

    await this.amendmentRepo.updateStatus(amendmentId, "APPROVED", approvedBy);
    await this.applyAmendment(amendment); // اعمال تغییرات روی قرارداد و تعرفه‌ها

    publishEvent(
      EVENT_TYPES.AMENDMENT_APPROVED,
      {
        amendmentId,
        contractId: amendment.contract_id,
        amendmentNo: amendment.amendment_no || "",
        approvedBy,
      },
      { source: "AmendmentApplicationService", userId: approvedBy },
    );
  }

  async reject(
    amendmentId: string,
    rejectedBy: string,
    rejectionReason: string,
  ): Promise<void> {
    const amendment = await this.amendmentRepo.getById(amendmentId);
    if (!amendment) throw new Error("Amendment not found");
    if (amendment.approval_status === "APPROVED")
      throw new Error("Cannot reject an already approved amendment");

    await this.amendmentRepo.updateStatus(
      amendmentId,
      "REJECTED",
      rejectedBy,
      rejectionReason,
    );

    publishEvent(
      EVENT_TYPES.AMENDMENT_REJECTED,
      {
        amendmentId,
        contractId: amendment.contract_id,
        amendmentNo: amendment.amendment_no || "",
        rejectedBy,
        reason: rejectionReason,
      },
      { source: "AmendmentApplicationService", userId: rejectedBy },
    );
  }

  private async applyAmendment(amendment: ContractAmendment): Promise<void> {
    const contract = await this.contractRepo.getById(amendment.contract_id);
    if (!contract) throw new Error("Contract not found");

    const updates: any = {};
    let hasContractUpdate = false;

    if (
      amendment.amendment_types.includes("DATE_EXTENSION") &&
      amendment.new_end_date
    ) {
      updates.end_date = amendment.new_end_date;
      hasContractUpdate = true;
    }
    if (
      amendment.amendment_types.includes("VALUE_INCREASE") &&
      amendment.new_value !== undefined
    ) {
      updates.total_value = amendment.new_value;
      hasContractUpdate = true;
    }

    if (
      amendment.amendment_types.includes("TARIFF_ADJUSTMENT") &&
      amendment.tariff_adjustments?.length
    ) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const effectiveDate = new Date(amendment.effective_date);
      effectiveDate.setHours(0, 0, 0, 0);
      const isFutureAmendment = effectiveDate > today;

      for (const adj of amendment.tariff_adjustments) {
        const currentTariff = await this.tariffRepo.getById(adj.tariff_line_id); // فرض بر این است که متد getById در TariffRepo وجود دارد
        if (!currentTariff)
          throw new Error(`Tariff not found: ${adj.tariff_line_id}`);

        if (isFutureAmendment) {
          await this.tariffRepo.update(adj.tariff_line_id, {
            valid_to: amendment.effective_date,
          });
        } else {
          await this.tariffRepo.update(adj.tariff_line_id, {
            is_archived: true,
            valid_to: amendment.effective_date,
          });
        }

        await this.tariffRepo.create({
          contract_id: currentTariff.contract_id,
          description: currentTariff.description,
          unit: currentTariff.unit,
          rate: adj.new_rate,
          total_quantity: currentTariff.total_quantity,
          consumed_quantity: 0,
          invoiced: 0,
          currency: currentTariff.currency,
          is_lump_sum: currentTariff.is_lump_sum,
          valid_from: amendment.effective_date,
          valid_to: undefined,
          is_archived: false,
          parent_tariff_id: adj.tariff_line_id,
          version: (currentTariff.version || 1) + 1,
        });
      }
    }

    if (hasContractUpdate) {
      updates.updated_at = new Date().toISOString();
      await this.contractRepo.update(amendment.contract_id, updates);
    }
  }

  // متدهای ساده Delegate
  async getByContractId(contractId: string) {
    return this.amendmentRepo.getByContractId(contractId);
  }
  async getById(amendmentId: string) {
    return this.amendmentRepo.getById(amendmentId);
  }
  async getPending() {
    return this.amendmentRepo.getPending();
  }
  async getLatestByContractId(contractId: string) {
    return this.amendmentRepo.getLatestByContractId(contractId);
  }
  async hasAmendments(contractId: string) {
    return this.amendmentRepo.hasAmendments(contractId);
  }
  async delete(amendmentId: string) {
    return this.amendmentRepo.delete(amendmentId);
  }
  async updateAttachments(
    amendmentId: string,
    urls: string[],
    names: string[],
  ) {
    return this.amendmentRepo.updateAttachments(amendmentId, urls, names);
  }
  async syncPendingAmendments(): Promise<void> {
    try {
      const pendingAmendments = await this.amendmentRepo.getPending();
      if (!pendingAmendments || pendingAmendments.length === 0) return;

      const existingNotifications = notificationService.getAll();

      for (const amendment of pendingAmendments) {
        const contract = await this.contractRepo.getById(amendment.contract_id);

        const alreadyNotified = existingNotifications.some(
          (n: any) =>
            n.metadata?.amendmentId === amendment.id && n.type === "warning",
        );

        if (!alreadyNotified) {
          const typeLabels = amendment.amendment_types
            .map((t: string) =>
              t === "DATE_EXTENSION"
                ? "📅 Date"
                : t === "VALUE_INCREASE"
                  ? "💰 Value"
                  : "📊 Tariff",
            )
            .join(", ");

          await notificationService.create({
            type: "warning",
            category: "contract",
            title: `Pending Amendment: ${amendment.amendment_no || "Auto"}`,
            message: `Amendment for contract ${contract?.contract_no || amendment.contract_id} is pending approval. Types: ${typeLabels}`,
            actionUrl: `/contracts/${amendment.contract_id}`,
            metadata: {
              contractId: amendment.contract_id,
              amendmentId: amendment.id,
              contractNo: contract?.contract_no,
              amendmentNo: amendment.amendment_no,
              amendmentTypes: amendment.amendment_types,
            },
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to sync pending amendments:", error);
    }
  }
}
