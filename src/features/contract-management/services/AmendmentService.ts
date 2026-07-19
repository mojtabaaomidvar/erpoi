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
import { publishEvent, EVENT_TYPES } from "@infra/events";

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
      throw new Error(error.message);
    }
  }

  /**
   * دریافت تمام الحاقیه‌های یک قرارداد
   */
  async getByContractId(contractId: string): Promise<ContractAmendment[]> {
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
        .order("effective_date", { ascending: false });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error: any) {
      return [];
    }
  }

  /**
   * دریافت یک الحاقیه خاص
   */
  // src/features/contract-management/services/AmendmentService.ts

  async getById(amendmentId: string): Promise<ContractAmendment | null> {
    try {
      const { data: amendment, error } = await supabase
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
        return null;
      }

      if (!amendment) {
        return null;
      }

      const result: ContractAmendment = {
        id: amendment.id,
        contract_id: amendment.contract_id,
        amendment_no: amendment.amendment_no,
        amendment_types: amendment.amendment_types || [],
        effective_date: amendment.effective_date,
        previous_end_date: amendment.previous_end_date,
        new_end_date: amendment.new_end_date,
        previous_value: amendment.previous_value,
        new_value: amendment.new_value,
        description: amendment.description,
        attachment_urls: amendment.attachment_urls || [],
        attachment_names: amendment.attachment_names || [],
        approval_status: amendment.approval_status,
        created_by: amendment.created_by,
        approved_by: amendment.approved_by,
        approved_at: amendment.approved_at,
        rejected_by: amendment.rejected_by,
        rejection_reason: amendment.rejection_reason,
        created_at: amendment.created_at,
        updated_at: amendment.updated_at,
        tariff_adjustments: amendment.tariff_adjustments || [],
      };

      return result;
    } catch (error: any) {
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
      const { data, error } = await supabase
        .from("contract_amendments")
        .update({
          attachment_urls: urls,
          attachment_names: names,
        })
        .eq("id", amendmentId)
        .select();

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * ایجاد الحاقیه جدید
   */
  // src/features/contract-management/services/AmendmentService.ts

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

      // اگر created_by ارسال نشده، از user فعلی استفاده کن
      const createdBy = amendmentData.created_by || user?.id || undefined;

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
          created_by: createdBy,
        })
        .select()
        .single();

      if (amendmentError) {
        throw new Error(amendmentError.message);
      }

      publishEvent(
        EVENT_TYPES.AMENDMENT_CREATED,
        {
          amendmentId: amendment.id,
          contractId: amendment.contract_id,
          amendmentNo: amendment.amendment_no || "",
          types: amendment.amendment_types,
          createdBy: createdBy || "",
        },
        { source: "AmendmentService", userId: createdBy },
      );

      // ذخیره تعدیل تعرفه‌ها
      if (
        amendmentData.tariff_adjustments &&
        amendmentData.tariff_adjustments.length > 0
      ) {
        for (const adjustment of amendmentData.tariff_adjustments) {
          const adjustmentId = `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
            throw new Error(adjustmentError.message);
          }
        }
      }

      //دریافت اطلاعات قرارداد
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

      // 🔧 FIX: نوتیفیکیشن فقط برای مدیران (به جز creator)
      if (createdBy) {
        const { data: managers } = await supabase
          .from("users")
          .select("id, role")
          .in("role", ["admin", "unit_manager"]);

        if (managers && managers.length > 0) {
          // 🔧 فیلتر: حذف creator از لیست مدیران
          const managersToNotify = managers.filter((m) => m.id !== createdBy);

          for (const manager of managersToNotify) {
            await notificationService.create({
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
                createdBy: createdBy,
              },
            });
          }
        }
      } else {
        // 🔧 اگر creator مشخص نیست، برای همه مدیران نوتیفیکیشن بفرست
        const { data: managers } = await supabase
          .from("users")
          .select("id, role")
          .in("role", ["admin", "unit_manager"]);

        if (managers && managers.length > 0) {
          for (const manager of managers) {
            await notificationService.create({
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
          }
        }
      }

      return amendment;
    } catch (error: any) {
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

      publishEvent(
        EVENT_TYPES.AMENDMENT_APPROVED,
        {
          amendmentId,
          contractId: amendment.contract_id,
          amendmentNo: amendment.amendment_no || "",
          approvedBy,
        },
        { source: "AmendmentService", userId: approvedBy },
      );

      // نوتیفیکیشن فقط برای creator (اگر creator ≠ approver)
      if (amendment.created_by && amendment.created_by !== approvedBy) {
        const { data: contract } = await supabase
          .from("contracts")
          .select("contract_no")
          .eq("id", amendment.contract_id)
          .single();

        await notificationService.create({
          type: "success",
          category: "contract",
          title: `Amendment Approved: ${amendment.amendment_no}`,
          message: `Your amendment for contract ${contract?.contract_no || amendment.contract_id} has been approved.`,
          actionUrl: `/contracts/${amendment.contract_id}`,
          metadata: {
            contractId: amendment.contract_id,
            amendmentId: amendment.id,
            contractNo: contract?.contract_no,
            amendmentNo: amendment.amendment_no,
            approvedBy: approvedBy,
          },
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async reject(
    amendmentId: string,
    rejectedBy: string,
    rejectionReason: string,
  ): Promise<void> {
    try {
      const amendment = await this.getById(amendmentId);
      if (!amendment) {
        throw new Error("Amendment not found");
      }

      // اطمینان از اینکه applyAmendment اجرا نشده
      if (amendment.approval_status === "APPROVED") {
        throw new Error("Cannot reject an already approved amendment");
      }

      const { error } = await supabase
        .from("contract_amendments")
        .update({
          approval_status: "REJECTED",
          rejected_by: rejectedBy,
          rejection_reason: rejectionReason,
        })
        .eq("id", amendmentId);

      if (error) {
        throw new Error(error.message);
      }

      publishEvent(
        EVENT_TYPES.AMENDMENT_REJECTED,
        {
          amendmentId,
          contractId: amendment.contract_id,
          amendmentNo: amendment.amendment_no || "",
          rejectedBy,
          reason: rejectionReason,
        },
        { source: "AmendmentService", userId: rejectedBy },
      );

      //  نوتیفیکیشن فقط برای creator (اگر creator ≠ rejecter)
      if (amendment.created_by && amendment.created_by !== rejectedBy) {
        const { data: contract } = await supabase
          .from("contracts")
          .select("contract_no")
          .eq("id", amendment.contract_id)
          .single();

        await notificationService.create({
          type: "error",
          category: "contract",
          title: `Amendment Rejected: ${amendment.amendment_no}`,
          message: `Your amendment for contract ${contract?.contract_no || amendment.contract_id} has been rejected. Reason: ${rejectionReason}`,
          actionUrl: `/contracts/${amendment.contract_id}`,
          metadata: {
            contractId: amendment.contract_id,
            amendmentId: amendment.id,
            contractNo: contract?.contract_no,
            amendmentNo: amendment.amendment_no,
            rejectedBy: rejectedBy,
            rejectionReason,
          },
        });
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // متد همگام‌سازی amendments قدیمی
  async syncPendingAmendments(): Promise<void> {
    try {
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
        return;
      }

      if (!pendingAmendments || pendingAmendments.length === 0) {
        return;
      }

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
        }
      }
    } catch (error: any) {}
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
        return [];
      }

      return data || [];
    } catch (error: any) {
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

      // 🔧 فقط اگر DATE_EXTENSION انتخاب شده باشد
      if (
        amendment.amendment_types.includes("DATE_EXTENSION") &&
        amendment.new_end_date
      ) {
        updates.end_date = amendment.new_end_date;
        hasContractUpdate = true;
      }

      // 🔧 فقط اگر VALUE_INCREASE انتخاب شده باشد
      if (
        amendment.amendment_types.includes("VALUE_INCREASE") &&
        amendment.new_value !== undefined
      ) {
        updates.total_value = amendment.new_value;
        hasContractUpdate = true;
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
      }
    } catch (error: any) {
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
        throw new Error(error.message);
      }
    } catch (error: any) {
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

        return null;
      }

      return data;
    } catch (error: any) {
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
        return false;
      }

      return (count || 0) > 0;
    } catch (error: any) {
      return false;
    }
  }
}

export const amendmentService = new AmendmentService();
