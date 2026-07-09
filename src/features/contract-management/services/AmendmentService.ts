// src/features/contract-management/services/AmendmentService.ts

import { supabase } from "@shared/database/supabase";
import { notificationService } from "@features/notifications/services/NotificationService";
import type {
  ContractAmendment,
  TariffAdjustment,
  AmendmentType,
  TariffLine,
  CreateAmendmentData,
} from "@/types/contract";

class AmendmentService {
  /**
   * تولید شماره الحاقیه خودکار
   * فرمت: AMD-{contract_no}-{sequence}
   */
  async generateAmendmentNo(contractId: string): Promise<string> {
    try {
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("contract_no")
        .eq("id", contractId)
        .single();

      if (contractError || !contract) {
        throw new Error("Contract not found");
      }

      const { count, error: countError } = await supabase
        .from("contract_amendments")
        .select("*", { count: "exact", head: true })
        .eq("contract_id", contractId);

      if (countError) {
        throw new Error(countError.message);
      }

      const sequence = (count || 0) + 1;
      const paddedSequence = String(sequence).padStart(2, "0");

      return `AMD-${contract.contract_no}-${paddedSequence}`;
    } catch (error: any) {
      console.error(
        "[AmendmentService] Failed to generate amendment_no:",
        error,
      );
      throw new Error(error.message);
    }
  }

  /**
   * دریافت تمام الحاقیه‌های یک قرارداد
   */
  async getByContractId(contractId: string): Promise<ContractAmendment[]> {
    try {
      console.log(
        "[AmendmentService] Getting amendments for contract_id:",
        contractId,
      );

      const { data, error } = await supabase
        .from("contract_amendments")
        .select(
          `
        *,
        tariff_adjustments:amendment_tariff_adjustments(*)
      `,
        )
        .eq("contract_id", contractId)
        .order("effective_date", { ascending: false });

      if (error) {
        console.error("[AmendmentService] Failed to get amendments:", error);
        return [];
      }

      console.log("[AmendmentService] Found amendments:", {
        contractId,
        count: data?.length || 0,
        amendments: data?.map((a) => ({
          id: a.id,
          contract_id: a.contract_id,
          amendment_no: a.amendment_no,
        })),
      });

      return data || [];
    } catch (error: any) {
      console.error("[AmendmentService] Failed to get amendments:", error);
      return [];
    }
  }

  /**
   * دریافت یک الحاقیه خاص
   */
  async getById(amendmentId: string): Promise<ContractAmendment | null> {
    try {
      const { data, error } = await supabase
        .from("contract_amendments")
        .select(
          `
          *,
          tariff_adjustments:amendment_tariff_adjustments(*)
        `,
        )
        .eq("id", amendmentId)
        .single();

      if (error) {
        console.error("[AmendmentService] Failed to get amendment:", error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error("[AmendmentService] Failed to get amendment:", error);
      return null;
    }
  }

  // متد به‌روزرسانی فایل‌های ضمیمه
  async updateAttachments(
    amendmentId: string,
    urls: string[],
    names: string[],
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("contract_amendments")
        .update({
          attachment_urls: urls,
          attachment_names: names,
        })
        .eq("id", amendmentId);

      if (error) {
        console.error(
          "[AmendmentService] Failed to update attachments:",
          error,
        );
        throw new Error(error.message);
      }

      console.log("[AmendmentService] Attachments updated:", {
        amendmentId,
        count: urls.length,
      });
    } catch (error: any) {
      console.error("[AmendmentService] Failed to update attachments:", error);
      throw new Error(error.message);
    }
  }

  /**
   * ایجاد الحاقیه جدید
   */
  async create(amendmentData: CreateAmendmentData): Promise<ContractAmendment> {
    try {
      let amendment_no = amendmentData.amendment_no;
      if (!amendment_no) {
        amendment_no = await this.generateAmendmentNo(
          amendmentData.contract_id,
        );
      }

      const amendmentId = `am_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[AmendmentService] Auth status:", {
        user: user?.id,
        email: user?.email,
        role: user?.role,
      });

      if (!user) {
        const { data: session } = await supabase.auth.getSession();
      }

      if (!user) {
        const { data: session } = await supabase.auth.getSession();
      }
      const { data: amendment, error: amendmentError } = await supabase
        .from("contract_amendments")
        .insert({
          id: amendmentId,
          contract_id: amendmentData.contract_id,
          amendment_no,
          amendment_types: amendmentData.amendment_types,
          effective_date: amendmentData.effective_date,
          previous_end_date: amendmentData.previous_end_date,
          new_end_date: amendmentData.new_end_date,
          previous_value: amendmentData.previous_value,
          new_value: amendmentData.new_value,
          description: amendmentData.description,
          attachment_urls: amendmentData.attachment_urls || [],
          attachment_names: amendmentData.attachment_names || [],
          approval_status: "PENDING",
        })
        .select()
        .single();

      if (amendmentError) {
        console.error(
          "[AmendmentService] Failed to create amendment:",
          amendmentError,
        );
        throw new Error(amendmentError.message);
      }

      // ذخیره تعدیل تعرفه‌ها
      if (
        amendmentData.tariff_adjustments &&
        amendmentData.tariff_adjustments.length > 0
      ) {
        for (const adjustment of amendmentData.tariff_adjustments) {
          const adjustmentId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const {
            data: { user },
          } = await supabase.auth.getUser();
          console.log("[AmendmentService] Auth status:", {
            user: user?.id,
            email: user?.email,
            role: user?.role,
          });

          const { error: adjustmentError } = await supabase
            .from("amendment_tariff_adjustments")
            .insert({
              id: adjustmentId,
              amendment_id: amendmentId,
              tariff_line_id: adjustment.tariff_line_id,
              adjustment_mode: adjustment.adjustment_mode,
              adjustment_percentage: adjustment.adjustment_percentage,
              previous_rate: adjustment.previous_rate,
              new_rate: adjustment.new_rate,
            });

          if (adjustmentError) {
            console.error(
              "[AmendmentService] Failed to create tariff adjustment:",
              adjustmentError,
            );
            throw new Error(adjustmentError.message);
          }
        }
      }

      const { data: contract } = await supabase
        .from("contracts")
        .select("contract_no, contract_title")
        .eq("id", amendmentData.contract_id)
        .single();

      const typeLabels = amendmentData.amendment_types
        .map((t) =>
          t === "DATE_EXTENSION"
            ? "📅 Date"
            : t === "VALUE_INCREASE"
              ? "💰 Value"
              : "📊 Tariff",
        )
        .join(", ");

      notificationService.create({
        type: "warning",
        category: "contract",
        title: `New Amendment: ${amendment_no}`,
        message: `Amendment for contract ${contract?.contract_no || amendmentData.contract_id} is pending approval. Types: ${typeLabels}`,
        actionUrl: `/contracts/${amendmentData.contract_id}`,
        metadata: {
          contractId: amendmentData.contract_id,
          amendmentId: amendment.id,
          contractNo: contract?.contract_no,
          amendmentNo: amendment_no,
          amendmentTypes: amendmentData.amendment_types,
        },
      });

      return amendment;
    } catch (error: any) {
      console.error("[AmendmentService] Failed to create amendment:", error);
      throw new Error(error.message);
    }
  }
  async approve(amendmentId: string, approvedBy: string): Promise<void> {
    try {
      const amendment = await this.getById(amendmentId);
      if (!amendment) {
        throw new Error("Amendment not found");
      }
      const { error } = await supabase
        .from("contract_amendments")
        .update({
          approval_status: "APPROVED",
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq("id", amendmentId);

      if (error) {
        throw new Error(error.message);
      }

      await this.applyAmendment(amendmentId);

      const { data: contract } = await supabase
        .from("contracts")
        .select("contract_no")
        .eq("id", amendment.contract_id)
        .single();

      notificationService.create({
        type: "success",
        category: "contract",
        title: `Amendment Approved: ${amendment.amendment_no}`,
        message: `Amendment for contract ${contract?.contract_no || amendment.contract_id} has been approved.`,
        actionUrl: `/contracts/${amendment.contract_id}`,
        metadata: {
          contractId: amendment.contract_id,
          amendmentId: amendment.id,
          contractNo: contract?.contract_no,
          amendmentNo: amendment.amendment_no,
        },
      });
    } catch (error: any) {
      console.error("[AmendmentService] Failed to approve amendment:", error);
      throw new Error(error.message);
    }
  }

  // 🔧 NEW: متد رد الحاقیه
  async reject(amendmentId: string, rejectionReason: string): Promise<void> {
    try {
      const amendment = await this.getById(amendmentId);
      if (!amendment) {
        throw new Error("Amendment not found");
      }
      const { error } = await supabase
        .from("contract_amendments")
        .update({
          approval_status: "REJECTED",
          rejection_reason: rejectionReason,
        })
        .eq("id", amendmentId);

      if (error) {
        console.error("[AmendmentService] Failed to reject amendment:", error);
        throw new Error(error.message);
      }

      const { data: contract } = await supabase
        .from("contracts")
        .select("contract_no")
        .eq("id", amendment.contract_id)
        .single();

      notificationService.create({
        type: "error",
        category: "contract",
        title: `Amendment Rejected: ${amendment.amendment_no}`,
        message: `Amendment for contract ${contract?.contract_no || amendment.contract_id} has been rejected. Reason: ${rejectionReason}`,
        actionUrl: `/contracts/${amendment.contract_id}`,
        metadata: {
          contractId: amendment.contract_id,
          amendmentId: amendment.id,
          contractNo: contract?.contract_no,
          amendmentNo: amendment.amendment_no,
          rejectionReason,
        },
      });

      console.log("[AmendmentService] Amendment rejected:", amendmentId);
    } catch (error: any) {
      console.error("[AmendmentService] Failed to reject amendment:", error);
      throw new Error(error.message);
    }
  }

  // src/features/contract-management/services/AmendmentService.ts

  // 🔧 NEW: متد همگام‌سازی amendments قدیمی
  async syncPendingAmendments(): Promise<void> {
    try {
      console.log("[AmendmentService] 🔄 Syncing pending amendments...");

      // 1. دریافت همه amendments با status PENDING
      const { data: pendingAmendments, error } = await supabase
        .from("contract_amendments")
        .select(
          `
        *,
        contracts!inner(contract_no, contract_title)
      `,
        )
        .eq("approval_status", "PENDING");

      if (error) {
        console.error(
          "[AmendmentService] Failed to fetch pending amendments:",
          error,
        );
        return;
      }

      if (!pendingAmendments || pendingAmendments.length === 0) {
        console.log("[AmendmentService] No pending amendments found");
        return;
      }

      console.log(
        `[AmendmentService] Found ${pendingAmendments.length} pending amendments`,
      );

      // 2. دریافت notifications موجود
      const existingNotifications = notificationService.getAll();

      // 3. ایجاد notification برای هر amendment که notification ندارد
      for (const amendment of pendingAmendments) {
        const contract = (amendment as any).contracts;

        // بررسی آیا notification قبلاً ایجاد شده
        const alreadyNotified = existingNotifications.some(
          (n) =>
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

          notificationService.create({
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

          console.log(
            `[AmendmentService] ✅ Created notification for amendment: ${amendment.id}`,
          );
        }
      }

      console.log("[AmendmentService] ✅ Sync complete");
    } catch (error: any) {
      console.error(
        "[AmendmentService] Failed to sync pending amendments:",
        error,
      );
    }
  }

  // دریافت الحاقیه‌های در انتظار تأیید
  async getPendingAmendments(): Promise<ContractAmendment[]> {
    try {
      const { data, error } = await supabase
        .from("contract_amendments")
        .select(
          `
        *,
        tariff_adjustments:amendment_tariff_adjustments(*)
      `,
        )
        .eq("approval_status", "PENDING")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "[AmendmentService] Failed to get pending amendments:",
          error,
        );
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error(
        "[AmendmentService] Failed to get pending amendments:",
        error,
      );
      return [];
    }
  }

  /**
   * اعمال الحاقیه روی قرارداد اصلی
   */
  // 🔧 FIX: اصلاح applyAmendment - فقط تغییرات انتخاب شده را اعمال کن
  async applyAmendment(amendmentId: string): Promise<void> {
    try {
      const amendment = await this.getById(amendmentId);
      if (!amendment) {
        throw new Error("Amendment not found");
      }

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", amendment.contract_id)
        .single();

      if (contractError || !contract) {
        throw new Error("Contract not found");
      }

      const updates: any = {};
      let hasContractUpdate = false;

      console.log("[AmendmentService] Applying amendment:", {
        id: amendmentId,
        types: amendment.amendment_types,
        has_date: amendment.amendment_types.includes("DATE_EXTENSION"),
        has_value: amendment.amendment_types.includes("VALUE_INCREASE"),
        has_tariff: amendment.amendment_types.includes("TARIFF_ADJUSTMENT"),
      });

      // 🔧 فقط اگر DATE_EXTENSION انتخاب شده باشد
      if (
        amendment.amendment_types.includes("DATE_EXTENSION") &&
        amendment.new_end_date
      ) {
        updates.end_date = amendment.new_end_date;
        hasContractUpdate = true;
        console.log(
          "[AmendmentService] ✅ Date extension applied:",
          amendment.new_end_date,
        );
      }

      // 🔧 فقط اگر VALUE_INCREASE انتخاب شده باشد
      if (
        amendment.amendment_types.includes("VALUE_INCREASE") &&
        amendment.new_value !== undefined
      ) {
        updates.total_value = amendment.new_value;
        hasContractUpdate = true;
        console.log(
          "[AmendmentService] ✅ Value increase applied:",
          amendment.new_value,
        );
      }

      // 🔧 فقط اگر TARIFF_ADJUSTMENT انتخاب شده باشد
      if (
        amendment.amendment_types.includes("TARIFF_ADJUSTMENT") &&
        amendment.tariff_adjustments &&
        amendment.tariff_adjustments.length > 0
      ) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const effectiveDate = new Date(amendment.effective_date);
        effectiveDate.setHours(0, 0, 0, 0);

        const isFutureAmendment = effectiveDate > today;

        for (const adjustment of amendment.tariff_adjustments) {
          const { data: currentTariff, error: tariffError } = await supabase
            .from("tariff_lines")
            .select("*")
            .eq("id", adjustment.tariff_line_id)
            .single();

          if (tariffError || !currentTariff) {
            throw new Error(`Tariff not found: ${adjustment.tariff_line_id}`);
          }

          if (isFutureAmendment) {
            // 🔧 اگر الحاقیه در آینده است، فقط valid_to را تنظیم کن
            await supabase
              .from("tariff_lines")
              .update({ valid_to: amendment.effective_date })
              .eq("id", adjustment.tariff_line_id);
          } else {
            // 🔧 اگر الحاقیه امروز یا گذشته است، archive کن
            await supabase
              .from("tariff_lines")
              .update({
                is_archived: true,
                valid_to: amendment.effective_date,
              })
              .eq("id", adjustment.tariff_line_id);
          }

          // ایجاد تعرفه جدید
          const newTariffId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await supabase.from("tariff_lines").insert({
            id: newTariffId,
            contract_id: currentTariff.contract_id,
            description: currentTariff.description,
            unit: currentTariff.unit,
            rate: adjustment.new_rate,
            total_quantity: currentTariff.total_quantity,
            consumed_quantity: 0,
            invoiced: 0,
            currency: currentTariff.currency,
            is_lump_sum: currentTariff.is_lump_sum,
            valid_from: amendment.effective_date,
            valid_to: null,
            is_archived: false,
            parent_tariff_id: adjustment.tariff_line_id,
            version: (currentTariff.version || 1) + 1,
          });

          console.log("[AmendmentService] ✅ Tariff adjusted:", {
            old_id: adjustment.tariff_line_id,
            new_id: newTariffId,
            old_rate: currentTariff.rate,
            new_rate: adjustment.new_rate,
          });
        }
      }

      // 🔧 فقط اگر تغییری در قرارداد هست، به‌روزرسانی کن
      if (hasContractUpdate) {
        updates.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from("contracts")
          .update(updates)
          .eq("id", amendment.contract_id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        console.log("[AmendmentService] ✅ Contract updated:", updates);
      }

      console.log(
        "[AmendmentService] Amendment applied successfully:",
        amendmentId,
      );
    } catch (error: any) {
      console.error("[AmendmentService] Failed to apply amendment:", error);
      throw new Error(error.message);
    }
  }

  /**
   * حذف الحاقیه
   */
  async delete(amendmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("contract_amendments")
        .delete()
        .eq("id", amendmentId);

      if (error) {
        console.error("[AmendmentService] Failed to delete amendment:", error);
        throw new Error(error.message);
      }

      console.log("[AmendmentService] Amendment deleted:", amendmentId);
    } catch (error: any) {
      console.error("[AmendmentService] Failed to delete amendment:", error);
      throw new Error(error.message);
    }
  }

  /**
   * دریافت آخرین الحاقیه یک قرارداد
   */
  async getLatestByContractId(
    contractId: string,
  ): Promise<ContractAmendment | null> {
    try {
      const { data, error } = await supabase
        .from("contract_amendments")
        .select(
          `
          *,
          tariff_adjustments:amendment_tariff_adjustments(*)
        `,
        )
        .eq("contract_id", contractId)
        .order("effective_date", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        console.error(
          "[AmendmentService] Failed to get latest amendment:",
          error,
        );
        return null;
      }

      return data;
    } catch (error: any) {
      console.error(
        "[AmendmentService] Failed to get latest amendment:",
        error,
      );
      return null;
    }
  }

  /**
   * بررسی آیا الحاقیه‌ای برای قرارداد وجود دارد
   */
  async hasAmendments(contractId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from("contract_amendments")
        .select("*", { count: "exact", head: true })
        .eq("contract_id", contractId);

      if (error) {
        console.error("[AmendmentService] Failed to check amendments:", error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error: any) {
      console.error("[AmendmentService] Failed to check amendments:", error);
      return false;
    }
  }
}

export const amendmentService = new AmendmentService();
